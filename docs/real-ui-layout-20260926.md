# Real-screen layout handoff · 2026-09-26

## Scope

Working tree: `/Users/rick/Documents/Project/Nerya/landing-page`, dirty `main`.
This pass owns only `src/pages/index.astro`, `src/components/AgentWorkspace.astro`,
`src/styles/site.css`, `src/scripts/workspace-reveal.ts`, and this document.
No changes to `site.ts`, `ProductFilm`, `product.ts`, tooling, packages or avatar files.
No browser control, service restart, commit, push or deployment. The recorder owns space20.

## Layout and copy

- Hero: **一句想法 / 一支策略团队**, with an English counterpart, **One idea / A team to build it**.
- Primary action opens the workspace; the secondary action opens installation instructions.
- Keep the existing purple palette and system-font stack. Remove the orbit decoration and fabricated studio scene from the page.
- Give each of the six recordings a full-width screen below a short heading/copy row. Native UI text needs the width previously occupied by side-by-side marketing copy.
- Remove the Security navigation link. Keep the Vault demonstration and its documentation link.
- Keep market selection and the editable integration draft as secondary controls below their recordings.
- No time-to-result or profit claims. Keep the existing example-data disclosure in the footer.

`impeccable` informed the screen-first layout, contrast-preserving existing palette,
responsive controls and reduced-motion behavior. `stop-slop` informed the concrete,
short bilingual copy. Native CSS and an event-driven rAF replace an animation dependency.

## Motion contract

- Only `#agent-frame-shell` transforms. The iframe app, toolbar and caption do not receive independent transforms.
- Desktop fine-pointer users start at `rotateX(16deg) rotateZ(-1deg) scale(.94)`.
- Perspective is `1600px`, centered at `50% 50%`; the transform origin is also centered.
- Progress uses the untransformed workspace position. It starts when the workspace reaches 82% of viewport height, clamped to document scroll zero, and completes near 112px from the viewport top. Minimum travel: 180px.
- Smoothstep interpolation reaches `rotateX(0) rotateZ(0) scale(1)`. Scroll events coalesce into one rAF. No perpetual loop, wheel handler, scroll hijack or layout animation.
- Resize and language changes remeasure the untransformed section. Hidden tabs cancel pending frames.
- On pointerdown, freeze the current geometry through pointerup and the native click. Settle upright on the next animation frame, then leave it upright for the rest of the page session. This prevents a first-click target from moving underneath the pointer.
- Keyboard/programmatic focus settles immediately. Input events in the same-origin iframe are observed without cancelling, replacing or dispatching them.
- Expanded mode and native fullscreen settle upright and remove the ancestor perspective, so fixed-position expansion stays viewport-relative. The existing `site.ts` expansion/focus/inert logic remains authoritative.
- At widths ≤800px, for coarse/touch pointers, or with reduced motion, the shell is upright. The global pause control also disables the transform. A preference change can re-enable the reveal only before the visitor has interacted with it.
- Without the enhancement script, the shell is upright and the content stays visible.

## Recording and interaction contracts

| Film ID | Chapter labels | Existing action retained |
| --- | --- | --- |
| strategy | From `product.ts` | Existing strategy route |
| team | From `product.ts` | Existing Agent team route |
| evolution | From `product.ts` | Existing review route |
| vault | From `product.ts` | Settings and security documentation |
| markets | 选择市场 / 查看策略 / 检查规则 | Four original market routes |
| integrations | 提出需求 / 准备适配 / 验证接入 | Editable `/chat` draft, no automatic send |

The two new films use the existing `ProductFilm` shape: `id`, localized `title`,
and three localized `steps`. They do not expand the four-item `ProductFeature` type.
The main worker owns `ProductFilm` and has switched its base to
`/assets/product-recordings/{id}` with `.mp4`, `.gif`, and `-poster.webp` files.
The viewport is **16:10** for the expected **1280×800** captures, with `object-fit: contain`.
Main should reconcile this with the final recording manifest; do not crop recordings.
The OG image also uses the real strategy poster.

Unchanged hooks: `#market-symbol`, `#market-description`, `#market-open`,
`data-market`, `data-market-route`, `window.__neryaMarkets`, `#integration-form`,
`#integration-prompt`, `#integration-status`, `#agent-frame`, `#agent-frame-shell`,
`#expand-agent`, all demo-route buttons and `#standalone-demo`.
Role portraits retain `/assets/agent-avatars/{lead,researcher,reviewer,coder}.png`.
Main supplies the new generated mascot-role images at those URLs.

## Verification and remaining handoff

- The runnable non-browser check below passed: pose endpoints/monotonicity, one-frame scroll coalescing, pointer/click/focus state, eligibility changes, global pause, hidden-tab suspension, expansion/fullscreen, six-film wiring and unchanged interaction hooks.
- Direct compilation with the installed `@astrojs/compiler-rs` passed for both owned Astro components. CSS compilation through the installed esbuild passed without warnings. These are compile checks, not browser or full TypeScript acceptance.
- `git diff --check` passed, but these Astro sources are currently untracked; the runnable checks below also inspect the owned files directly.
- Isolated command: `./node_modules/.bin/astro build --outDir /tmp/nerya-real-ui-build-20260926.TgyOpC`.
- Astro generated types and both Vite builds completed. Prerender then failed in the unchanged `src/components/Icon.astro`: its relative `import.meta.url` lookup resolved to missing `.astro/icon-paths.js` instead of the root icon file. This is a separate build blocker, not proof of a successful build. No fix or asset-copy workaround was applied outside the ownership boundary.
- Shared `dist/` was not rebuilt. No public preparation ran; main reports that publication is intentionally gated on the new avatars and recordings.
- Main has updated the static checker to six films and no `nav #vault`. Run it after the complete asset package and icon-path issue are resolved.
- `site.ts` still owns runtime title/description translation and may replace the new HTML meta description with its older wording. Main can align that description when editing its owned file.
- Browser verification remains for main after recorder release: initial tilt, scroll settle, first-click/drag inside iframe, keyboard focus, expanded mode/Escape, both languages/themes, 390/768px layouts, six video/GIF controls, markets and editable draft handoff.

### Runnable non-browser contract check

Run from the landing-page root. This verifies the pose and event state machine with
DOM stand-ins, source hook preservation and six-film wiring. It does not claim real
browser rendering, hit testing, video playback, or asset availability.

```sh
node --input-type=module <<'NODE'
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { transformSync } from 'esbuild';
const read = path => readFileSync(path, 'utf8');
const code = transformSync(read('src/scripts/workspace-reveal.ts'), { loader: 'ts', format: 'cjs' }).code;
function fixture() {
  class Target extends EventTarget {
    dataset = {}; tokens = new Set(); values = new Map();
    classList = { contains: value => this.tokens.has(value) };
    style = { setProperty: (key, value) => this.values.set(key, value) };
  }
  const workspace = new Target(), shell = new Target(), frame = new Target();
  const doc = new Target(), win = new Target(), root = new Target(), media = new Target();
  const inner = new Target(), queue = new Map(), observers = new Map(); let sequence = 0;
  Object.assign(win, { scrollY: 0, innerHeight: 900 }); media.matches = true;
  Object.assign(doc, { documentElement: root, hidden: false, fullscreenElement: null });
  frame.contentDocument = inner;
  workspace.getBoundingClientRect = () => ({ top: 600 - win.scrollY });
  doc.querySelector = selector => ({ '[data-workspace-reveal]': workspace, '#agent-frame-shell': shell, '#agent-frame': frame })[selector];
  const module = { exports: {} };
  runInNewContext(code, {
    module, document: doc, window: win, matchMedia: () => media,
    requestAnimationFrame: callback => { queue.set(++sequence, callback); return sequence; },
    cancelAnimationFrame: id => queue.delete(id),
    MutationObserver: class { constructor(callback) { this.callback = callback; } observe(target) { observers.set(target, this.callback); } },
  });
  const fire = (target, type) => target.dispatchEvent(new Event(type, { cancelable: true }));
  const flush = () => { const jobs = [...queue.values()]; queue.clear(); jobs.forEach(job => job()); };
  return { workspace, shell, frame, doc, win, root, media, inner, queue, observers, fire, flush, pose: module.exports.workspacePose };
}
const a = fixture();
assert.equal(a.workspace.dataset.revealState, 'scroll');
assert.equal(a.shell.values.get('--workspace-tilt'), '16deg');
assert.equal(a.pose(-1).tilt, 16); assert.equal(a.pose(2).tilt, 0);
assert.equal(a.pose(.5).tilt, 8); assert.equal(a.pose(.5).scale, .97);
let last = 17;
for (let i = 0; i <= 100; i++) { const tilt = a.pose(i / 100).tilt; assert(tilt <= last); last = tilt; }
a.win.scrollY = 244; a.fire(a.win, 'scroll'); a.fire(a.win, 'scroll');
assert.equal(a.queue.size, 1); a.flush(); assert.equal(a.shell.values.get('--workspace-tilt'), '8deg');
a.fire(a.inner, 'pointerdown'); a.fire(a.inner, 'focusin');
assert.equal(a.workspace.dataset.revealState, 'frozen');
a.win.scrollY = 480; a.fire(a.win, 'scroll'); assert.equal(a.queue.size, 0);
a.fire(a.inner, 'pointerup');
let clicked = false;
a.inner.addEventListener('click', () => { clicked = true; assert.equal(a.workspace.dataset.revealState, 'frozen'); });
assert(a.fire(a.inner, 'click')); assert(clicked); a.flush();
assert.equal(a.workspace.dataset.revealState, 'settled');
a.win.scrollY = 0; a.fire(a.win, 'scroll'); assert.equal(a.queue.size, 0);
const b = fixture(); b.fire(b.workspace, 'focusin'); assert.equal(b.workspace.dataset.revealState, 'settled');
const c = fixture(); c.media.matches = false; c.fire(c.media, 'change'); assert.equal(c.workspace.dataset.revealState, 'settled');
c.media.matches = true; c.fire(c.media, 'change'); assert.equal(c.workspace.dataset.revealState, 'scroll');
c.root.tokens.add('motion-paused'); c.observers.get(c.root)(); assert.equal(c.workspace.dataset.revealState, 'settled');
c.root.tokens.delete('motion-paused'); c.observers.get(c.root)(); assert.equal(c.workspace.dataset.revealState, 'scroll');
c.fire(c.win, 'scroll'); c.doc.hidden = true; c.fire(c.doc, 'visibilitychange'); assert.equal(c.queue.size, 0);
c.doc.hidden = false; c.win.scrollY = 600; c.fire(c.doc, 'visibilitychange'); assert.equal(c.shell.values.get('--workspace-tilt'), '0deg');
c.shell.tokens.add('expanded'); c.observers.get(c.shell)(); assert.equal(c.workspace.dataset.revealState, 'settled');
const d = fixture(); d.doc.fullscreenElement = d.shell; d.fire(d.doc, 'fullscreenchange'); assert.equal(d.workspace.dataset.revealState, 'settled');
const page = read('src/pages/index.astro'), css = read('src/styles/site.css');
const data = { exports: {} };
runInNewContext(transformSync(read('src/data/product.ts'), { loader: 'ts', format: 'cjs' }).code, { module: data });
assert.equal(data.exports.features.length + (page.match(/<ProductFilm feature=\{(?:marketFilm|integrationFilm)\}/g) || []).length, 6);
for (const id of ['market-symbol', 'market-description', 'market-open', 'integration-form', 'integration-prompt', 'integration-status']) assert.equal(page.split(`id="${id}"`).length - 1, 1, id);
assert(!page.match(/<nav[\s\S]*?<\/nav>/)[0].includes('#vault'));
assert(page.includes('一句想法') && page.includes('一支策略团队'));
assert(!page.includes('/assets/generated/'));
assert(css.includes('aspect-ratio:16/10') && css.includes('perspective-origin:50% 50%'));
for (const path of ['src/pages/index.astro', 'src/components/AgentWorkspace.astro', 'src/styles/site.css', 'src/scripts/workspace-reveal.ts']) assert(!/[\t ]+$/m.test(read(path)), path);
console.log('PASS: pose endpoints/monotonicity, rAF coalescing, pointer and focus safety, reduced/mobile eligibility, pause, visibility, expansion/fullscreen, six films and preserved source hooks.');
NODE
```
