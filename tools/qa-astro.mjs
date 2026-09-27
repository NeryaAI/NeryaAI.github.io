// Run: ego-browser nodejs < tools/qa-astro.mjs
// Uses the already-authorized task space; never claims control or creates a space.
const fs = await import('node:fs/promises');
const assert = (await import('node:assert/strict')).default;
const evidence = '/Users/rick/Documents/Project/Nerya/landing-page/docs/ui-refresh-evidence-20260926';
await fs.mkdir(evidence, { recursive: true });
const task = await taskSpace(20), p = task.page(process.env.NERYA_BROWSER_PAGE || 'p1');
const startAt = Number(process.env.NERYA_QA_FROM || 0);
const results = startAt ? JSON.parse(await fs.readFile(`${evidence}/checks.json`,'utf8')).results.slice(0,startAt) : [];
let group = 0;
const run = async (name, fn) => { if(group++ < startAt)return; const details = await fn(); results.push({ name, passed: true, evidence: details }); await fs.writeFile(`${evidence}/checks.json`,JSON.stringify({checkedAt:new Date().toISOString(),results},null,2)); console.log('PASS:', name); };
const settle = async () => p.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const section = async id => { await p.evaluate(id => document.getElementById(id).scrollIntoView({ block: 'start', behavior: 'instant' }), id); await settle(); };
const capture = async name => { await settle(); await p.screenshot({ path: `${evidence}/${name}.png` }); };
const waitFrame = async hash => p.waitForFunction(hash => document.querySelector('#agent-frame').contentWindow.location.hash.split('?')[0] === `#${hash}`, hash, { timeout: 10000 });
await p.cdp('Emulation.setDeviceMetricsOverride', { width:1440, height:1000, deviceScaleFactor:1, mobile:false });
await p.cdp('Runtime.enable');
await p.goto('http://127.0.0.1:4173/');
await p.waitForFunction(() => window.NeryaLanding && document.querySelector('#agent-frame').contentDocument?.documentElement.dataset.demo === 'real-agent');
// Ground truth for the controls operated by this suite.
console.log(await p.snapshot());
await run('Astro entry, six native recordings and retained real workspace', async () => {
  const info = await p.evaluate(() => ({ title:document.title, heading:document.querySelector('h1').innerText, headings:[...document.querySelectorAll('h1,h2')].map(h=>h.textContent), films:[...document.querySelectorAll('.product-film')].map(f=>({id:f.dataset.film,video:f.querySelector('video').dataset.src,gif:f.querySelector('.film-gif').dataset.src})), real:document.querySelector('#agent-frame').contentDocument.documentElement.dataset.demo, overflow:document.documentElement.scrollWidth>innerWidth }));
  assert.equal(info.real,'real-agent'); assert.equal(info.films.length,6); assert.equal(info.overflow,false); assert(info.headings.every(h=>!/[。，]/.test(h))); assert(!/实盘|paper/i.test(info.heading));
  assert(info.films.every(f=>f.video.startsWith('/assets/product-recordings/')&&f.gif.startsWith('/assets/product-recordings/')));
  if(await p.evaluate(()=>document.documentElement.lang==='en'))await p.click('#language');
  if(await p.evaluate(()=>window.NeryaTheme.mode==='dark'))await p.click('#theme-toggle');
  await p.evaluate(()=>window.scrollTo({top:0,behavior:'instant'})); await capture('hero-light'); return info;
});
await run('Each film loads, advances, pauses, replays and seeks', async () => {
  const info=[];
  for(const id of ['strategy','team','evolution','vault','markets','integrations']){
    await section(id);
    await p.waitForFunction(id=>{const v=document.querySelector(`[data-film="${id}"] video`);return v.readyState>=2&&!v.paused&&v.currentTime>.15;},id,{timeout:15000});
    await p.click(`[data-film="${id}"] .film-toggle`);
    assert(await p.evaluate(id=>document.querySelector(`[data-film="${id}"] video`).paused,id));
    await p.click(`[data-film="${id}"] [data-cue="2"]`);
    await p.waitForFunction(id=>{const v=document.querySelector(`[data-film="${id}"] video`);return v.paused&&v.currentTime>5.9;},id,{timeout:5000});
    await capture(`${id}-light`);
    info.push(await p.evaluate(id=>{const v=document.querySelector(`[data-film="${id}"] video`);return {id,time:v.currentTime,duration:v.duration,width:v.videoWidth,height:v.videoHeight,paused:v.paused};},id));
    assert.equal(info.at(-1).width,2560);assert.equal(info.at(-1).height,1600);
    await p.click(`[data-film="${id}"] .film-replay`);
    await p.waitForFunction(id=>{const v=document.querySelector(`[data-film="${id}"] video`);return !v.paused&&v.currentTime<3;},id,{timeout:5000});
  }
  return info;
});
await run('GIF embed and offscreen resource suspension', async()=>{
  await section('strategy');await p.click('[data-film="strategy"] .film-format');
  await p.waitForFunction(()=>{const img=document.querySelector('[data-film="strategy"] .film-gif');return !img.hidden&&img.complete&&img.naturalWidth>0&&img.currentSrc.endsWith('.gif');},undefined,{timeout:10000});
  const playing=await p.evaluate(()=>document.querySelector('[data-film="strategy"] .film-gif').currentSrc);
  await p.click('[data-film="strategy"] .film-toggle');
  assert(await p.evaluate(()=>document.querySelector('[data-film="strategy"] .film-gif').src.endsWith('-poster.webp')));
  await p.click('[data-film="strategy"] .film-format');
  // The compact footer cannot scroll the last large film fully offscreen.
  // The hero is above all films and establishes a genuine offscreen state.
  await p.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await settle();await p.waitForFunction(()=>[...document.querySelectorAll('.product-film video')].every(v=>v.paused));
  return {gif:playing,offscreenPaused:true};
});
await run('Global pause and reduced motion keep stills readable',async()=>{
  await p.cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await section('team');
  await p.waitForFunction(()=>[...document.querySelectorAll('.product-film video')].every(v=>v.paused));
  const states=await p.evaluate(()=>({paused:document.querySelector('#motion-toggle').getAttribute('aria-pressed'),gifs:[...document.querySelectorAll('.film-gif')].every(i=>!i.currentSrc.endsWith('.gif')),title:document.querySelector('#team-title').innerText}));
  assert.equal(states.paused,'true');assert(states.gifs);await capture('reduced-motion');
  await p.cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  await p.evaluate(()=>document.querySelector('#motion-toggle').scrollIntoView({block:'center',behavior:'instant'}));await settle();
  await p.click('#motion-toggle');
  await p.waitForFunction(()=>[...document.querySelectorAll('.product-film video')].every(v=>v.paused));
  await p.click('#motion-toggle');return states;
});
await run('Feature handoffs use the native app including settings',async()=>{
  for(const [id,route] of [['strategy','/chat/demo-strategy'],['team','/agents'],['evolution','/self-evolution'],['vault','/settings']]){
    await section(id);await p.click(`#${id} [data-open-agent]`);await waitFrame(route);
    await p.waitForFunction(()=>document.querySelector('#agent-frame').contentDocument.body.innerText.length>100);
    assert.deepEqual(await p.evaluate(()=>document.querySelector('#agent-frame').contentWindow.__demoErrors||[]),[]);
  }
  return {routes:['strategy','agents','self-evolution','settings'],nativeErrors:[]};
});
await run('Four market workflows preserve the chosen strategy',async()=>{
  const hashes=[];
  for(const id of ['crypto','prediction','futures','equities']){
    await p.evaluate(id=>document.querySelector(`[data-market="${id}"]`).scrollIntoView({behavior:'instant',block:'center'}),id);await settle();
    await p.click(`[data-market="${id}"]`);await p.click('#market-open');
    await p.waitForFunction(id=>document.querySelector('#agent-frame').contentWindow.location.hash===`#${window.__neryaMarkets.find(m=>m.id===id).route}`,id,{timeout:10000});
    const info=await p.evaluate(()=>({hash:document.querySelector('#agent-frame').contentWindow.location.hash,href:document.querySelector('#standalone-demo').href}));
    assert(info.href.endsWith(info.hash));hashes.push(info.hash);
    await p.waitForFunction(()=>document.querySelector('#agent-frame').contentDocument.querySelector('[aria-label="切换策略"]'));
    await p.waitForFunction(()=>{const now=performance.now();if(window.__qaScrollY!==scrollY){window.__qaScrollY=scrollY;window.__qaScrollAt=now;return false;}return now-(window.__qaScrollAt||now)>180;});
  }
  return hashes;
});
await run('Connector request transfers as an unsent editable draft',async()=>{
  await section('integrations');await p.fill('#integration-prompt','帮我接入 ExampleX 的行情接口并添加数据校验');await p.click('#integration-form button[type=submit]');await waitFrame('/chat');
  await p.waitForFunction(()=>document.querySelector('#agent-frame').contentDocument.querySelector('textarea')?.value.includes('ExampleX'),undefined,{timeout:10000});
  const draft=await p.evaluate(()=>({value:document.querySelector('#agent-frame').contentDocument.querySelector('textarea').value,status:document.querySelector('#integration-status').innerText}));
  assert(draft.value.includes('ExampleX'));assert(draft.status.includes('发送'));return draft;
});
await run('Language, theme and route state remain synchronized',async()=>{
  await p.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await p.click('#theme-toggle');await p.click('#language');
  await p.waitForFunction(()=>document.querySelector('#agent-frame').contentDocument.documentElement.style.colorScheme==='dark');
  const info=await p.evaluate(()=>({lang:document.documentElement.lang,theme:window.NeryaTheme.mode,frameTheme:document.querySelector('#agent-frame').contentDocument.documentElement.style.colorScheme,draft:document.querySelector('#integration-prompt').value,hash:document.querySelector('#agent-frame').contentWindow.location.hash}));
  assert.equal(info.lang,'en');assert.equal(info.theme,'dark');assert(info.draft.includes('ExampleX'));assert.equal(info.hash,'#/chat');
  await capture('hero-dark-en');await section('vault');await capture('vault-dark-en');
  await p.reload();await p.waitForFunction(()=>window.NeryaLanding);assert.equal(await p.evaluate(()=>window.NeryaTheme.mode),'dark');assert.equal(await p.evaluate(()=>document.documentElement.lang),'en');
  return info;
});
await run('Mobile widths, bilingual headings and menus',async()=>{
  const sizes=[];
  for(const width of [320,390,768]){
    await p.cdp('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});await settle();
    const info=await p.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,headings:[...document.querySelectorAll('h1,h2')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).map(e=>e.textContent)}));
    assert(info.scroll<=info.width+1,JSON.stringify(info));assert.equal(info.headings.length,0);sizes.push(info);
  }
  await p.cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});await p.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await settle();
  await p.click('#menu-toggle');assert.equal(await p.evaluate(()=>document.querySelector('#menu-toggle').getAttribute('aria-expanded')),'true');await p.press('#menu-toggle','Escape');
  await capture('mobile-dark-en');await p.click('#language');await p.click('#theme-toggle');await section('strategy');await capture('mobile-strategy-light');
  return sizes;
});
await run('Setup modal, keyboard close and local-only runtime',async()=>{
  await p.cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await p.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await settle();
  await p.click('.site-header [data-start]');assert(await p.evaluate(()=>document.querySelector('#start-dialog').open));await p.press('#close-dialog','Escape');assert.equal(await p.evaluate(()=>document.querySelector('#start-dialog').open),false);
  const issues=await p.evaluate(()=>({external:performance.getEntriesByType('resource').filter(r=>!r.name.startsWith(location.origin)&&!r.name.startsWith('data:')).map(r=>r.name),missing:performance.getEntriesByType('resource').filter(r=>r.responseStatus>=400).map(r=>({url:r.name,status:r.responseStatus})),nativeErrors:document.querySelector('#agent-frame').contentWindow.__demoErrors||[]}));
  assert.deepEqual(issues.external,[]);assert.deepEqual(issues.missing,[]);assert.deepEqual(issues.nativeErrors,[]);await capture('final-hero');return issues;
});
await fs.writeFile(`${evidence}/checks.json`,JSON.stringify({checkedAt:new Date().toISOString(),results},null,2));
console.log(JSON.stringify({passed:results.length,evidence}));
