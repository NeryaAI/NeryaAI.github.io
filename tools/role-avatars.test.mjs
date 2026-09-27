import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { createRequire } from 'node:module';
import { landingMapping, inspectPng } from './sync-role-avatars.mjs';
import { withRolePortraits } from '../demo-src/avatar-adapter.mjs';

const dashboard = new URL('../../agent/dashboard/', import.meta.url);
const requireFromAgent = createRequire(new URL('package.json', dashboard));
const ts = requireFromAgent('typescript');
const React = requireFromAgent('react');
const { renderToStaticMarkup } = requireFromAgent('react-dom/server');

test('website browser and CommonJS mappings match the canonical dashboard output', async () => {
  const expected = await landingMapping();
  const content = await readFile(new URL('../agent-avatars.js', import.meta.url), 'utf8');
  assert.equal(content, expected.content, 'run node tools/sync-role-avatars.mjs --mapping-only');
  const browser = { window: {} }, node = { module: { exports: {} } };
  runInNewContext(content, browser); runInNewContext(content, node);
  assert.equal(browser.window.NeryaAvatars.roles.length, 20);
  for (const name of [...expected.roles, 'risk_critic', '市场研究员', 'macroResearcher', 'Orion', '', null]) {
    assert.equal(browser.window.NeryaAvatars.resolve(name), node.module.exports.resolve(name));
    assert.equal(browser.window.NeryaAvatars.path(name), node.module.exports.path(name));
  }
});

test('adapter changes only the native asset base and is idempotent before/after build branding substitution', async () => {
  const source = await readFile(new URL('components/RoleAvatar.tsx', dashboard), 'utf8');
  const expected = source.replace('"/branding/agents"', '"./avatars"');
  for (const input of [source, source.replace('"/branding/', '"./branding/'), expected]) {
    assert.equal(withRolePortraits(input, 'components/RoleAvatar.tsx'), expected);
  }
  assert.throws(() => withRolePortraits('changed', 'components/RoleAvatar.tsx'), /base-path anchor changed/);
  assert.throws(() => withRolePortraits(source + source, 'components/RoleAvatar.tsx'), /base-path anchor changed/);
});

test('native callers are unchanged by the adapter; no duplicate imports or JSX injection', async () => {
  for (const file of ['components/chat/WorkspaceTabs.tsx', 'components/chat/AgentWorkspace.tsx', 'components/chat/AgentConversation.tsx',
    'app/agents/page.tsx', 'components/workflows/WorkflowCanvas.tsx', 'components/workflows/WorkflowCardGallery.tsx']) {
    const source = await readFile(new URL(file, dashboard), 'utf8');
    assert.equal(withRolePortraits(source, file), source, file);
    assert.match(source, file.endsWith('WorkspaceTabs.tsx') ? /tab.portrait/ : /<RoleAvatar/);
  }
});

test('adapted component renders exactly the dashboard markup except for the asset URL', async () => {
  const source = await readFile(new URL('components/RoleAvatar.tsx', dashboard), 'utf8');
  const mapping = await landingMapping();
  const context = { module: { exports: {} } }; runInNewContext(mapping.content, context);
  function component(text) {
    const compiled = ts.transpileModule(text, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    const module = { exports: {} };
    const load = id => id === '../lib/roleAvatars' ? context.module.exports : requireFromAgent(id);
    new Function('require', 'module', 'exports', compiled)(load, module, module.exports);
    return module.exports.RoleAvatar;
  }
  const native = component(source), demo = component(withRolePortraits(source, 'components/RoleAvatar.tsx'));
  for (const role of [...mapping.roles, 'Orion']) {
    const props = { role, size: 32, alt: role };
    assert.equal(renderToStaticMarkup(React.createElement(demo, props)), renderToStaticMarkup(React.createElement(native, props)).replace('/branding/agents/', './avatars/'));
  }
});

test('asset preflight rejects invalid PNGs and old 192px portraits, without generating fixtures', () => {
  assert.throws(() => inspectPng(Buffer.from('not a png'), 'lead'), /expected a PNG/);
  // Header-only data exercises validation, never masquerades as a missing role image.
  const header = Buffer.alloc(33);
  Buffer.from('89504e470d0a1a0a', 'hex').copy(header); header.write('IHDR', 12);
  header.writeUInt32BE(192, 16); header.writeUInt32BE(192, 20);
  assert.throws(() => inspectPng(header, 'lead'), /received 192x192/);
});
