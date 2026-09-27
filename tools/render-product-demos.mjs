#!/usr/bin/env node
/**
 * Authored, offline product walkthroughs, not recordings of real sessions.
 * Run: node tools/render-product-demos.mjs [--preview | --verify]
 * No network, browser, credentials, package installation, or runtime calls.
 * Uses existing canvas/sharp packages; see assets/product-demos/README.md.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, writeFile, rm, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const script = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(script), '..');
const out = path.join(root, 'assets/product-demos');
const W = 960, H = 640, FPS = 10, SECONDS = 9, FRAMES = FPS * SECONDS;
const TIMELINE_SCALE = SECONDS / 8;
const names = ['strategy', 'team', 'evolution', 'vault'];
const mode = process.argv[2] || '--render';
assert(['--render', '--preview', '--verify'].includes(mode) && process.argv.length <= 3,
  'Usage: node tools/render-product-demos.mjs [--preview | --verify]');

// First prefer the sibling app's existing packages; never mutate package.json.
const moduleRoots = [
  path.join(root, '../agent/package.json'),
  path.join(root, '../agent/dashboard/package.json'),
  path.join(root, 'package.json'),
  process.env.PRODUCT_DEMOS_NODE_MODULES && path.join(process.env.PRODUCT_DEMOS_NODE_MODULES, '../package.json'),
  path.join(homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'),
].filter(Boolean);
function dependency(name) {
  for (const base of moduleRoots) {
    const require = createRequire(base);
    try { return { module: require(name), resolved: require.resolve(name) }; }
    catch (error) { if (error.code !== 'MODULE_NOT_FOUND') throw error; }
  }
  throw new Error(`${name} is unavailable. Ask the lead before installing dependencies.`);
}
const { module: canvasLib } = dependency('@napi-rs/canvas');
const { module: sharp } = dependency('sharp');
const { createCanvas, loadImage, GlobalFonts } = canvasLib;
const ffmpeg = process.env.FFMPEG || (existsSync('/opt/homebrew/bin/ffmpeg') ? '/opt/homebrew/bin/ffmpeg' : 'ffmpeg');
const ffprobe = process.env.FFPROBE || (existsSync('/opt/homebrew/bin/ffprobe') ? '/opt/homebrew/bin/ffprobe' : 'ffprobe');
const fontPaths = {
  sans: process.env.PRODUCT_DEMOS_SANS || '/System/Library/Fonts/Avenir Next.ttc',
  mono: process.env.PRODUCT_DEMOS_MONO || '/System/Library/Fonts/Menlo.ttc',
};
for (const [family, file] of Object.entries(fontPaths)) {
  assert(existsSync(file), `Missing ${family} font: set PRODUCT_DEMOS_${family.toUpperCase()}`);
  assert(GlobalFonts.registerFromPath(file, family === 'sans' ? 'Demo Sans' : 'Demo Mono'), `Could not load ${file}`);
}
const C = {
  ink: '#282532', muted: '#756e82', faint: '#a29aac', line: '#e8e2ed',
  white: '#ffffff', panel: '#f4f0fa', purple: '#8a63c7', purpleDark: '#7149ad',
  purpleLight: '#eee6f8', mint: '#6caf95', mintDark: '#38765e', mintLight: '#eaf4ee',
  red: '#a46b75', redLight: '#faedf0', amber: '#a7824b', cream: '#f6f1e8',
};
const images = {};
const sourceAssets = ['assets/nerya-logo.webp', ...['lead', 'researcher', 'reviewer', 'analyst', 'coder', 'risk'].map(r => `assets/agent-avatars/${r}.png`)];
for (const relative of sourceAssets) images[path.basename(relative).split('.')[0]] = await loadImage(path.join(root, relative));
await mkdir(out, { recursive: true });
const sha = data => createHash('sha256').update(data).digest('hex');
const digest = async file => sha(await readFile(file));
const clamp = n => Math.max(0, Math.min(1, n));
const ease = n => { n = clamp(n); return n * n * (3 - 2 * n); };
const progress = (t, start, end) => ease((t - start) / (end - start));
const lerp = (a, b, p) => a + (b - a) * p;
let ctx;

function group(alpha, draw, dx = 0, dy = 0) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha *= clamp(alpha); ctx.translate(dx, dy); draw(); ctx.restore();
}
function rect(x, y, w, h, fill = C.white, radius = 12, stroke) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, radius);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
}
function line(points, color = C.line, width = 1.5, dash = []) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash(dash);
  ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); ctx.restore();
}
function dot(x, y, r, color) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill(); }
function text(value, x, y, size = 18, color = C.ink, weight = 500, options = {}) {
  // Canvas' font shorthand parser needs CSS's standard 100-step weights.
  weight = Math.round(weight / 100) * 100;
  ctx.font = `${weight} ${size}px "${options.mono ? 'Demo Mono' : 'Demo Sans'}"`;
  ctx.fillStyle = color; ctx.textBaseline = 'alphabetic'; ctx.textAlign = options.align || 'left';
  if (options.maxWidth) assert(ctx.measureText(String(value)).width <= options.maxWidth + 1, `Text overflow: ${value}`);
  ctx.fillText(String(value), x, y); ctx.textAlign = 'left';
}
function lines(values, x, y, size = 18, color = C.ink, weight = 500, gap = 26) {
  values.forEach((value, i) => text(value, x, y + i * gap, size, color, weight));
}
function pill(label, x, y, { fill = C.panel, color = C.purpleDark, size = 15, w, icon: symbol } = {}) {
  ctx.font = `600 ${size}px "Demo Sans"`;
  w ||= ctx.measureText(label).width + (symbol ? 47 : 26);
  rect(x, y, w, 30, fill, 15);
  if (symbol) icon(symbol, x + 12, y + 7, 16, color);
  text(label, x + (symbol ? 35 : 13), y + 21, size, color, 600);
  return w;
}
function icon(name, x, y, s = 20, color = C.muted) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s / 24, s / 24);
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 1.8; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (name === 'check') line([[5, 12], [10, 17], [19, 7]], color, 2);
  else if (name === 'arrow') { line([[4, 12], [20, 12]], color, 1.8); line([[14, 6], [20, 12], [14, 18]], color, 1.8); }
  else if (name === 'up') { line([[12, 20], [12, 4]], color, 1.8); line([[6, 10], [12, 4], [18, 10]], color, 1.8); }
  else if (name === 'lock') {
    rect(5, 10, 14, 11, null, 3, color);
    ctx.beginPath(); ctx.moveTo(8, 10); ctx.lineTo(8, 7); ctx.arc(12, 7, 4, Math.PI, 0); ctx.lineTo(16, 10); ctx.stroke();
    dot(12, 15, 1.1, color); line([[12, 15], [12, 17]], color, 1.5);
  } else if (name === 'file') {
    line([[14, 3], [5, 3], [5, 21], [19, 21], [19, 8], [14, 3], [14, 8], [19, 8]], color, 1.6);
    line([[8, 13], [15, 13]], color, 1.6); line([[8, 17], [13, 17]], color, 1.6);
  } else if (name === 'branch') {
    line([[6, 5], [6, 18]], color, 1.8); line([[6, 13], [17, 13], [17, 6]], color, 1.8);
    [[6, 4], [6, 20], [17, 4]].forEach(([a, b]) => { dot(a, b, 2.5, color); dot(a, b, 1, C.white); });
  } else if (name === 'shield') {
    line([[12, 2], [20, 5], [19, 15], [16, 19], [12, 22], [8, 19], [5, 15], [4, 5], [12, 2]], color, 1.6);
    line([[8, 11], [11, 14], [16, 8]], color, 1.6);
  } else if (name === 'data') {
    [5, 11, 17].forEach(a => { rect(3, a, 18, 4, null, 2, color); dot(17, a + 2, .6, color); });
  } else if (name === 'signal') line([[2, 17], [6, 17], [9, 7], [13, 20], [17, 4], [20, 10], [23, 10]], color, 1.8);
  else if (name === 'code') { line([[8, 5], [2, 12], [8, 19]], color, 1.8); line([[16, 5], [22, 12], [16, 19]], color, 1.8); line([[14, 3], [10, 21]], color, 1.8); }
  else if (name === 'key') {
    ctx.beginPath(); ctx.arc(8, 8, 5, 0, Math.PI * 2); ctx.stroke();
    line([[12, 12], [21, 21], [21, 16]], color, 2); line([[17, 17], [20, 14]], color, 2);
  } else if (name === 'clock') {
    ctx.beginPath(); ctx.arc(12, 12, 9, 0, Math.PI * 2); ctx.stroke(); line([[12, 6], [12, 12], [16, 14]], color, 1.8);
  } else if (name === 'review') { rect(3, 3, 18, 15, null, 4, color); line([[7, 8], [17, 8]], color); line([[7, 12], [13, 12]], color); line([[7, 18], [7, 22], [12, 18]], color); }
  ctx.restore();
}
function avatar(name, x, y, size = 40) {
  ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, size, size, size * .32); ctx.clip();
  ctx.drawImage(images[name], x, y, size, size); ctx.restore();
}
function shadow(draw, strength = .08) {
  ctx.save(); ctx.shadowColor = `rgba(40,37,50,${strength})`; ctx.shadowBlur = 22; ctx.shadowOffsetY = 8; draw(); ctx.restore();
}
function spinner(x, y, t, size = 17, color = C.purple) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(x, y, size / 2, t * 4, t * 4 + Math.PI * 1.4); ctx.stroke(); ctx.restore();
}
function cursor(x, y, click = false) {
  if (click) { dot(x, y, 19, '#8a63c72b'); dot(x, y, 11, '#8a63c73d'); }
  ctx.save(); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 4, y + 25); ctx.lineTo(x + 10, y + 19); ctx.lineTo(x + 17, y + 27); ctx.lineTo(x + 22, y + 23); ctx.lineTo(x + 15, y + 15); ctx.lineTo(x + 24, y + 12); ctx.closePath(); ctx.fillStyle = C.ink; ctx.fill(); ctx.strokeStyle = C.white; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
}
function stageBase(kind, breadcrumb, status, statusDone = false) {
  rect(0, 0, W, H, kind === 'vault' ? '#e9e4f1' : kind === 'team' ? '#eaf1ed' : C.panel, 0);
  // Static fine paper grain, a restrained surround rather than noisy video.
  for (let y = 4; y < H; y += 8) for (let x = 4; x < W; x += 8) dot(x + (y % 3), y, .45, '#2825320b');
  shadow(() => rect(26, 28, 908, 576, C.white, 19), .07);
  rect(26, 28, 908, 576, null, 19, '#ded6e7');
  line([[27, 86], [933, 86]]);
  ctx.drawImage(images['nerya-logo'], 43, 38, 37, 37);
  text('Nerya', 88, 64, 19, C.ink, 700);
  text('/', 156, 64, 18, C.faint);
  text(breadcrumb, 177, 64, 17, C.muted);
  pill(status, 772, 43, { w: 139, fill: statusDone ? C.mintLight : C.panel, color: statusDone ? C.mintDark : C.purpleDark, size: 14, icon: statusDone ? 'check' : undefined });
  text('NERYA', 918, 626, 11, C.muted, 700, { align: 'right' });
}
function footer(steps, current) {
  line([[48, 558], [912, 558]]);
  let x = 64;
  steps.forEach((label, i) => {
    dot(x + 4, 582, 3.5, i <= current ? C.purple : '#d4cbdc');
    text(label, x + 17, 588, 15, i <= current ? C.ink : C.faint, i === current ? 700 : 500);
    x += 275;
  });
}
function taskRow(label, detail, y, t, start, end) {
  const p = progress(t, start, end), done = t >= end;
  if (done) { dot(79, y, 11, C.mintLight); icon('check', 71, y - 8, 16, C.mintDark); }
  else if (t >= start) spinner(79, y, t);
  else { ctx.beginPath(); ctx.arc(79, y, 8, 0, Math.PI * 2); ctx.strokeStyle = C.line; ctx.lineWidth = 1.5; ctx.stroke(); }
  text(label, 104, y + 6, 19, t >= start ? C.ink : C.faint, 600);
  text(done ? detail : t >= start ? 'Working…' : 'Queued', 104, y + 29, 15, done ? C.mintDark : C.muted);
  rect(104, y + 40, 245, 3, C.panel, 1.5); if (p > 0) rect(104, y + 40, 245 * p, 3, done ? C.mint : C.purple, 1.5);
}
function workflowNode(label, subtitle, x, y, w, symbol, visible, done) {
  group(visible, () => {
    rect(x, y, w, 67, C.white, 12, done ? '#c7ded2' : '#ddd2eb');
    rect(x + 12, y + 13, 38, 38, done ? C.mintLight : C.panel, 10);
    icon(symbol, x + 21, y + 22, 20, done ? C.mintDark : C.purple);
    text(label, x + 62, y + 29, 18, C.ink, 600);
    text(subtitle, x + 62, y + 50, 15, C.muted);
    if (done) icon('check', x + w - 30, y + 24, 18, C.mintDark);
  }, 0, (1 - visible) * 9);
}

function strategy(t) {
  const sent = progress(t, 1.55, 2.1), built = t >= 5.6;
  stageBase('strategy', 'Strategy / New workflow', built ? 'Review ready' : t < 1.55 ? 'New request' : 'Building', built);
  group(1 - sent, () => {
    pill('STRATEGY AUTHOR', 72, 131, { size: 12 });
    text('Start with the idea', 72, 207, 36, C.ink, 600);
    text('Nerya turns your request into a reviewable package.', 73, 247, 20, C.muted);
  });
  const bx = lerp(70, 60, sent), by = lerp(283, 113, sent), bw = lerp(820, 322, sent), bh = lerp(166, 124, sent);
  shadow(() => rect(bx, by, bw, bh, C.panel, 16, '#d9ccea'), .025);
  const prompt = ['Build a BTC trend strategy.', 'Add risk checks and a review step.'];
  group(1 - sent, () => {
    const count = Math.floor(lerp(16, prompt.join('').length, progress(t, .1, 1.35)));
    let consumed = 0;
    prompt.forEach((v, i) => { text(v.slice(0, Math.max(0, count - consumed)), bx + 24, by + 43 + i * 32, 24, C.ink, 500); consumed += v.length; });
    pill('Natural language', bx + 23, by + 119, { fill: C.white, size: 14 });
    rect(bx + bw - 68, by + bh - 61, 43, 40, t > 1.3 ? C.purpleDark : C.purple, 12);
    icon('up', bx + bw - 58, by + bh - 51, 23, C.white);
    if (t > 1.25) cursor(bx + bw - 40, by + bh - 33, t > 1.45);
  });
  group(sent, () => {
    text('YOUR REQUEST', 78, 140, 11, C.purpleDark, 700);
    lines(['Build a BTC trend strategy.', 'Add risk checks and review.'], 78, 173, 19, C.ink, 500, 28);
    text('TASK PROGRESS', 65, 273, 12, C.muted, 700);
    taskRow('Draft workflow', '4 connected steps', 301, t, 2.05, 3.3);
    taskRow('Write package', 'Configuration + code', 380, t, 3.25, 4.65);
    taskRow('Validate files', 'Ready for your review', 459, t, 4.6, 5.65);
    rect(409, 107, 502, 434, '#f8f6fb', 14);
    text('WORKFLOW', 432, 137, 12, C.muted, 700);
    pill('btc-trend', 772, 116, { size: 12, w: 114, fill: C.white, color: C.muted });
    const n1 = progress(t, 2.05, 2.4), n2 = progress(t, 2.55, 2.9), n3 = progress(t, 3.05, 3.4), n4 = progress(t, 3.35, 3.75);
    group(n2, () => { line([[656, 226], [656, 248]], C.purple, 1.7); dot(656, 239, 3, C.purple); });
    group(n3, () => line([[656, 316], [656, 331], [527, 331], [527, 349]], C.purple, 1.7));
    group(n4, () => line([[656, 331], [786, 331], [786, 349]], C.purple, 1.7));
    workflowNode('Market data', 'BTC · 1h candles', 527, 159, 267, 'data', n1, t > 3.3);
    workflowNode('Trend signal', 'EMA crossover', 527, 248, 267, 'signal', n2, t > 4.1);
    workflowNode('Risk gate', 'Sizing limits', 429, 349, 222, 'shield', n3, t > 4.8);
    workflowNode('Review', 'Independent check', 665, 349, 225, 'review', n4, t > 5.35);
    const packed = progress(t, 4.65, 5.2);
    group(packed, () => {
      rect(429, 438, 462, 82, C.white, 11, '#dcd3e6');
      icon('file', 446, 454, 22, C.purple);
      text('btc-trend/', 480, 472, 19, C.ink, 600);
      if (built) pill('Ready', 803, 451, { fill: C.mintLight, color: C.mintDark, size: 12, w: 70 });
      text('strategy.yml   strategy.py   README.md', 447, 500, 15, C.muted, 500, { mono: true, maxWidth: 426 });
    }, 0, (1 - packed) * 12);
  });
  footer(['Describe the idea', 'Follow the work', 'Inspect the package'], t < 1.55 ? 0 : t < 5.2 ? 1 : 2);
}

function team(t) {
  const done = t >= 5.75;
  stageBase('team', 'Agent Team / Research room', done ? 'Evidence ready' : 'In parallel', done);
  rect(27, 87, 192, 470, '#faf9fb', [0, 0, 0, 0]);
  line([[219, 87], [219, 557]]);
  text('MEMBERS', 47, 126, 12, C.muted, 700);
  const roster = [['lead', 'Lead', 'Coordinating'], ['researcher', 'Researcher', 'Researching'], ['reviewer', 'Reviewer', 'Reviewing']];
  roster.forEach(([id, title, subtitle], i) => {
    const y = 151 + i * 87;
    avatar(id, 44, y, 40);
    text(title, 94, y + 17, 16, C.ink, 600);
    text(done ? 'Complete' : subtitle, 94, y + 39, 12, done ? C.mintDark : C.muted);
    dot(77, y + 36, 5, done ? C.mint : C.purple);
  });
  line([[46, 432], [195, 432]]);
  text('One shared context', 45, 461, 14, C.muted, 500);
  lines(['Each member keeps', 'an independent role.'], 45, 490, 13, C.muted, 500, 21);
  text('Check the signal before packaging', 244, 128, 25, C.ink, 600);
  text('Task 024  /  Research + independent review', 245, 157, 15, C.muted);
  line([[568, 181], [568, 376]], C.line, 1, [3, 5]);
  const left = progress(t, .45, .85), right = progress(t, .7, 1.1);
  group(left, () => {
    avatar('researcher', 246, 185, 38);
    text('Researcher', 295, 208, 18, C.ink, 650);
    group(1 - progress(t, 1.35, 1.55), () => spinner(520, 204, t));
    group(progress(t, 1.25, 1.7), () => {
      lines(['Trend agrees across', '1h and 4h windows.'], 247, 258, 21, C.ink, 500, 30);
      group(progress(t, 2.4, 2.7), () => pill('E01  ·  candles.csv', 246, 310, { fill: C.mintLight, color: C.mintDark, size: 15 }));
      group(progress(t, 3.1, 3.4), () => text('Evidence attached', 247, 365, 14, C.mintDark));
    });
  }, 0, (1 - left) * 10);
  group(right, () => {
    avatar('reviewer', 596, 185, 38);
    text('Reviewer', 645, 208, 18, C.ink, 650);
    group(1 - progress(t, 1.5, 1.75), () => spinner(864, 204, t));
    group(progress(t, 1.5, 1.95), () => {
      lines(['Add a missing-data guard.', 'Keep sizing capped.'], 596, 258, 20, C.ink, 500, 30);
      group(progress(t, 2.6, 2.9), () => pill('E02  ·  risk-policy.yml', 595, 310, { fill: C.cream, color: '#8b6941', size: 15 }));
      group(progress(t, 3.3, 3.6), () => text('Constraint attached', 596, 365, 14, C.mintDark));
    });
  }, 0, (1 - right) * 10);
  const evidence = progress(t, 3.65, 4.1);
  group(evidence, () => {
    line([[403, 378], [403, 394], [722, 394], [722, 378]], '#c8d8ce', 1.5);
    line([[562, 394], [562, 411]], C.mint, 1.5);
    rect(241, 411, 663, 129, C.mintLight, 12);
    icon('file', 258, 426, 20, C.mintDark);
    text('Shared evidence', 288, 442, 19, C.ink, 650);
    pill('2 sources', 786, 422, { size: 12, fill: '#ffffffb8', color: C.mintDark, w: 100 });
    group(progress(t, 4.15, 4.45), () => { text('E01', 259, 478, 13, C.mintDark, 600, { mono: true }); text('Trend context', 306, 478, 17, C.ink, 600); text('1h + 4h', 861, 478, 16, C.muted, 500, { align: 'right' }); });
    group(progress(t, 4.6, 4.9), () => { text('E02', 259, 508, 13, C.mintDark, 600, { mono: true }); text('Guard + sizing cap', 306, 508, 17, C.ink, 600); text('Review retained', 861, 508, 16, C.muted, 500, { align: 'right' }); });
  }, 0, (1 - evidence) * 10);
  group(progress(t, 5.45, 5.8), () => { avatar('lead', 850, 183, 30); icon('check', 873, 203, 16, C.mintDark); });
  footer(['Assign distinct roles', 'Work in parallel', 'Collect shared evidence'], t < 1.2 ? 0 : t < 4.1 ? 1 : 2);
}

function evolution(t) {
  const diff = progress(t, 1.45, 1.85), validation = progress(t, 3.7, 4.05), approved = t >= 6.0;
  stageBase('evolution', 'Evolution / Session review', approved ? 'Approved' : t < 3.7 ? 'Proposed change' : 'Validating', approved);
  text('Session 021', 54, 135, 25, C.ink, 650);
  text('Missing-data pause', 54, 165, 17, C.muted);
  line([[54, 188], [257, 188]]);
  avatar('reviewer', 54, 208, 35);
  text('Review finding', 101, 230, 16, C.ink, 650);
  lines(['The source returned', 'no candles. Pause the', 'step before retrying.'], 54, 273, 17, C.muted, 500, 26);
  const stages = [['Review session', .2], ['Inspect diff', 1.6], ['Run validation', 3.75], ['Approve candidate', 6.0]];
  line([[65, 371], [65, 517]], C.line, 2);
  stages.forEach(([label, at], i) => {
    const y = 371 + i * 48, active = t >= at, finished = i < 3 ? t >= stages[i + 1][1] : approved;
    dot(65, y, 10, finished ? C.mintLight : active ? C.purpleLight : C.white);
    if (finished) icon('check', 57, y - 8, 16, C.mintDark);
    else dot(65, y, 3.5, active ? C.purple : '#d9d1e1');
    text(label, 86, y + 6, 16, active ? C.ink : C.faint, active ? 600 : 500);
  });
  line([[283, 106], [283, 539]]);
  group(1 - diff, () => {
    text('Review the session, not just the result', 309, 139, 24, C.ink, 600);
    text('EVENT TRACE', 311, 185, 12, C.muted, 700);
    const events = [['09:41:02', 'Requested market data', 'data'], ['09:41:03', 'Empty candle window', 'clock'], ['09:41:04', 'Retry scheduled', 'branch']];
    events.forEach(([time, label, symbol], i) => {
      const a = progress(t, i * .25, i * .25 + .3);
      group(a, () => { line([[333, 238 + i * 84], [333, 294 + i * 84]], C.line, 1.5); rect(312, 212 + i * 84, 42, 42, C.panel, 11); icon(symbol, 322, 222 + i * 84, 22, C.purple); text(time, 371, 229 + i * 84, 12, C.muted, 500, { mono: true }); text(label, 371, 255 + i * 84, 20, C.ink, 500); });
    });
  });
  group(diff, () => {
    text('Make the change inspectable', 308, 135, 26, C.ink, 600);
    text('Candidate v0.3.2  ·  Guard missing input', 310, 166, 16, C.muted);
    rect(309, 190, 599, 216, '#faf9fc', 12, C.line);
    rect(309, 190, 599, 42, C.panel, [12, 12, 0, 0]);
    icon('code', 324, 201, 18, C.muted);
    text('strategy.py', 352, 217, 14, C.ink, 600, { mono: true });
    text('+1  −1', 875, 217, 14, C.muted, 600, { align: 'right' });
    const code = [
      ['18', '  if candles.empty:', C.muted, null],
      ['19', '−     return retry()', C.red, C.redLight],
      ['19', '+     return pause("missing_data")', C.mintDark, '#e4f1e9'],
      ['20', '  return evaluate(candles)', C.muted, null],
    ];
    code.forEach(([number, content, color, fill], i) => {
      const y = 260 + i * 36;
      if (fill) rect(310, y - 22, 597, 34, fill, 0);
      text(number, 326, y, 13, C.faint, 500, { mono: true });
      text(content, 369, y, 18, color, 500, { mono: true, maxWidth: 516 });
    });
    group(validation, () => {
      const checks = [['Syntax', 4.15], ['Replay', 4.75], ['Risk rules', 5.3]];
      checks.forEach(([label, at], i) => {
        const x = 326 + i * 183;
        if (t >= at) icon('check', x, 426, 19, C.mintDark); else spinner(x + 10, 436, t, 15);
        text(label, x + 30, 443, 16, t >= at ? C.mintDark : C.muted, 600);
      });
      line([[309, 463], [908, 463]]);
      text(approved ? 'Approved candidate' : t >= 5.3 ? 'Validation passed' : 'Checking candidate…', 311, 496, 20, approved ? C.mintDark : C.ink, 600);
      text(approved ? 'Current version is unchanged.' : 'Approval is a separate step.', 311, 523, 15, C.muted);
      rect(710, 482, 196, 44, approved ? C.mintLight : t >= 5.3 ? C.purpleDark : C.panel, 10);
      if (approved) icon('check', 725, 494, 19, C.mintDark);
      text(approved ? 'Approved' : 'Approve candidate', approved ? 752 : 725, 510, 16, approved ? C.mintDark : t >= 5.3 ? C.white : C.faint, 650);
      if (t > 5.5 && t < 6.35) cursor(850 - progress(t, 5.5, 5.9) * 10, 525 - progress(t, 5.5, 5.9) * 18, t >= 5.9 && t < 6.1);
    });
  }, 0, (1 - diff) * 8);
  footer(['Review the session', 'Diff + validation', 'Approve a candidate'], t < 1.6 ? 0 : t < 6 ? 1 : 2);
}

function vault(t) {
  const sealed = t >= 1.1, handoff = progress(t, 1.8, 2.8), receive = progress(t, 2.8, 3.2), auth = t >= 5.55;
  stageBase('vault', 'Vault / Connector access', auth ? 'Authenticated' : 'Secret reference', auth);
  rect(48, 108, 312, 432, C.ink, 16);
  icon('lock', 69, 130, 21, '#d7c5ef');
  text('Local vault', 101, 149, 22, C.white, 650);
  pill('Locked', 247, 126, { fill: '#ffffff12', color: '#d9c9ee', w: 91, size: 13 });
  // A physical, closed lock distinguishes this scene from the other app views.
  ctx.save(); ctx.strokeStyle = '#4a415a'; ctx.lineWidth = 1;
  [64, 78].forEach(r => { ctx.beginPath(); ctx.arc(204, 268, r, 0, Math.PI * 2); ctx.stroke(); }); ctx.restore();
  rect(166, 249, 76, 67, '#4b3c63', 15, '#75608f');
  ctx.save(); ctx.strokeStyle = '#cab0e7'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(181, 249); ctx.lineTo(181, 231); ctx.arc(204, 231, 23, Math.PI, 0); ctx.lineTo(227, 249); ctx.stroke(); ctx.restore();
  dot(204, 278, 5, '#dac5f1'); line([[204, 280], [204, 291]], '#dac5f1', 4);
  group(progress(t, .75, 1.15), () => { dot(237, 310, 15, C.mint); icon('check', 226, 299, 22, C.ink); });
  text('bybit_demo', 70, 383, 19, C.white, 650);
  text('SECRET VALUE', 70, 414, 11, '#b7a8c7', 700);
  rect(68, 428, 271, 43, '#352e42', 8, '#554760');
  for (let i = 0; i < 12; i++) dot(85 + i * 13, 449, 2.9, '#d4c7e5');
  icon('lock', 306, 440, 17, '#ac99c2');
  text(sealed ? 'Encrypted at rest' : 'Storing locally…', 69, 507, 18, sealed ? '#a9d8c0' : '#d0c1df', 500);
  avatar('lead', 412, 117, 44);
  text('Agent workspace', 472, 145, 24, C.ink, 650);
  text('The Agent receives a reference', 412, 191, 20, C.muted);
  rect(412, 212, 482, 73, C.panel, 12, '#ddd2eb');
  group(1 - receive, () => text('Waiting for reference…', 437, 256, 18, C.faint));
  group(receive, () => {
    icon('key', 434, 236, 23, C.purpleDark);
    text('vault://demo/bybit', 471, 257, 22, C.purpleDark, 500, { mono: true });
    icon('check', 857, 237, 22, C.mintDark);
  });
  if (t >= 1.8 && t < 3) {
    const x = lerp(281, 566, handoff), y = lerp(367, 236, handoff);
    group(t < 2.8 ? 1 : 1 - progress(t, 2.8, 3), () => {
      shadow(() => rect(x - 72, y - 17, 146, 34, C.white, 9, '#c9b5e2'), .08);
      icon('key', x - 61, y - 9, 18, C.purpleDark); text('secret reference', x - 36, y + 5, 12, C.purpleDark, 650);
    });
  }
  line([[652, 286], [652, 359]], '#d6c9e4', 2, [4, 6]);
  group(progress(t, 3.15, 3.55), () => {
    const p = progress(t, 3.2, 4.1);
    dot(652, lerp(294, 351, p), 6, C.purple);
    text('Reference only', 675, 328, 15, C.purpleDark, 600);
  });
  rect(412, 362, 482, 139, C.white, 13, auth ? '#bcdac9' : '#ddd5e5');
  rect(430, 381, 44, 44, auth ? C.mintLight : C.panel, 11);
  icon('key', 440, 391, 24, auth ? C.mintDark : C.purple);
  text('Bybit connector', 490, 403, 23, C.ink, 650);
  text('Runtime authentication', 490, 431, 16, C.muted);
  line([[430, 447], [876, 447]]);
  const status = t < 3.75 ? 'Waiting for reference' : t < 4.55 ? 'Reference received' : t < 5.55 ? 'Resolving in runtime…' : 'Authenticated';
  if (auth) icon('check', 433, 464, 20, C.mintDark);
  else if (t > 3.75) spinner(443, 473, t, 15);
  else dot(443, 474, 4, C.faint);
  text(status, 465, 482, 18, auth ? C.mintDark : C.muted, 600);
  group(progress(t, 5.65, 6.05), () => text('No secret value in this Agent view.', 413, 532, 16, C.muted));
  footer(['Store locally', 'Pass a reference', 'Authenticate in runtime'], t < 1.8 ? 0 : t < 4.2 ? 1 : 2);
}

const films = { strategy, team, evolution, vault };
const meta = {
  strategy: {
    posterTime: 6.6,
    title: { en: 'From a request to a strategy', zh: '从一句话，到策略工作流' },
    caption: { en: 'Describe the idea, follow task progress, then inspect the workflow and package.', zh: '描述想法，跟随任务进度，再检查生成的工作流与策略包。' },
    stages: [{ time: 0, label: 'Natural-language request' }, { time: 2.1, label: 'Task progress and workflow assembly' }, { time: 4.8, label: 'Package files appear' }, { time: 5.7, label: 'Package ready for review' }],
    composition: 'Expanding composer becomes a task rail beside a branching workflow and file package.',
  },
  team: {
    posterTime: 6.5,
    title: { en: 'Independent roles. Shared evidence.', zh: '分工协作，共享证据' },
    caption: { en: 'Researcher and reviewer work in parallel; their sources and constraints stay attached.', zh: '研究员与审阅员并行工作，来源与约束汇入同一份证据。' },
    stages: [{ time: 0, label: 'Distinct member roles assigned' }, { time: 1.5, label: 'Parallel research and review messages' }, { time: 2.8, label: 'Citations attached independently' }, { time: 4.9, label: 'Shared evidence assembled' }],
    composition: 'Member rail, two parallel conversation lanes, and a shared evidence notebook.',
  },
  evolution: {
    posterTime: 6.6,
    title: { en: 'A review you can act on', zh: '把会话复盘，变成可审阅的改动' },
    caption: { en: 'Trace the session, inspect a concrete diff, validate it, and approve a candidate.', zh: '从会话记录定位问题，检查具体差异，通过验证后再批准候选版本。' },
    stages: [{ time: 0, label: 'Review a missing-data session' }, { time: 1.85, label: 'Concrete code diff' }, { time: 4, label: 'Candidate validation' }, { time: 6, label: 'Operator approves candidate; current version unchanged' }],
    composition: 'Session finding and review timeline beside an inline code diff, checks, and explicit approval.',
  },
  vault: {
    posterTime: 6.6,
    title: { en: 'Credentials stay behind the reference', zh: '凭据留在金库，Agent 使用引用' },
    caption: { en: 'Keep credentials encrypted locally, pass a secret reference, and authenticate in the connector runtime.', zh: '凭据在本地加密保存，传递密钥引用，由连接器运行时完成鉴权。' },
    stages: [{ time: 0, label: 'Masked local credential' }, { time: 1.1, label: 'Encrypted at rest' }, { time: 2.8, label: 'Opaque reference received by Agent' }, { time: 4.55, label: 'Connector resolves in runtime' }, { time: 5.55, label: 'Illustrated authentication completes' }],
    composition: 'Dark closed vault, moving reference token, Agent reference field, and connector authentication.',
  },
};

function render(name, frame) {
  const canvas = createCanvas(W, H); ctx = canvas.getContext('2d');
  const time = frame / FPS / TIMELINE_SCALE;
  films[name](time);
  // Return to the exact opening image before wrapping. The final state holds
  // for >1 second; no empty title slate and no jump-cut at the loop boundary.
  if (time >= 7.3) {
    const opening = createCanvas(W, H), previous = ctx;
    ctx = opening.getContext('2d'); films[name](0); ctx = previous;
    ctx.globalAlpha = progress(time, 7.3, 7.9); ctx.drawImage(opening, 0, 0); ctx.globalAlpha = 1;
  }
  return canvas;
}
async function previews(name) {
  const poster = render(name, Math.round(meta[name].posterTime * TIMELINE_SCALE * FPS));
  await sharp(poster.toBuffer('image/png')).webp({ quality: 88, effort: 6 }).toFile(path.join(out, `${name}-poster.webp`));
  const sheet = createCanvas(1300, 926); ctx = sheet.getContext('2d'); rect(0, 0, 1300, 926, '#f4f0fa', 0);
  // Each frame is displayed at 650px, matching the requested landing media size.
  const sampleTimes = [.8, 2.5, 4.8, 6.6].map(time => time * TIMELINE_SCALE);
  sampleTimes.forEach((time, i) => {
    const frame = render(name, Math.round(time * FPS)); ctx = sheet.getContext('2d');
    const x = i % 2 * 650, y = Math.floor(i / 2) * 463;
    ctx.drawImage(frame, x, y + 30, 650, 433.333);
    text(`${name.toUpperCase()}  /  ${time.toFixed(1)}s`, x + 24, y + 24, 14, C.muted, 650);
  });
  await sharp(sheet.toBuffer('image/png')).webp({ quality: 88, effort: 6 }).toFile(path.join(out, `${name}-storyboard.webp`));
}
async function run(binary, args) {
  try { return await exec(binary, args, { maxBuffer: 16 * 1024 * 1024 }); }
  catch (error) { throw new Error(`${path.basename(binary)} failed (${error.code}): ${(error.stderr || error.message).slice(-5000)}`); }
}
async function probe(file) {
  const { stdout } = await run(ffprobe, ['-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=codec_name,width,height,pix_fmt,r_frame_rate,avg_frame_rate,nb_read_frames:format=duration', '-of', 'json', file]);
  const data = JSON.parse(stdout); return { ...data.streams[0], duration: Number(data.format.duration) };
}
async function frameChanges(file) {
  const { stdout } = await run(ffmpeg, ['-v', 'error', '-i', file, '-f', 'framemd5', '-']);
  const frames = stdout.split('\n').filter(l => l && !l.startsWith('#')).map(l => l.split(',').at(-1).trim());
  return { decodedFrames: frames.length, distinctDecodedFrames: new Set(frames).size, firstLastDecodedEqual: frames[0] === frames.at(-1) };
}
async function fileMeta(filename) {
  const file = path.join(out, filename), bytes = (await stat(file)).size;
  const result = { file: `assets/product-demos/${filename}`, bytes, sha256: await digest(file) };
  if (/\.(gif|mp4)$/.test(filename)) {
    result.probe = await probe(file); result.animation = await frameChanges(file);
    assert.equal(result.probe.width, W); assert.equal(result.probe.height, H);
    assert.equal(Number(result.probe.nb_read_frames), FRAMES);
    assert(Math.abs(result.probe.duration - SECONDS) < .02, `${filename}: bad duration`);
    assert.equal(result.animation.decodedFrames, FRAMES);
    assert(result.animation.distinctDecodedFrames >= 35, `${filename}: insufficient frame progression`);
    if (filename.endsWith('.mp4')) {
      assert.equal(result.probe.codec_name, 'h264'); assert.equal(result.probe.pix_fmt, 'yuv420p');
      assert(bytes <= 500_000, `${filename} exceeds 0.5 MB (${bytes})`);
      const buffer = await readFile(file);
      assert(buffer.indexOf(Buffer.from('moov')) < buffer.indexOf(Buffer.from('mdat')), 'MP4 must be fast-start');
      result.fastStart = true;
    } else {
      assert.equal(result.probe.codec_name, 'gif'); assert(bytes <= 3_000_000, `${filename} exceeds 3 MB (${bytes})`);
      const buffer = await readFile(file), loopAt = buffer.indexOf(Buffer.from('NETSCAPE2.0'));
      assert(loopAt > 0 && buffer.readUInt16LE(loopAt + 13) === 0, 'GIF must loop forever');
      result.loopCount = 0;
    }
  } else {
    const image = await sharp(file).metadata(); result.width = image.width; result.height = image.height;
    if (filename.endsWith('-poster.webp')) { assert.equal(image.width, W); assert.equal(image.height, H); }
  }
  return result;
}

if (mode === '--preview') {
  for (const name of names) { await previews(name); console.log(`${name}: poster + 650px storyboard rendered`); }
} else if (mode === '--verify') {
  const manifest = JSON.parse(await readFile(path.join(out, 'manifest.json'), 'utf8'));
  assert.equal(manifest.generator.sha256, await digest(script), 'Generator changed: re-render before verification');
  for (const asset of manifest.inputs) assert.equal(await digest(path.resolve(root, asset.file)), asset.sha256, `Input changed: ${asset.file}`);
  for (const film of manifest.films) {
    for (const media of Object.values(film.media)) {
      const checked = await fileMeta(path.basename(media.file));
      assert.equal(checked.sha256, media.sha256, `Hash mismatch: ${media.file}`);
    }
    console.log(`${film.id}: hashes, dimensions, ${FRAMES} frames, ${SECONDS}s, animation, codec, loop, and size verified`);
  }
} else {
  const scratch = await mkdtemp(path.join(out, '.render-'));
  const records = [];
  try {
    for (const name of names) {
      await previews(name);
      const frameDir = path.join(scratch, name); await mkdir(frameDir);
      const hashes = [];
      for (let frame = 0; frame < FRAMES; frame++) {
        const image = render(name, frame), buffer = image.toBuffer('image/png');
        hashes.push(sha(buffer));
        await writeFile(path.join(frameDir, `${String(frame).padStart(3, '0')}.png`), buffer);
      }
      assert.equal(hashes[0], hashes.at(-1), `${name}: source loop boundary mismatch`);
      assert(new Set(hashes).size >= 35, `${name}: source frames do not progress`);
      const input = ['-hide_banner', '-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(frameDir, '%03d.png')];
      await run(ffmpeg, [...input, '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '26', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-threads', '1', '-map_metadata', '-1', path.join(out, `${name}.mp4`)]);
      await run(ffmpeg, [...input, '-filter_complex', '[0:v]split[a][b];[a]palettegen=max_colors=160:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle', '-loop', '0', '-threads', '1', path.join(out, `${name}.gif`)]);
      const media = {};
      for (const [key, file] of Object.entries({ gif: `${name}.gif`, mp4: `${name}.mp4`, poster: `${name}-poster.webp`, storyboard: `${name}-storyboard.webp` })) media[key] = await fileMeta(file);
      records.push({ id: name, ...meta[name], posterTime: Math.round(meta[name].posterTime * TIMELINE_SCALE * FPS) / FPS, stages: meta[name].stages.map(stage => ({ ...stage, time: Number((stage.time * TIMELINE_SCALE).toFixed(3)) })), chapterStarts: [0, 3, 6], width: W, height: H, fps: FPS, durationSeconds: SECONDS, frameCount: FRAMES, sourceDistinctFrames: new Set(hashes).size, sourceLoopBoundaryExact: true, media });
      console.log(`${name}: ${Math.round(media.gif.bytes / 1000)} KB GIF / ${Math.round(media.mp4.bytes / 1000)} KB H.264 / ${media.gif.animation.distinctDecodedFrames} distinct GIF frames`);
    }
    const sourceEvidence = '../agent/nerya/security/secrets.py';
    const inputs = await Promise.all([...sourceAssets, 'assets/agent-avatars/provenance.json', ...(existsSync(path.resolve(root, sourceEvidence)) ? [sourceEvidence] : [])].map(async file => ({ file, sha256: await digest(path.resolve(root, file)) })));
    const fontRecords = await Promise.all(Object.entries(fontPaths).map(async ([role, file]) => ({ role, file, sha256: await digest(file) })));
    const { stdout: version } = await run(ffmpeg, ['-version']);
    const manifest = {
      schema: 'nerya.authored-product-demos/v1',
      generator: { file: 'tools/render-product-demos.mjs', sha256: await digest(script), command: 'node tools/render-product-demos.mjs', previewCommand: 'node tools/render-product-demos.mjs --preview', verifyCommand: 'node tools/render-product-demos.mjs --verify' },
      specification: { width: W, height: H, aspectRatio: '3:2', fps: FPS, durationSeconds: SECONDS, frames: FRAMES, gifMaxBytes: 3_000_000, mp4MaxBytes: 500_000, language: 'en', captionLanguages: ['en', 'zh'], audio: false },
      provenance: {
        kind: 'authored-product-walkthrough', notSessionRecording: true,
        disclosure: { en: 'Authored product walkthrough with illustrative states. Not a real session recording; no account, model, credential, or connector is contacted.', zh: '人工编排的产品演示，使用示例状态；并非真实会话录屏，不连接账户、模型、凭据或连接器。' },
        visualMethod: 'Deterministic Node canvas UI drawing; original local PNG member portraits and WebP mascot; no image generation or browser capture.',
        credentialSafety: 'Mask dots and an invented vault://demo/bybit reference only. No secret value is generated, loaded, encoded, or authenticated. No algorithm is named.',
        vaultSourceVerification: { file: sourceEvidence, checkedSymbols: ['SecretMeta.ref', 'SecretVault._flush', 'SecretVault.resolve', 'SecretVault.public_ref'], supportedClaims: ['Encrypted persistence', 'vault:// references', 'Runtime secret resolution'], caveat: 'The authentication completion is an illustrative state, not evidence of a live connection. Locked refers to the closed/masked product depiction, not a verified runtime lock API.' },
        evolutionSafety: 'Checks and approval are authored example states. Approved candidate does not mean applied or deployed; current version remains unchanged.',
        tradingClaims: 'No returns, profit, account balances, live fills, or performance claims.',
        avatarIdentity: 'Original assets/agent-avatars/*.png are drawn unchanged; provenance and CC0 artwork notice remain in their existing directory.',
      },
      integration: { preferred: 'mp4', videoAttributes: ['autoplay', 'muted', 'loop', 'playsinline'], preload: 'none', posterFallback: true, reducedMotion: 'Show poster; start only on explicit user request.', controls: 'Host supplies pause/replay and optional GIF link. Video is not interactive product UI.', suggestedMediaWidthCssPx: [640, 760] },
      reproducibility: { node: process.version, canvas: dependency('@napi-rs/canvas/package.json').module.version, sharp: sharp.versions.sharp, ffmpeg: version.split('\n')[0], fonts: fontRecords, seed: 'No randomness, wall-clock values, or network inputs. Fixed frame timestamps and single-thread H.264 encoding.', note: 'Same inputs, fonts, and encoder/toolchain versions reproduce these outputs; different codecs/fonts may change bytes.' },
      inputs, films: records,
    };
    await writeFile(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
    console.log('All four films passed. manifest.json includes measured media and source hashes.');
  } finally {
    // Only the exact task-owned mkdtemp directory is removed; final media stay.
    await rm(scratch, { recursive: true, force: true });
  }
}
