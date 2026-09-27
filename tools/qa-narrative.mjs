// Task-specific acceptance: ego-browser nodejs < tools/qa-narrative.mjs
// Reuse this goal's existing browser space; never operate a live Agent account.
const fs=await import('node:fs/promises');
const assert=(await import('node:assert/strict')).default;
const task=await taskSpace(27),p=task.page('p1');
assert.equal(task.ownership,'agent');
const out='/Users/rick/Documents/Project/Nerya/landing-page/docs/narrative-evidence';
await fs.mkdir(out,{recursive:true});
const results=[];
const save=async(name,data)=>{results.push({name,passed:true,data});await fs.writeFile(out+'/checks.json',JSON.stringify({checkedAt:new Date().toISOString(),results},null,2));console.log('PASS',name);};
const settle=()=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const at=async(y)=>{await p.evaluate(y=>window.scrollTo({top:y,behavior:'instant'}),y);await settle();};
const section=async(id)=>{await p.evaluate(id=>document.getElementById(id).scrollIntoView({block:'center',behavior:'instant'}),id);await settle();};
const shot=async(name)=>{await settle();await p.screenshot({path:out+'/'+name+'.png'});};
const read=()=>p.evaluate(()=>({lang:document.documentElement.lang,theme:document.documentElement.dataset.theme,scrollY,overflow:document.documentElement.scrollWidth>innerWidth,errors:window.__narrativeErrors||[]}));
const hook=await p.cdp('Page.addScriptToEvaluateOnNewDocument',{source:`window.__narrativeErrors=[];addEventListener('error',e=>e.message&&window.__narrativeErrors.push(e.message));addEventListener('unhandledrejection',e=>window.__narrativeErrors.push(String(e.reason?.stack||e.reason)));`});
try {
  await p.cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  await p.cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await p.goto('http://127.0.0.1:4173/?qa=narrative');
  await p.waitForFunction(()=>window.NeryaLanding&&document.querySelector('#agent-frame')?.contentDocument?.querySelector('textarea'),undefined,{timeout:15000});
  const arrival=await p.evaluate(async()=>{const ys=[];const start=performance.now();while(performance.now()-start<1200){ys.push(scrollY);await new Promise(r=>requestAnimationFrame(r));}return {min:Math.min(...ys),max:Math.max(...ys)};});
  assert.equal(arrival.max,0);await save('Arrival stays at top through iframe autofocus',arrival);
  console.log(await p.snapshot());
  if((await read()).lang==='en')await p.click('#language');
  if((await read()).theme==='dark')await p.click('#theme-toggle');
  const composition=await p.evaluate(()=>{const h=document.querySelector('h1').getBoundingClientRect(),w=document.querySelector('#agent-frame-shell').getBoundingClientRect();return {heroCards:document.querySelectorAll('.hero [data-results]').length,headingBottom:h.bottom,workspaceTop:w.top,centerDelta:Math.abs((h.left+h.right-w.left-w.right)/2),pose:document.querySelector('#agent-frame-shell').style.cssText,overflow:document.documentElement.scrollWidth>innerWidth};});
  assert.equal(composition.heroCards,0);assert(composition.workspaceTop<composition.headingBottom+50);assert(composition.centerDelta<2);assert(!composition.overflow);
  await shot('hero-zh-light');await save('Centered workspace rises behind the slogan; no right-hand card',composition);
  const poses=[];for(const y of [0,240,480,780]){await at(y);poses.push(await p.evaluate(()=>({y:scrollY,tilt:parseFloat(document.querySelector('#agent-frame-shell').style.getPropertyValue('--workspace-tilt')),scale:parseFloat(document.querySelector('#agent-frame-shell').style.getPropertyValue('--workspace-scale'))})));if(y===240)await shot('workspace-mid-reveal');}
  assert.equal(poses[0].tilt,34);assert(poses[1].tilt>poses[2].tilt&&poses[2].tilt>poses[3].tilt);assert.equal(poses[3].tilt,0);await save('Scroll-linked gradual 34 to 0 degree reveal',poses);
  await p.click('#expand-agent');await p.waitForFunction(()=>document.querySelector('#agent-frame-shell').classList.contains('expanded'));
  const expanded=await p.evaluate(()=>{const r=document.querySelector('#agent-frame-shell').getBoundingClientRect();return {top:r.top,left:r.left,right:r.right,bottom:r.bottom,width:innerWidth,height:innerHeight,perspective:getComputedStyle(document.querySelector('.workspace-stage')).perspective};});
  assert.equal(expanded.perspective,'none');assert(expanded.top<=17&&expanded.left<=17&&expanded.bottom>=expanded.height-17);await p.keyboard.press('Escape');assert(!await p.evaluate(()=>document.body.classList.contains('workspace-expanded')));await save('Expanded workspace remains viewport-fixed and closes by Escape',expanded);
  const ids=['strategy','team','evolution','vault','markets','integrations'];
  for(const id of ids){
    await section(id);await p.waitForFunction(id=>document.querySelector(`[data-story="${id}"]`)?.dataset.paused==='false',id,{timeout:5000});
    const baseline=await p.evaluate(id=>document.querySelector(`[data-story="${id}"]`).getAnimations({subtree:true})[0]?.currentTime,id);
    // Wait for actual progress rather than assuming the next rendered frame
    // arrives inside a 220 ms wall-clock interval after native input.
    await p.waitForFunction(({id,baseline})=>{const a=document.querySelector(`[data-story="${id}"]`).getAnimations({subtree:true})[0];return a&&a.currentTime!==baseline;},{id,baseline},{timeout:5000});
    const advancing=await p.evaluate(({id,baseline})=>{const a=document.querySelector(`[data-story="${id}"]`).getAnimations({subtree:true});return{count:a.length,before:baseline,after:a[0].currentTime};},{id,baseline});
    assert(advancing.count>0&&advancing.after!==advancing.before,JSON.stringify(advancing));
    await p.click(`[data-story="${id}"] [data-story-chapter="2"]`);
    const paused=await p.evaluate(async id=>{const el=document.querySelector(`[data-story="${id}"]`),a=el.getAnimations({subtree:true})[0];const before=a.currentTime;await new Promise(r=>setTimeout(r,120));return {paused:el.dataset.paused,chapter:el.dataset.chapter,before,after:a.currentTime};},id);
    assert.equal(paused.paused,'true');assert.equal(paused.chapter,'2');assert.equal(paused.after,paused.before);await shot('scene-'+id+'-zh-light');
    await p.click(`[data-story="${id}"] .story-replay`);await p.waitForFunction(id=>document.querySelector(`[data-story="${id}"]`).dataset.paused==='false',id);
    await save('Authored scene plays, seeks, pauses and replays: '+id,{advancing,paused});
  }
  await at(0);const offscreen=await p.evaluate(()=>[...document.querySelectorAll('[data-story]')].every(el=>el.dataset.paused==='true'));assert(offscreen);await save('Offscreen animations stop; no video/GIF requests',await p.evaluate(()=>({offscreen:[...document.querySelectorAll('[data-story]')].map(el=>[el.dataset.story,el.dataset.paused]),recordingRequests:performance.getEntriesByType('resource').filter(r=>/product-recordings/.test(r.name)).length,videoCount:document.querySelectorAll('video').length})));
  for(const [lang,theme] of [['en','dark'],['zh','dark'],['en','light'],['zh','light']]){
    if(((await read()).lang==='en'?'en':'zh')!==lang)await p.click('#language');if((await read()).theme!==theme)await p.click('#theme-toggle');
    await section('markets');await p.click('[data-story="markets"] [data-story-chapter="2"]');
    const state=await p.evaluate(()=>({lang:document.documentElement.lang,theme:document.documentElement.dataset.theme,visibleNative:[...document.querySelectorAll('.native-market .native-locale')].filter(el=>getComputedStyle(el).display!=='none').map(el=>el.innerText),overflow:document.documentElement.scrollWidth>innerWidth,errors:window.__narrativeErrors}));
    assert.equal(state.visibleNative.length,1);assert(!state.overflow,JSON.stringify(state));assert.deepEqual(state.errors,[]);if(lang==='en'&&theme==='dark')await shot('scene-market-en-dark');await save('Live language/theme adaptation: '+lang+'-'+theme,state);
  }
  await p.click('#result-tab-research');await p.click('#open-research-report');await p.waitForFunction(()=>document.querySelector('#research-report').open);assert.equal(await p.evaluate(()=>document.querySelectorAll('.full-report-section').length),5);await p.keyboard.press('Escape');await save('Result cards moved below hero and full report retained',{sections:5});
  await p.click('#motion-toggle');assert(await p.evaluate(()=>[...document.querySelectorAll('[data-story]')].every(el=>el.dataset.paused==='true')));await p.click('#motion-toggle');await save('Global pause controls the new authored scenes');
  for(const width of [768,390,320]){
    await p.cdp('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true});await p.goto('http://127.0.0.1:4173/?qa=narrative-mobile-'+width);await p.waitForFunction(()=>window.NeryaLanding&&document.querySelector('#agent-frame').contentDocument?.querySelector('textarea'));
    await p.waitForFunction(()=>getComputedStyle(document.querySelector('.hero-actions')).opacity==='1');const state=await read();assert.equal(state.scrollY,0);assert(!state.overflow);assert.deepEqual(state.errors,[]);
    const transform=await p.evaluate(()=>getComputedStyle(document.querySelector('#agent-frame-shell')).transform);assert.equal(transform,'none');if(width===390)await shot('hero-mobile-390');
    for(const id of ids){await section(id);await p.click(`[data-story="${id}"] [data-story-chapter="2"]`);assert(!(await read()).overflow);}
    if(width===390){await section('strategy');await shot('scene-strategy-mobile-390');}
    await save('Responsive hero and six scenes at '+width+'px',{...state,transform});
  }
  await p.cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await p.cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await p.goto('http://127.0.0.1:4173/?qa=narrative-reduced');await p.waitForFunction(()=>window.NeryaLanding);
  await section('strategy');const reduced=await p.evaluate(()=>({transform:getComputedStyle(document.querySelector('#agent-frame-shell')).transform,paused:[...document.querySelectorAll('[data-story]')].every(el=>el.dataset.paused==='true'),animations:document.querySelector('[data-story="strategy"]').getAnimations({subtree:true}).length,content:document.querySelector('.native-backtest').textContent.length}));assert.equal(reduced.transform,'none');assert(reduced.paused);assert.equal(reduced.animations,0);assert(reduced.content>40);await save('Reduced motion has upright workspace and readable static scenes',reduced);
  await p.cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});await p.goto('http://127.0.0.1:4173/');await p.waitForFunction(()=>window.NeryaLanding&&getComputedStyle(document.querySelector('.hero-actions')).opacity==='1');
  if((await read()).lang!=='en')await p.click('#language');if((await read()).theme!=='dark')await p.click('#theme-toggle');await shot('hero-en-dark');
  await p.click('#language');await p.click('#theme-toggle');await at(0);await shot('hero-zh-light');
  assert.deepEqual((await read()).errors,[]);console.log('COMPLETE',results.length,'browser acceptance groups');
} finally {await p.cdp('Page.removeScriptToEvaluateOnNewDocument',{identifier:hook.identifier});}
