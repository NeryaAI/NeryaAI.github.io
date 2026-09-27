#!/usr/bin/env node
/**
 * Real Nerya DOM recordings, exclusively through the already-owned Ego space20/p1.
 * No browser launch, UI drawing, visual DOM injection, live API, package install or space finish.
 * --probe captures ignored PNG frames + evidence only. It NEVER encodes final media.
 * --record requires an explicit --avatars-confirmed after the lead's confirmation.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, writeFile, copyFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import rolePortraits from '../agent-avatars.js';

const exec = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'assets/product-recordings');
const base = 'http://127.0.0.1:4173/demo/index.html';
const width = 1280, height = 800, seconds = 16, maxSeconds = 24;
const pixelRatio = 2, pixelWidth = width * pixelRatio, pixelHeight = height * pixelRatio;
const roles = rolePortraits.roles;
const sha = value => createHash('sha256').update(value).digest('hex');
const digest = async file => sha(await readFile(file));
const sleep = ms => new Promise(resolve => setTimeout(resolve, Math.max(0, ms)));

export const plans = {
  strategy: { route: '/chat', prompt: '创建 BTC 趋势策略，4h 周期，仓位上限 5%，先完成独立审阅。', result: '验证清单', story: 'Type the strategy brief, inspect the generated validation plan, open the actual BTC workflow.' },
  team: { route: '/chat', prompt: '研究 BTC 趋势与成交量，让研究员、审阅员和风控角色分别核查证据。', result: '团队保留的分歧', story: 'Compare researcher, reviewer and risk critic; continue one member with a bounded instruction.' },
  evolution: { route: '/chat', prompt: '复盘最近 18 次模拟会话，提出更稳妥的配置，并在应用前展示变更。', result: 'max_position_pct', story: 'Review the native conversation diff, evidence and unchanged-runtime disclosure. No approval/application is claimed.' },
  vault: { route: '/env-vault', story: 'Inspect seeded synthetic references, type a clearly fake reference in the native form and save only to an in-memory fixture.' },
  markets: { route: '/strategies', story: 'Open genuine workflow canvases for crypto, prediction markets, futures and A-shares.' },
  integrations: { route: '/chat', prompt: '接入 ExampleX 交易所，先检查 CCXT 桥接，再编写只读行情与账户连接器，订单权限保持关闭。', result: '订单权限保持关闭', story: 'Type an exchange-authoring request and read the native integration plan. This is not a verified live connection or generated-and-tested connector.' },
};

// Snapshot refs are discovered afresh before each action; never invent coordinates.
export function targets(snapshot, role, name) {
  const lines = snapshot.split('\n'), found = [];
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^(\s*)([a-z_]+)(?: "([^"]*)")? \[ref=(\d+)/);
    if (!match || (match[2] !== role && !(role === 'textbox' && ['comboboxgrouping','textfield','searchbox'].includes(match[2])))) continue;
    const children = [];
    for (let j = i + 1; j < lines.length && lines[j].search(/\S/) > match[1].length; j++) children.push(lines[j]);
    const text = [match[3] || '', ...children.map(line => line.match(/\btext "(.*)"/)?.[1] || '')].join(' ').trim();
    if (text.includes(name) || (role === 'textbox' && lines[i].includes(`placeholder="${name}"`))) {
      found.push({ ref: '@' + match[4], text, evidence: [lines[i], ...children].join('\n') });
    }
  }
  return found;
}

async function inputs(page) {
  const paths = ['index.html', 'app.js', 'app.css', 'global.css', 'theme.js', 'source-manifest.json', ...roles.map(r => `avatars/${r}.png`)];
  // Supplemental bootstrap/fixture imports must be evidenced too, not just app.js.
  const discovered = await page.evaluate(() => [...new Set([
    ...Array.from(document.scripts, node => node.src),
    ...Array.from(document.querySelectorAll('link[href]'), node => node.href),
    ...performance.getEntriesByType('resource').map(entry => entry.name),
  ])].filter(value => { try { const url = new URL(value); return url.protocol === 'http:' && url.origin === location.origin && !url.pathname.startsWith('/api/'); } catch { return false; } }));
  const urls = [...new Set([...paths.map(relative => new URL(relative, base).href), ...discovered])].sort();
  const rows = [];
  for (const url of urls) {
    const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(10000) });
    assert(response.ok, `Missing served source ${url}: ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    rows.push({ url, bytes: bytes.length, sha256: sha(bytes) });
  }
  return rows;
}

function assertLocal(url) {
  const parsed = new URL(url);
  assert.equal(parsed.origin, 'http://127.0.0.1:4173', 'Never record or operate a live runtime');
  assert.equal(parsed.pathname, '/demo/index.html', 'Only the isolated bundled demo is authorized');
}

export async function runInEgo(options, getTaskSpace) {
  const { name, mode, folder, avatarsConfirmed } = options;
  const progress = stage => writeFile(path.join(folder, 'progress.json'), JSON.stringify({ stage, at: new Date().toISOString() }) + '\n');
  await progress('entered recorder');
  const plan = plans[name];
  assert(plan && ['probe', 'record'].includes(mode));
  assert(mode !== 'record' || avatarsConfirmed, 'Wait for the lead to confirm the new avatar assets');
  console.log(`Preparing ${name}: resume space20/p1`);
  const task = await getTaskSpace(20), page = task.page('p1');
  await progress('resumed task space');
  assert.equal(task.ownership, 'agent', 'Stop if the space is no longer agent-owned');
  assertLocal(await page.url());
  await progress('confirmed local page');
  await mkdir(folder, { recursive: true });
  // CDP signature checked against ChromeDevTools browser_protocol.json.
  console.log(`Preparing ${name}: open native route`);
  await page.cdp('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: pixelRatio, mobile: false });
  await page.goto(base + '#' + plan.route);
  await progress('navigated');
  await page.reload(); // Resets this demo's memory-only fixtures, not browser storage.
  await progress('reloaded');
  await page.waitForSelector('loc=css:a[aria-label="收件箱"]');
  assertLocal(await page.url());
  const safety = await page.evaluate(() => ({
    demo: document.documentElement.dataset.demo,
    csp: document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content,
    viewport: [innerWidth, innerHeight], dpr: devicePixelRatio,
  }));
  assert.equal(safety.demo, 'real-agent');
  assert(safety.csp.includes("connect-src 'none'"), 'Missing isolated-demo network boundary');
  assert.deepEqual(safety.viewport, [width, height]);
  assert.equal(safety.dpr,pixelRatio,'Require native high-density rasterization');
  await page.evaluate(async () => { await document.fonts.ready; return true; });
  let started = 0, running = false, sequence = 0;
  const actions = [], snapshots = [], frames = [];
  const clock = () => started ? Number(((performance.now() - started) / 1000).toFixed(4)) : null;
  async function observe(label) {
    const snapshot = await page.snapshot({ scope: 'full_page', includeStableLocator: true });
    const file = `snapshot-${String(sequence++).padStart(3, '0')}.txt`;
    await writeFile(path.join(folder, file), snapshot);
    snapshots.push({ file, label, t: clock(), sha256: sha(snapshot) });
    assert(!snapshot.includes('Demo unavailable'), `${name}: demo render error; see ${file}`);
    return snapshot;
  }
  async function target(role, name, index) {
    const snapshot = await observe(`${role}: ${name}`), matches = targets(snapshot, role, name);
    assert(index !== undefined ? matches[index] : matches.length === 1,
      `${role} ${JSON.stringify(name)} has ${matches.length} snapshot matches; re-inspect, do not guess`);
    const item=matches[index??0];
    // Raw screenshot CDP calls invalidate Ego's ephemeral @refs. Resolve the
    // observed native target to a non-visual data tag before the real input.
    const tag=`capture-${sequence++}`;
    const found=await page.evaluate(({role,name,index,tag})=>{
      const selector=role==='anchor'?'a':role==='tab'?'[role="tab"]':role==='textbox'?'input,textarea,[contenteditable="true"]':'button,[role="button"]';
      const norm=text=>String(text||'').replace(/\s+/g,'');
      const nodes=[...document.querySelectorAll(selector)].filter(el=>{
        const rect=el.getBoundingClientRect();if(!rect.width||!rect.height||getComputedStyle(el).visibility==='hidden')return false;
        return [el.getAttribute('aria-label'),el.getAttribute('placeholder'),el.innerText].some(text=>norm(text).includes(norm(name)));
      });
      const node=nodes[index];if(!node)return {count:nodes.length};
      node.setAttribute('data-native-record-target',tag);return {count:nodes.length,selector:`[data-native-record-target="${tag}"]`};
    },{role,name,index:index??0,tag});
    assert(found.selector,`Observed ${role} ${name} no longer exists`);
    if(index===undefined)assert.equal(found.count,1,`Ambiguous native ${role} ${name}`);
    return {...item,ref:found.selector,snapshotRef:item.ref};
  }
  async function click(role, name, label = name, index) {
    const item = await target(role, name, index), start = clock();
    await page.click(item.ref, { label });
    actions.push({ t: start, end: clock(), kind: 'native-click', role, name, ref: item.ref,
      snapshot: snapshots.at(-1).file, url: await page.url() });
  }
  async function type(role, name, text, index) {
    const item = await target(role, name, index), start = clock();
    await page.click(item.ref, { label: '输入演示要求' });
    // Small native input calls let screenshot requests interleave with actual typing.
    // One long keyboard.type call serializes the page connection and hides intermediate input.
    const glyphs = Array.from(text);
    await page.keyboard.press('ControlOrMeta+A');
    for (let i = 0; i < glyphs.length; i += 3) {
      await page.keyboard.type(glyphs.slice(i, i + 3).join(''), { delay: 24 });
      if (started) await sleep(40);
    }
    actions.push({ t: start, end: clock(), kind: 'native-type', name, text, ref: item.ref, snapshot: snapshots.at(-1).file });
  }
  async function waitText(text) {
    await page.waitForFunction(value => document.body.innerText.includes(value), text, { timeout: 10000 });
  }
  async function at(t, action) { await sleep(t * 1000 - (performance.now() - started)); if (action) await action(); }
  async function scroll(delta) {
    // The center is computed from the current native main element, not invented UI.
    const point = await page.evaluate(() => { const r = document.querySelector('main')?.getBoundingClientRect(); return r ? { x: r.x + r.width * .65, y: r.y + r.height * .6 } : { x: innerWidth * .7, y: innerHeight * .55 }; });
    const t = clock(); await page.mouse.move(point.x, point.y, { steps: 8, label: '查看后续内容' });
    await page.mouse.wheel(0, delta, { label: '缓慢滚动内容' });
    actions.push({ t, end: clock(), kind: 'native-scroll', deltaY: delta, viewportPoint: point });
  }
  async function submit(prompt, result) {
    await type('textbox', '给 Nerya 发消息', prompt);
    await click('button', '发送', '提交演示要求');
    await waitText(result);
  }
  // Seed a new team through the real composer: current old seeded history can stick loading.
  if (name === 'team') {
    console.log('Preparing team: native composer and member pane');
    await submit(plan.prompt, plan.result);
    const snap = await observe('prepared team');
    if (targets(snap, 'tab', '成员').length) await click('tab', '成员');
    else await click('button', '3 个 agent', '打开团队成员');
    await click('tab', 'researcher');
    for (let i = 0; i < 20; i++) {
      const snapshot = await observe('tidy demo workspace tabs');
      const unnecessary = targets(snapshot, 'button', '关闭标签页:').find(t => !/关闭标签页: (成员|文件)$/.test(t.text));
      if (!unnecessary) break;
      await page.click(unnecessary.ref, { label: '整理演示工作区' });
    }
    await click('tab', '成员');
  }
  if (name === 'vault') {
    const state = await page.evaluate(async () => {
      const response = await fetch('/api/proxy/security/secrets/list', { method: 'POST', body: '{}' });
      return response.json();
    });
    assert(Array.isArray(state.refs) && state.refs.length,
      'Vault fixture gap: POST /security/secrets/list must return synthetic refs; /security/secrets/put must persist memory-only metadata');
  }
  await observe('ready');
  console.log(`Preparing ${name}: hash served sources including supplemental imports`);
  const sourceBefore = await inputs(page);
  await progress('hashed served sources');
  if (mode === 'record') {
    for (const role of roles) {
      assert.equal(sourceBefore.find(r => r.url.endsWith(`/avatars/${role}.png`)).sha256,
        await digest(path.join(root, 'assets/agent-avatars', role + '.png')),
        `${role}: preview still serves a stale avatar. Ask the lead to refresh served assets.`);
    }
  }
  console.log(`Capturing ${name}: real screenshot polling for ${seconds}s`);
  const manifest = { schema: 'nerya-native-recording/v1', name, mode, status: 'capturing', recordedAt: new Date().toISOString(),
    sourceUrl: base + '#' + plan.route, recorderSha256: await digest(fileURLToPath(import.meta.url)),
    browser: { backend: 'ego-browser', space: 20, page: 'p1' },
    viewport: { width, height, deviceScaleFactor: pixelRatio }, safety,
    disclosure: 'Actual screen recording of the source-backed Nerya app with deterministic data; no live accounts, model requests or orders. This is not drawn or recreated UI.',
    capture: { method: 'Ego Page.cdp Page.captureScreenshot native DPR2 PNG', pixelWidth, pixelHeight, targetFps: 10, osCursorCaptured: false, targetSeconds: seconds, maxSeconds,
      timestamp: 'monotonic host clock at screenshot request/response midpoint', timing: 'real elapsed time; no speed-up',
      modifications: 'none; only frame repetition, PNG-to-video encoding and GIF palette conversion' },
    story: plan.story, sourceInputs: sourceBefore, actions, snapshots, frames,
  };
  started = performance.now(); running = true;
  const capture = (async () => {
    while (running && clock() < maxSeconds + 2) {
      const begin = performance.now(), file = `frame-${String(frames.length).padStart(5, '0')}.png`;
      // Page.screenshot({scale:'css'}) downsamples Retina output. Preserve the
      // renderer's physical pixels; never resize a 1x recording into fake HD.
      const screenshot=await page.cdp('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
      const bytes=Buffer.from(screenshot.data,'base64');
      assert.equal(bytes.readUInt32BE(16),pixelWidth);assert.equal(bytes.readUInt32BE(20),pixelHeight);
      await writeFile(path.join(folder,file),bytes);
      const end = performance.now();
      frames.push({ file, t: Number(((begin + end) / 2 / 1000 - started / 1000).toFixed(4)),
        requestSeconds: Number(((end - begin) / 1000).toFixed(4)), sha256: await digest(path.join(folder, file)) });
      await sleep(100 - (performance.now() - begin));
    }
  })();
  try {
    if (name === 'strategy') {
      await at(.7, () => submit(plan.prompt, plan.result));
      await at(7.5, () => click('anchor', '策略', '检查策略包', 0));
      await click('button', '打开策略：BTC 趋势跟随', '打开实际工作流');
      await page.waitForSelector('loc=role:region[name*="工作流画布"]');
      await at(11.5, () => click('button', '编辑详情: 独立审阅员', '检查独立审阅节点'));
    } else if (name === 'team') {
      await at(2, () => click('tab', 'reviewer', '比较独立审阅'));
      await at(5, () => click('tab', 'risk_critic', '检查风险意见'));
      await at(7.5, () => type('textbox', '继续与 risk_critic', '补查量能与反向情景，保留 5% 上限。'));
      await at(10, () => click('button', '继续此 agent', '延续当前成员上下文'));
      await waitText('增加独立的证据检查');
    } else if (name === 'evolution' || name === 'integrations') {
      await at(.7, () => submit(plan.prompt, plan.result));
      const snapshot = await observe('generated result');
      if (targets(snapshot, 'button', '收起工作区').length) await click('button', '收起工作区', '展开审阅正文', 0);
      await at(10, () => scroll(-300));
      await at(13, () => scroll(190));
    } else if (name === 'markets') {
      for (const [time, title, id] of [[1, 'BTC 趋势跟随', 'btc_trend_guard'], [4.4, '事件概率与证据核查', 'event_probability'], [8.1, '期货期限结构', 'futures_term_structure'], [11.8, 'A 股因子轮动', 'ashare_factor_rotation']]) {
        await at(time);
        if (time > 1) await click('anchor', '所有策略', '返回市场策略列表');
        await click('button', `打开策略：${title}`, `查看${title}`);
        await page.waitForFunction(expected => new URLSearchParams(location.hash.split('?')[1] || '').get('strategy_id') === expected, id, { timeout: 2500 });
        const heading = await target('button', '切换策略'), t = clock();
        assert(heading.text.includes(title), `Wrong native market heading: ${heading.text}`);
        actions.push({ t, kind: 'verified-market-route', expectedStrategyId: id, title, url: await page.url(), snapshot: snapshots.at(-1).file });
        // Native hover brings the actual heading back into view after a lower list card.
        await page.hover(heading.ref, { label: '查看当前市场策略' });
        actions.push({ t, end: clock(), kind: 'native-hover', ref: heading.ref, name: '切换策略', snapshot: snapshots.at(-1).file });
      }
    } else if (name === 'vault') {
      await at(2, () => scroll(380));
      await at(4, () => type('textbox', 'mcp_fred_api_key', 'recording_read_only'));
      await type('textbox', 'mcp.read, env', 'market.read');
      // This known non-secret is the only value this recorder is allowed to type.
      await type('textbox', 'paste secret value', 'recording-only-placeholder', 1);
      await at(11, () => click('button', '保存 vault 引用', '保存隔离演示引用'));
      await waitText('vault://recording_read_only');
      const saved = await observe('saved synthetic vault reference');
      assert(saved.includes('vault://recording_read_only'));
      const t = clock();
      await page.hover('text="vault://recording_read_only"', { label: '查看已保存演示引用' });
      actions.push({ t, end: clock(), kind: 'native-hover', name: 'vault://recording_read_only', snapshot: snapshots.at(-1).file });
    }
    await at(seconds);
    manifest.duration = clock();
    assert(manifest.duration <= maxSeconds, `Choreography ran ${manifest.duration}s; edit actual recorded idle time before publishing`);
    manifest.status = mode === 'probe' ? 'probe-only-not-final' : 'captured';
  } catch (error) {
    manifest.status = 'blocked'; manifest.error = error.message;
    throw error;
  } finally {
    running = false;
    await capture;
    manifest.duration = clock();
    manifest.finalUrl = await page.url();
    await observe('end');
    manifest.demoRequests = await page.evaluate(() => window.__demoRequests || []);
    manifest.demoErrors = await page.evaluate(() => window.__demoErrors || []);
    manifest.sourceInputsAfter = await inputs(page);
    manifest.sourceStable = JSON.stringify(sourceBefore) === JSON.stringify(manifest.sourceInputsAfter);
    await writeFile(path.join(folder, 'capture.json'), JSON.stringify(manifest, null, 2) + '\n');
  }
  assert(manifest.sourceStable, 'The demo bundle/assets changed during capture. Retake after the lead completes the build.');
  assert(!manifest.demoErrors.length, 'Demo errors present; do not encode');
  assert(frames.length >= 25, `Only ${frames.length} actual frames; investigate capture performance`);
  console.log(JSON.stringify({ name, mode, folder, frames: frames.length, duration: manifest.duration, space: 20, page: 'p1', status: manifest.status }));
  // Deliberately no finish(), handOff(), or tab close: the lead still owns final QA.
}

export function concatText(frames, duration, folder) {
  assert(frames.length > 1 && duration > frames.at(-1).t);
  return 'ffconcat version 1.0\n' + frames.map((frame, i) => {
    const from = i === 0 ? 0 : frame.t, until = frames[i + 1]?.t ?? duration;
    assert(until > from);
    return `file '${path.join(folder, frame.file).replaceAll("'", "'\\''")}'\nduration ${(until - from).toFixed(6)}\n`;
  }).join('') + `file '${path.join(folder, frames.at(-1).file).replaceAll("'", "'\\''")}'\n`;
}

async function mediaInfo(file) {
  return JSON.parse((await exec('ffprobe', ['-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', file], { maxBuffer: 2e6 })).stdout);
}
async function validateMedia(file, type) {
  const info = await mediaInfo(file), video = info.streams.find(s => s.codec_type === 'video');
  assert(video, file); assert.equal(video.width, pixelWidth); assert.equal(video.height, pixelHeight);
  if (type !== 'poster') {
    assert(Number(video.nb_read_frames) > 1, `${file} is not an animation`);
    assert(Number(info.format.duration) >= 10 && Number(info.format.duration) <= maxSeconds + .25);
  }
  if (type === 'gif') assert.equal((await readFile(file)).subarray(0, 6).toString(), 'GIF89a');
  return { file: path.basename(file), bytes: (await stat(file)).size, sha256: await digest(file),
    width: video.width, height: video.height, codec: video.codec_name, frames: Number(video.nb_read_frames), duration: Number(info.format.duration) || null };
}
export async function encode(name, folder) {
  const manifest = JSON.parse(await readFile(path.join(folder, 'capture.json'), 'utf8'));
  assert.equal(manifest.name, name); assert.equal(manifest.mode, 'record');
  assert.equal(manifest.status, 'captured'); assert(manifest.sourceStable);
  assert(new Set(manifest.frames.map(f => f.sha256)).size >= 5, 'Need real changing native frames');
  const concat = path.join(folder, 'frames.ffconcat');
  await writeFile(concat, concatText(manifest.frames, manifest.duration, folder));
  const files = { mp4: `${name}.mp4`, gif: `${name}.gif`, poster: `${name}-poster.webp` };
  const common = ['-hide_banner', '-loglevel', 'error', '-y', '-safe', '0', '-f', 'concat', '-i', concat];
  await exec('ffmpeg', [...common, '-t', String(manifest.duration), '-vf', 'fps=24', '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', path.join(folder, files.mp4)], { maxBuffer: 2e6 });
  await exec('ffmpeg', [...common, '-t', String(manifest.duration), '-filter_complex', 'fps=10,split[a][b];[a]palettegen=stats_mode=full:max_colors=256:reserve_transparent=0[p];[b][p]paletteuse=dither=none:diff_mode=rectangle', '-loop', '0', path.join(folder, files.gif)], { maxBuffer: 2e6 });
  const posterTime = { strategy: 10, integrations: 9.5 }[name];
  const poster = (posterTime !== undefined
    ? manifest.frames.reduce((best, frame) => Math.abs(frame.t - posterTime) < Math.abs(best.t - posterTime) ? frame : best)
    : manifest.frames.at(-1)).file;
  await exec('cwebp', ['-quiet', '-lossless', '-z', '6', '-metadata', 'icc', path.join(folder, poster), '-o', path.join(folder, files.poster)], { maxBuffer: 2e6 });
  const outputs = [];
  for (const [type, file] of Object.entries(files)) outputs.push(await validateMedia(path.join(folder, file), type));
  await mkdir(out, { recursive: true });
  for (const file of Object.values(files)) await copyFile(path.join(folder, file), path.join(out, file));
  manifest.status = 'encoded-and-verified'; manifest.outputs = outputs; manifest.posterSourceFrame = poster;
  manifest.encoding = { mp4: 'ffmpeg/libx264 CRF14 slow native 2x', gif: 'ffmpeg full 256-color palette, no dithering, native 2x', poster: 'lossless WebP from raw native2x frame, source ICC retained', encoderSha256: await digest(fileURLToPath(import.meta.url)) };
  manifest.captureDirectory = path.relative(root, folder);
  await writeFile(path.join(out, `${name}.manifest.json`), JSON.stringify(manifest, null, 2) + '\n');
  console.log(JSON.stringify({ name, outputs }));
}

async function main() {
  const args = process.argv.slice(2), mode = args.find(a => /^--(plan|probe|record|verify|self-test)$/.test(a))?.slice(2) || 'plan';
  const only = args.find(a => a.startsWith('--only='))?.slice(7);
  assert(!only || plans[only], 'Unknown recording name');
  for (const arg of args) assert(/^--(plan|probe|record|verify|self-test|avatars-confirmed)$/.test(arg) || arg.startsWith('--only='), `Unknown option ${arg}`);
  if (mode === 'plan') return console.log(JSON.stringify({ base, space: 20, page: 'p1', viewport: [width, height], physicalPixels:[pixelWidth,pixelHeight], seconds, plans }, null, 2));
  if (mode === 'self-test') {
    const sample = 'root\n  tab [ref=7]\n    image\n    text "reviewer"\n    text "已完成"\n  tabpanel "reviewer已完成" [ref=8]\n    button [ref=9]\n      text "继续此 agent"';
    assert.equal(targets(sample, 'tab', 'reviewer')[0].ref, '@7');
    assert.equal(targets(sample, 'button', '继续此 agent')[0].ref, '@9');
    assert.equal(targets(sample, 'tab', 'unknown').length, 0);
    assert.equal(targets('  textbox [ref=10, loc=css:input[placeholder="mcp.read, env"]]\n    text "runtime"', 'textbox', 'mcp.read, env')[0].ref, '@10');
    assert(concatText([{ file: 'a.png', t: .1 }, { file: 'b.png', t: .6 }], 1, '/tmp').includes('duration 0.600000'));
    assert.throws(() => assertLocal('http://127.0.0.1:18380/skills'));
    console.log('PASS snapshot targeting, frame timing, and live-runtime rejection'); return;
  }
  const names = only ? [only] : mode === 'probe' ? ['team'] : Object.keys(plans);
  if (mode === 'verify') {
    for (const name of names) {
      const manifest = JSON.parse(await readFile(path.join(out, `${name}.manifest.json`), 'utf8'));
      for (const artifact of manifest.outputs) {
        const type = artifact.file.endsWith('.gif') ? 'gif' : artifact.file.endsWith('.webp') ? 'poster' : 'mp4';
        const actual = await validateMedia(path.join(out, artifact.file), type);
        assert.equal(actual.sha256, artifact.sha256, artifact.file);
      }
      console.log(`PASS ${name}: MP4, real GIF, poster, output hashes`);
    }
    return;
  }
  const avatarsConfirmed = args.includes('--avatars-confirmed');
  assert(mode !== 'record' || avatarsConfirmed, 'Final capture blocked until the lead confirms new avatars. Then pass --avatars-confirmed.');
  const tempRoot = path.join(root, '.tmp/native-recordings'); await mkdir(tempRoot, { recursive: true });
  for (const name of names) {
    const folder = await mkdtemp(path.join(tempRoot, `${name}-${mode}-`));
    const options = { name, mode, folder, avatarsConfirmed };
    const code = `const {runInEgo}=await import(${JSON.stringify(import.meta.url)});await runInEgo(${JSON.stringify(options)},taskSpace);`;
    console.log(`Native ${mode}: ${name}; space20/p2; ${folder}`);
    const pending = exec('ego-browser', ['nodejs', '-e', code], { cwd: root, timeout: 90000, maxBuffer: 3e6 });
    pending.child.stdout.on('data', data => process.stdout.write(data));
    pending.child.stderr.on('data', data => process.stderr.write(data));
    // Ego also examines stdin with -e. An open execFile pipe stalls before evaluation.
    pending.child.stdin.end();
    await pending;
    // A terminated Ego evaluation can exit zero without completing. Evidence is mandatory.
    const captured = JSON.parse(await readFile(path.join(folder, 'capture.json'), 'utf8'));
    assert.equal(captured.status, mode === 'probe' ? 'probe-only-not-final' : 'captured');
    if (mode === 'record') await encode(name, folder);
  }
}
if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
}
