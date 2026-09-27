// Source-only pose/event contracts extracted from docs/real-ui-layout-20260926.md.
// Run: node tools/check-workspace-reveal.cjs (also works from another cwd).
// DOM stand-ins do not verify browser rendering, hit testing or media playback.
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { runInNewContext } = require('node:vm');
const { transformSync } = require('esbuild');
const read = path => readFileSync(resolve(__dirname, '..', path), 'utf8');
const source = read('src/scripts/workspace-reveal.ts');
const code = transformSync(source, { loader: 'ts', format: 'cjs' }).code;

function fixture(eligible = true) {
  class Target extends EventTarget {
    dataset = {}; tokens = new Set(); values = new Map();
    classList = { contains: value => this.tokens.has(value) };
    style = { setProperty: (key, value) => this.values.set(key, value) };
  }
  const workspace = new Target(), shell = new Target(), frame = new Target();
  const doc = new Target(), win = new Target(), root = new Target(), media = new Target();
  const inner = new Target(), queue = new Map(), observers = new Map(); let sequence = 0;
  Object.assign(win, { scrollY: 0, innerHeight: 900 }); media.matches = eligible;
  Object.assign(doc, { documentElement: root, hidden: false, fullscreenElement: null });
  frame.contentDocument = inner;
  workspace.getBoundingClientRect = () => ({ top: 600 - win.scrollY });
  doc.querySelector = selector => ({ '[data-workspace-reveal]': workspace, '#agent-frame-shell': shell, '#agent-frame': frame })[selector];
  const module = { exports: {} };
  runInNewContext(code, {
    module, document: doc, window: win, matchMedia: query => { media.query = query; return media; },
    requestAnimationFrame: callback => { queue.set(++sequence, callback); return sequence; },
    cancelAnimationFrame: id => queue.delete(id),
    MutationObserver: class { constructor(callback) { this.callback = callback; } observe(target) { observers.set(target, this.callback); } },
  });
  const fire = (target, type, properties = {}) => target.dispatchEvent(Object.assign(new Event(type, { cancelable: true }), properties));
  const flush = () => { const jobs = [...queue.values()]; queue.clear(); jobs.forEach(job => job()); };
  return { workspace, shell, frame, doc, win, root, media, inner, queue, observers, fire, flush, pose: module.exports.workspacePose };
}

// Centered hero: a 34-degree opening pose, no roll, gradual full-viewport reveal.
const a = fixture();
for (const [progress, expected] of [[-1, [34, 0, .92, -86]], [0, [34, 0, .92, -86]], [.5, [17, 0, .96, -43]], [1, [0, 0, 1, 0]], [2, [0, 0, 1, 0]]]) {
  const pose = a.pose(progress);
  ['tilt', 'roll', 'scale', 'lift'].forEach((key, i) => assert(Math.abs(pose[key] - expected[i]) < 1e-10, `${key} at progress ${progress}`));
}
let last = 35;
for (let i = 0; i <= 100; i++) { const tilt = a.pose(i / 100).tilt; assert(tilt >= 0 && tilt <= last); last = tilt; }
assert.equal(a.workspace.dataset.revealState, 'scroll');
assert.equal(a.shell.values.get('--workspace-tilt'), '34deg');
a.win.scrollY = 380; a.fire(a.win, 'scroll'); a.fire(a.win, 'scroll');
assert.equal(a.queue.size, 1, 'scroll work must coalesce');
a.flush(); assert.equal(a.shell.values.get('--workspace-tilt'), '17deg');
assert.equal(a.queue.size, 0, 'no perpetual animation loop');

// Freeze before native input, keep its hit geometry through click, then settle.
for (const area of ['inner', 'workspace']) {
  const input = fixture(), target = input[area], before = [...input.shell.values];
  assert(input.fire(target, 'pointerdown')); assert(input.fire(target, 'focusin'));
  assert.equal(input.workspace.dataset.revealState, 'frozen');
  input.win.scrollY = 480; input.fire(input.win, 'scroll'); assert.equal(input.queue.size, 0);
  assert.deepEqual([...input.shell.values], before, 'input geometry must not move');
  assert(input.fire(target, 'pointerup'));
  let clicked = false;
  target.addEventListener('click', () => { clicked = true; assert.equal(input.workspace.dataset.revealState, 'frozen'); }, { once: true });
  assert(input.fire(target, 'click')); assert(clicked); input.flush();
  assert.equal(input.workspace.dataset.revealState, 'settled');
  input.win.scrollY = 0; input.fire(input.win, 'scroll'); assert.equal(input.queue.size, 0);
}
for (const area of ['inner', 'workspace']) {
  const keyboard = fixture();
  keyboard.fire(keyboard.doc, 'keydown', { key: 'Tab' });
  keyboard.fire(keyboard[area], 'focusin');
  assert.equal(keyboard.workspace.dataset.revealState, 'settled', 'focus after keyboard input must settle');
}
const parent = fixture(); parent.fire(parent.workspace, 'pointerdown'); parent.fire(parent.win, 'pointercancel'); parent.flush();
assert.equal(parent.workspace.dataset.revealState, 'settled', 'cancelled parent input must settle');

// Query-gated eligibility is mocked, not a browser media-query evaluation.
const c = fixture(false);
assert.equal(c.workspace.dataset.revealState, 'settled', 'ineligible initial state must be upright');
for (const term of ['min-width: 801px', 'hover: hover', 'pointer: fine', 'prefers-reduced-motion: no-preference']) assert(c.media.query.includes(term), term);
c.media.matches = true; c.fire(c.media, 'change'); assert.equal(c.workspace.dataset.revealState, 'scroll');
c.root.tokens.add('motion-paused'); c.observers.get(c.root)(); assert.equal(c.workspace.dataset.revealState, 'settled');
c.root.tokens.delete('motion-paused'); c.observers.get(c.root)(); assert.equal(c.workspace.dataset.revealState, 'scroll');
c.fire(c.win, 'scroll'); c.doc.hidden = true; c.fire(c.doc, 'visibilitychange'); assert.equal(c.queue.size, 0);
c.doc.hidden = false; c.win.scrollY = 900; c.fire(c.doc, 'visibilitychange'); assert.equal(c.shell.values.get('--workspace-tilt'), '0deg');
c.shell.tokens.add('expanded'); c.observers.get(c.shell)(); assert.equal(c.workspace.dataset.revealState, 'settled');
const d = fixture(); d.doc.fullscreenElement = d.shell; d.fire(d.doc, 'fullscreenchange');
assert.equal(d.workspace.dataset.revealState, 'settled');

// Literal CSS guards, not computed-style/cascade verification. Inspect leaf rules
// so hidden labels elsewhere do not count as hiding the actual workspace.
const css = read('src/styles/site.css') + '\n' + read('src/styles/narrative.css');
const compiled = transformSync(css, { loader: 'css' });
assert.equal(compiled.warnings.length, 0, JSON.stringify(compiled.warnings));
const rules = [...compiled.code.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)];
const workspaceSelector = /(?:#agent-frame(?:-shell)?|\.workspace-(?:section|stage|shell))(?![\w-])/;
const hidesInput = /(?:display\s*:\s*none|visibility\s*:\s*(?:hidden|collapse)|pointer-events\s*:\s*none|opacity\s*:\s*0(?:\.0+)?\s*(?:!important\s*)?(?:;|$))/;
for (const [, selector, declarations] of rules) {
  if (workspaceSelector.test(selector) || /:focus(?:-visible|-within)?\b/.test(selector)) {
    assert(!hidesInput.test(declarations), `Workspace/focus rule hides or blocks input: ${selector.trim()}`);
  }
}
assert(rules.some(([, selector, declarations]) => selector.trim() === '.workspace-shell' && /transform:\s*none/.test(declarations)), 'no-JS shell must be upright');
assert(rules.some(([, selector, declarations]) => selector.includes(':focus-visible') && /outline:\s*2px/.test(declarations)), 'retain a visible focus indicator');
assert(/perspective:\s*1800px/.test(css) && /perspective-origin:\s*50% 50%/.test(css));
assert(/transform-origin:\s*50% 50%/.test(css) && /--workspace-tilt,\s*34deg/.test(css));
assert(/prefers-reduced-motion\s*:\s*reduce/.test(css) && /transform:\s*none\s*!important/.test(css));
assert(!/\b(?:preventDefault|stopPropagation|stopImmediatePropagation)\s*\(/.test(source), 'reveal must not cancel native input');
const component = read('src/components/AgentWorkspace.astro');
const frameTag = component.match(/<iframe\b[^>]*\bid="agent-frame"[^>]*>/)?.[0];
assert(frameTag && !/\s(?:hidden|inert)(?:\s|=|>)/.test(frameTag), 'iframe must remain available');
assert(component.includes('../scripts/workspace-reveal.ts'), 'workspace must load the enhancement');
console.log('PASS: 34-degree pose with lift, rAF coalescing, pointer/Tab sequences, eligibility/pause, visibility, expansion/fullscreen and visible CSS fallback.');

// Separate from keyboard/pointer intent: CommandHome in demo/app.js calls its
// input ref's focus() after 30ms on fine pointers. Model the resulting focusin
// AFTER the frame load listener has attached, with no user input at all.
// Intentionally red until main verifies browser timing and fixes/decides this
// contract. Do not relabel automated focus as keyboard input to make it pass.
const initialFocus = fixture();
initialFocus.fire(initialFocus.frame, 'load');
initialFocus.fire(initialFocus.inner, 'focusin');
initialFocus.flush();
assert.equal(initialFocus.workspace.dataset.revealState, 'scroll',
  'Initial automated iframe focus must preserve the visible tilt until user input; browser timing remains unverified');
assert.equal(initialFocus.shell.values.get('--workspace-tilt'), '34deg');
console.log('PASS: automated initial focus preserves the 34-degree reveal.');
console.log('Source-only check; no browser, build, recordings, avatar assets or network required.');
