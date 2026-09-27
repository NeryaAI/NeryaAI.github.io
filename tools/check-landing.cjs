const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { gateState, roles } = require('../landing-data.js');
const root = path.resolve(__dirname, '..');
for (const mode of ['paper', 'live']) {
  for (const approved of [false, true]) {
    for (const size of [6, 10, 0, -1, NaN, Infinity]) assert.equal(gateState(mode, size, approved, true), 'blocked');
  }
}
assert.equal(gateState('unknown', 3, true, false), 'blocked');
assert.equal(gateState('paper', 5, false, false), 'ready');
assert.equal(gateState('paper', 3, false, true), 'simulated');
assert.equal(gateState('live', 5, false, false), 'pending');
assert.equal(gateState('live', 5, true, false), 'approved');
assert.equal(Object.keys(roles).length,3);
const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
for (const [, heading] of html.matchAll(/<h[12]\b[^>]*>([\s\S]*?)<\/h[12]>/g)) {
  assert(!/[。，]/.test(heading.replace(/<[^>]+>/g, '')), 'Large headings omit sentence punctuation');
}
assert(html.includes('帮你做实盘量化'), 'Hero leads with live quant trading');
assert(!/默认模拟交易|从模拟模式开始|开始第一次模拟运行/.test(html), 'Marketing is not paper-first');
assert(html.includes('产品体验使用模拟数据'), 'Synthetic data retains an honest disclosure');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(ids).size,ids.length,'Unique HTML IDs');
for (const [, target] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  if (target.startsWith('#')) assert(ids.includes(target.slice(1)),`Missing anchor ${target}`);
  else if (!/^(https?:|data:|mailto:)/.test(target)) {
    const [fileWithQuery, fragment] = target.split('#'); const file=fileWithQuery.split('?')[0];const local=path.join(root,file);
    assert(fs.existsSync(local),`Missing resource ${file}`);
    if (fragment) assert(fs.readFileSync(local,'utf8').includes(`id="${fragment}"`),`Missing ${target}`);
  }
}
assert(!html.includes('main.js') && !html.includes('anime-fx.js'),'Old animation system is not loaded');
const js=fs.readFileSync(path.join(root,'landing.js'),'utf8');
assert(!/\b(fetch|XMLHttpRequest|WebSocket)\s*\(/.test(js),'Demo must make no network/API requests');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'demo/source-manifest.json'),'utf8'));
assert(Object.keys(manifest.sourceFiles).length>100,'Actual frontend components must be bundled');
for(const file of ['components/AppShell.tsx','components/home/CommandHome.tsx','components/chat/ChatView.tsx','components/chat/ChatInput.tsx','components/shell/CodexSidebar.tsx'])assert(manifest.sourceFiles[file],`Missing real component ${file}`);
assert(html.includes('src="demo/index.html?lang=zh"'),'The real app must be embedded');
// The follow-up brief restores connector names and capability presentation.
for(const id of ['markets','adapters','mission-console','evolution-console','theme-toggle'])assert(ids.includes(id),`Missing requested capability ${id}`);
assert(!/交互预览|交互沙盒/.test(html),'Keep product copy free of repeated preview labels');
assert(fs.readFileSync(path.join(root,'demo/index.html'),'utf8').includes("connect-src 'none'"),'Network must be blocked by CSP');
console.log('PASS: local gates, source-backed real Agent frontend, unique IDs, resources, requested capability sections and deny-network CSP.');
