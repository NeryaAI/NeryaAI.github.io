import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { build } from 'esbuild';

const root = new URL('../', import.meta.url);
const canonical = JSON.parse(await readFile(new URL('../../agent/dashboard/components/icon-paths.json', import.meta.url), 'utf8'));
const window = { addEventListener() {} };
const context = vm.createContext({ window, document: { addEventListener() {} } });
vm.runInContext(await readFile(new URL('icon-paths.js', root), 'utf8'), context);
vm.runInContext(await readFile(new URL('icons.js', root), 'utf8'), context);
assert.deepEqual(JSON.parse(JSON.stringify(window.NeryaIconPaths)), canonical);
assert.ok(Object.keys(canonical).length >= 90);
for (const [name, path] of Object.entries(canonical)) {
  for (const size of [16, 18, 20, 24]) {
    const svg = window.NeryaIcons.svg(name, size);
    assert.ok(svg.includes(`d="${path}"`), name);
    assert.ok(svg.includes(`width="${size}"`), name);
    assert.ok(svg.includes('viewBox="0 0 24 24"'), name);
    assert.ok(svg.includes('stroke="currentColor"'), name);
    assert.ok(svg.includes('stroke-linecap="round"'), name);
    assert.ok(svg.includes('stroke-linejoin="round"'), name);
    assert.ok(svg.includes('aria-hidden="true"'), name);
    assert.ok(svg.includes(`stroke-width="${size <= 16 ? 1.75 : 1.5}"`), name);
  }
}
assert.throws(() => window.NeryaIcons.svg('missing-icon'), /Unknown Nerya icon/);
for (const page of ['index.html', 'docs.html', 'skills.html', 'recipes.html']) {
  const html = await readFile(new URL(page, root), 'utf8');
  assert.ok(html.includes('href="icons.css"'), page);
  assert.ok(html.indexOf('src="icon-paths.js"') < html.indexOf('src="icons.js"'), page);
  assert.ok(html.includes('src="icons.js"'), page);
}

// Render the actual Agent component rather than a substitute SVG fixture.
const agentRequire = createRequire(new URL('../../agent/dashboard/package.json', import.meta.url));
const React = agentRequire('react');
const { renderToStaticMarkup } = agentRequire('react-dom/server');
const bundle = await build({ entryPoints: [fileURLToPath(new URL('../../agent/dashboard/components/icons.tsx', import.meta.url))], bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic', external: ['react', 'react/*'], logLevel: 'silent' });
const module = { exports: {} };
vm.runInNewContext(bundle.outputFiles[0].text, { module, exports: module.exports, require: agentRequire });
const api = module.exports;
assert.equal(api.ICON_NAMES.length, Object.keys(canonical).length);
for (const name of api.ICON_NAMES) {
  const svg = renderToStaticMarkup(React.createElement(api.Icon, { name, size: 18 }));
  assert.ok(svg.includes(`d="${canonical[name]}"`));
  assert.ok(svg.includes('aria-hidden="true"'));
}
for (const [name, component] of Object.entries(api)) {
  if (typeof component !== 'function' || name === 'Icon') continue;
  const svg = renderToStaticMarkup(React.createElement(component, { size: 16, className: 'test' }));
  assert.ok(svg.includes('data-nerya-icon='), name);
  assert.ok(svg.includes('stroke-width="1.75"'), name);
  assert.ok(svg.includes('nerya-icon test'), name);
}
const labelled = renderToStaticMarkup(React.createElement(api.Icon, { name: 'compose', title: 'New conversation', size: 24 }));
assert.ok(labelled.includes('role="img"'));
assert.ok(labelled.includes('aria-label="New conversation"'));
assert.ok(!labelled.includes('aria-hidden="true"'));
assert.ok(labelled.includes('<title>New conversation</title>'));
for (const map of [api.NAV_ICONS, api.NAV_ICON_BY_NAME]) {
  for (const component of Object.values(map)) assert.ok(renderToStaticMarkup(React.createElement(component)).includes('data-nerya-icon='));
}
console.log(`PASS: ${api.ICON_NAMES.length} shared paths; ${api.ICON_NAMES.length * 4} website size cases; React exports, navigation, accessibility, all four website entry points.`);
