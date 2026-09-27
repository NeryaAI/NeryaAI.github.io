// Dependency-free transport tests. No browser, credentials or network involved.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'demo-src/native-fixtures.js'), 'utf8');
const ORIGIN = 'https://recording.example';
const API = ORIGIN + '/api/proxy';
const PLACEHOLDER = 'recording-only-placeholder';
const post = body => ({ method: 'POST', body: JSON.stringify(body) });

class MockResponse {
  constructor(body, { status = 200, statusText = '', headers = {} } = {}) {
    this.body = body; this.status = status; this.statusText = statusText;
    this.headers = new Headers(headers); this.ok = status >= 200 && status < 300;
  }
  async json() { return JSON.parse(this.body); }
  clone() { return new MockResponse(this.body, this); }
}
const response = (body, status = 200) => new MockResponse(JSON.stringify(body), { status });

function setup({ timeline, handler, audit = true } = {}) {
  const calls = [], requests = [];
  const window = { location: { origin: ORIGIN, href: ORIGIN + '/demo/index.html' }, __demoRequests: requests };
  window.fetch = function(input, init) {
    assert.equal(this, window, 'delegate preserves receiver');
    calls.push({ input, init });
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url, window.location.href);
    const method = (init?.method || input?.method || 'GET').toUpperCase();
    const route = url.pathname.replace(/^\/api\/proxy/, '').replace(/^\/api/, '');
    if (audit) requests.push({ path: route, method, local: true });
    if (handler) return handler(input, init);
    if (route === '/evolution/timeline') return Promise.resolve(response(timeline ?? { ok: true, timeline: [], count: 0 }));
    return Promise.resolve(response({ ok: false, error: 'original-demo-deny' }, 405));
  };
  const context = { window, URL, Response: MockResponse, Headers, DOMException, Symbol };
  vm.runInNewContext(source.replace('export function installNativeFixtures', 'function installNativeFixtures') + '\nglobalThis.install = installNativeFixtures;', context);
  const install = context.install;
  return { window, calls, requests, install, fetch: (...args) => window.fetch(...args) };
}

test('source and served module are byte-identical and export only the explicit installer', () => {
  assert.equal(fs.readFileSync(path.join(root, 'demo/native-fixtures.js'), 'utf8'), source);
  assert.deepEqual(source.match(/export function \w+/g), ['export function installNativeFixtures']);
  assert.doesNotMatch(source, /localStorage|sessionStorage|XMLHttpRequest|WebSocket|navigator\./);
});

test('install requires app.js isolation and is idempotent without resetting state', async () => {
  const missing = setup(); delete missing.window.__demoRequests;
  assert.throws(() => missing.install(), /isolated app.js/);
  assert.equal(missing.calls.length, 0);
  const env = setup(), wrapped = env.install();
  await env.fetch(API + '/security/secrets/put', post({ name: 'recording_read_only', value: PLACEHOLDER }));
  assert.equal(env.install(), wrapped);
  assert.equal(env.window.fetch, wrapped);
  assert((await (await env.fetch(API + '/security/secrets/list')).json()).refs.some(ref => ref.name === 'recording_read_only'));
});

test('GET/POST lists return meaningful metadata and log only normalized paths', async () => {
  const env = setup(); env.install();
  for (const method of ['GET', 'POST']) {
    const rows = await (await env.fetch(API + '/security/env/list?private=not-logged', { method })).json();
    assert.equal(rows.ok, true); assert.equal(rows.count, rows.env.length);
    assert.equal(rows.env[0].name, 'NERYA_RECORDING_MODE');
    assert.equal(rows.env[0].secret_name, 'env.nerya_recording_mode');
    for (const key of ['name', 'secret_name', 'kind', 'owner', 'created_at', 'preview', 'fingerprint', 'ref']) assert.equal(typeof rows.env[0][key], 'string');
    assert(Array.isArray(rows.env[0].scope));
    const vault = await (await env.fetch(new URL(API + '/security/secrets/list'), { method })).json();
    assert(vault.refs.some(ref => ref.name === 'recording_market_data' && ref.kind === 'api_key'));
    assert(vault.refs.every(ref => ref.preview === PLACEHOLDER && !('value' in ref)));
  }
  assert.equal(env.calls.length, 0);
  assert.equal(env.requests.length, 4);
  assert(env.requests.every(row => /^\/security\/(env|secrets)\/list$/.test(row.path) && row.local));
  assert.doesNotMatch(JSON.stringify(env.requests), /private|not-logged|placeholder|body|headers/);
});

test('both native forms mutate memory; refs use the real env naming contract and upsert', async () => {
  const env = setup(); env.install();
  const saved = await (await env.fetch(API + '/security/secrets/put', post({
    name: 'recording_read_only', value: PLACEHOLDER, kind: 'bearer', scope: ['mcp.read'],
  }))).json();
  assert.equal(saved.ok, true); assert.equal(saved.ref.ref, 'vault://recording_read_only');
  assert.deepEqual(saved.ref.scope, ['mcp.read']);
  const req = new Request(API + '/security/env/put', post({ name: 'recording_read_only', value: PLACEHOLDER }));
  const putEnv = await (await env.fetch(req)).json();
  assert.equal(req.bodyUsed, false, 'body is read from a clone');
  assert.equal(putEnv.env.name, 'RECORDING_READ_ONLY');
  assert.equal(putEnv.env.ref, 'vault://env.recording_read_only');
  const listed = await (await env.fetch(API + '/security/env/list', { method: 'POST' })).json();
  assert.equal(listed.count, 2);
  await env.fetch(API + '/security/secrets/put', post({ name: 'recording_read_only', value: PLACEHOLDER, kind: 'opaque', scope: ['recording.read'] }));
  const vault = await (await env.fetch(API + '/security/secrets/list')).json();
  assert.equal(vault.refs.filter(ref => ref.name === 'recording_read_only').length, 1);
  assert.equal(vault.refs.find(ref => ref.name === 'recording_read_only').kind, 'opaque');
  assert(vault.refs.some(ref => ref.name === 'env.recording_read_only'));
  assert.equal(env.calls.length, 0);
});

test('invalid/non-placeholder input is neither retained nor echoed into responses/audit', async () => {
  const env = setup(); env.install();
  const before = await (await env.fetch(API + '/security/secrets/list')).json();
  for (const [route, body] of [
    ['/security/secrets/put', { name: 'recording_read_only', value: 'not-the-demo-placeholder' }],
    ['/security/env/put', { name: 'RECORDING_MODE', value: 'not-the-demo-placeholder' }],
    ['/security/env/put', { name: 'bad/name', value: PLACEHOLDER }],
    ['/security/secrets/put', { name: '../bad', value: PLACEHOLDER }],
    ['/security/secrets/put', { name: 'valid', value: PLACEHOLDER, scope: 'not-an-array' }],
    ['/security/secrets/put', []],
  ]) {
    const result = await env.fetch(API + route, post(body));
    assert.equal(result.status, 400); assert.equal((await result.json()).ok, false);
    assert.doesNotMatch(result.body, /not-the-demo-placeholder/);
  }
  assert.equal((await env.fetch(API + '/security/secrets/put', { method: 'POST', body: '{' })).status, 400);
  assert.deepEqual(await (await env.fetch(API + '/security/secrets/list')).json(), before);
  assert.doesNotMatch(JSON.stringify(env.requests), /not-the-demo-placeholder/);
  assert.equal(env.calls.length, 0);
});

test('unsupported exact paths and methods preserve the original deny response and arguments', async () => {
  const denied = response({ ok: false, error: 'original-deny' }, 405);
  const env = setup({ handler: () => denied }); env.install();
  for (const [route, method] of [
    ['/api/proxy/security/secrets/delete', 'POST'], ['/api/proxy/security/secrets/put', 'GET'],
    ['/api/proxy/security/env/put', 'PUT'], ['/api/proxy/security/env/list', 'DELETE'],
    ['/api/proxy/evolution/timeline', 'PATCH'], ['/api/proxy/strategy/start', 'POST'],
    ['/api/security/env/put', 'POST'], ['/api/proxy/security/env/put/', 'POST'],
    ['/api/proxy/security/env/put-extra', 'POST'], ['/static/file.json', 'GET'],
  ]) {
    const input = ORIGIN + route, init = { method, body: '{}' };
    assert.equal(await env.fetch(input, init), denied);
    assert.equal(env.calls.at(-1).input, input); assert.equal(env.calls.at(-1).init, init);
  }
  const input = new Request(API + '/security/env/put', post({ name: 'recording', value: PLACEHOLDER }));
  const init = { method: 'GET' };
  assert.equal(await env.fetch(input, init), denied, 'init method overrides Request method');
  assert.equal(env.calls.at(-1).input, input); assert.equal(input.bodyUsed, false);
});

test('external origins/protocols are blocked without ever invoking original fetch', async () => {
  const env = setup(); env.install();
  for (const input of ['https://outside.example/api/proxy/security/env/list', '//recording.example.evil/api/proxy/security/env/list', 'data:application/json,{}']) {
    await assert.rejects(env.fetch(input), /blocks all external/);
  }
  assert.equal(env.calls.length, 0); assert.equal(env.requests.length, 0);
});

test('pre-aborted init/Request signals and abort during body read prevent mutation', async () => {
  const env = setup(); env.install();
  const controller = new AbortController(); controller.abort();
  await assert.rejects(env.fetch(API + '/security/env/put', { ...post({ name: 'recording', value: PLACEHOLDER }), signal: controller.signal }), { name: 'AbortError' });
  await assert.rejects(env.fetch(new Request(API + '/security/secrets/list', { signal: controller.signal })), { name: 'AbortError' });
  const pendingController = new AbortController(); let finish;
  const input = { url: API + '/security/secrets/put', method: 'POST', signal: pendingController.signal,
    clone: () => ({ text: () => new Promise(resolve => { finish = resolve; }) }) };
  const pending = env.fetch(input); pendingController.abort();
  await assert.rejects(pending, { name: 'AbortError' });
  finish(JSON.stringify({ name: 'recording_read_only', value: PLACEHOLDER }));
  const listed = await (await env.fetch(API + '/security/secrets/list')).json();
  assert(!listed.refs.some(ref => ref.name === 'recording_read_only'));
  assert.equal(env.calls.length, 0);
});

test('timeline supplement preserves original records and fills config/raw/summary without duplicate audit', async () => {
  const proposal = { id: 'proposal-014', state: 'pending', title: 'Demo review, not applied' };
  const payload = { ok: true, count: 1, extra: 'preserved', timeline: [{ id: proposal.id, title: proposal.title, summary: 'Recorded demo proposal', stage: 'review', created_at: '2026-09-20T08:00:00Z', proposal }] };
  const env = setup({ timeline: payload }); env.install();
  const result = await (await env.fetch(API + '/evolution/timeline', { method: 'POST', body: '{}' })).json();
  assert.equal(result.extra, 'preserved'); assert.deepEqual(result.timeline[0].proposal, proposal);
  assert.equal(result.timeline[0].record_id, proposal.id); assert.equal(result.timeline[0].ts, payload.timeline[0].created_at);
  assert.equal(result.config.periodic_reflection.enabled, false); assert.equal(result.config.periodic_reflection.configured, false);
  assert.equal(result.config.periodic_reflection.target, 'skill:evolution.reflect');
  for (const key of ['signals', 'events', 'assets', 'candidates', 'validation_plans', 'proposals']) assert(Array.isArray(result.raw[key]));
  assert.deepEqual(result.raw.proposals, [proposal]);
  assert.equal(result.summary.open_proposals, 1); assert.equal(result.summary.timeline_items, 1);
  assert.equal(env.requests.length, 1); assert.equal(env.requests[0].path, '/evolution/timeline');
  assert.equal(payload.config, undefined, 'original data was not mutated');
});

test('timeline retains supplied config/raw/summary, audits a silent delegate, and does not mask denial', async () => {
  const env = setup({ audit: false, timeline: { ok: true, timeline: [], config: { periodic_reflection: { enabled: true, time: '04:15' } }, raw: { assets: [{ id: 'demo-asset' }] }, summary: { events: 7 } } });
  env.install(); const result = await (await env.fetch(API + '/evolution/timeline')).json();
  assert.equal(result.config.periodic_reflection.enabled, true); assert.equal(result.config.periodic_reflection.time, '04:15');
  assert.equal(result.raw.assets[0].id, 'demo-asset'); assert.equal(result.summary.events, 7);
  assert.equal(env.requests.length, 1);
  for (const denied of [response({ ok: false }, 403), response({ ok: false }, 200)]) {
    const failed = setup({ handler: () => denied }); failed.install();
    assert.equal(await failed.fetch(API + '/evolution/timeline'), denied);
  }
});

test('abort while delegated timeline waits rejects promptly', async () => {
  let finish; const env = setup({ handler: () => new Promise(resolve => { finish = resolve; }) });
  env.install(); const controller = new AbortController();
  const pending = env.fetch(API + '/evolution/timeline', { method: 'POST', signal: controller.signal });
  controller.abort(); await assert.rejects(pending, { name: 'AbortError' });
  finish(response({ ok: true, timeline: [] }));
});

test('abort also applies to pending unsupported pass-through without changing its arguments', async () => {
  let finish; const env = setup({ handler: () => new Promise(resolve => { finish = resolve; }) });
  env.install(); const controller = new AbortController();
  const init = { method: 'POST', signal: controller.signal, body: '{}' };
  const pending = env.fetch(API + '/unknown/write', init);
  assert.equal(env.calls[0].init, init);
  controller.abort(); await assert.rejects(pending, { name: 'AbortError' });
  finish(response({ ok: false, error: 'original-demo-deny' }));
});
