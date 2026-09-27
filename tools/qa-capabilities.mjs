// ego-browser nodejs < tools/qa-capabilities.mjs
const assert=(await import('node:assert/strict')).default;
const fs=await import('node:fs/promises');
const task=await taskSpace(20),p=task.page('p1');
const base='/Users/rick/Documents/Project/Nerya/landing-page/docs/redesign-evidence-20260921';
const checks=[];
const check=async(name,fn)=>{await fn();checks.push(name);console.log('PASS',name);};
const content=selector=>p.evaluate(s=>document.querySelector(s)?.textContent||'',selector);
const section=selector=>p.evaluate(s=>document.querySelector(s).scrollIntoView({behavior:'instant',block:'start'}),selector);
const shot=name=>p.screenshot({path:base+'/'+name+'.png'});
async function settleTheme(){await p.evaluate(()=>Promise.all(document.getAnimations().filter(a=>a.playState==='running'&&a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{}))));}
async function theme(value){if(await p.evaluate(()=>document.documentElement.dataset.theme)!==value)await p.click('#theme-toggle');await p.waitForFunction(v=>{const root=document.querySelector('#agent-frame').contentDocument.documentElement;return document.documentElement.dataset.theme===v&&root.classList.contains('light')===(v==='light');},value,{timeout:5000});await settleTheme();}
await p.cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
await p.goto('http://127.0.0.1:4173/');await p.reload();await p.waitForSelector('html[data-ready="true"]');
if(await p.evaluate(()=>document.documentElement.lang==='en'))await p.click('#language');
await p.evaluate(()=>{window.__capErrors=[];addEventListener('error',e=>window.__capErrors.push(e.message||'resource error'));addEventListener('unhandledrejection',e=>window.__capErrors.push(String(e.reason)));});
await check('Light/dark persistence and real Agent synchronization',async()=>{
 await theme('dark');await p.reload();await p.waitForFunction(()=>document.documentElement.dataset.theme==='dark'&&!document.querySelector('#agent-frame').contentDocument.documentElement.classList.contains('light'),undefined,{timeout:5000});
 await p.evaluate(()=>scrollTo(0,0));await settleTheme();await shot('capabilities-hero-dark');await theme('light');await shot('capabilities-hero-light');
});
await check('Collaboration playback, interruption, reverse and artifacts',async()=>{
 await section('#mission-console');await p.click('#mission-reset');await p.click('#mission-play');await p.waitForFunction(()=>document.querySelector('#mission-progress').value==='1',undefined,{timeout:5000});await p.click('#mission-play');
 assert.equal(await p.evaluate(()=>document.querySelector('#mission-play').getAttribute('aria-pressed')),'false');
 await p.press('#mission-progress','End');assert((await content('#mission-artifact')).includes('candidate'));
 await p.press('#mission-progress','Home');assert((await content('#mission-artifact')).includes('plan.md'));
 await p.click('[data-mission="2"]');assert((await content('#mission-message')).includes('反例'));await shot('capabilities-team-light');
});
await check('Four market workflows and distinct support boundaries',async()=>{
 await section('#markets');
 for(const [id,word] of [['crypto','CCXT'],['prediction','Polymarket'],['futures','VNpy'],['equities','Tushare']]){
  await p.click('#market-'+id);assert((await content('#market-sources')).includes(word));assert.equal(await p.evaluate(()=>document.querySelectorAll('[data-flow-node]').length),5);
 }
 await p.click('#market-validate');assert((await content('#market-validation')).includes('5 个步骤'));
 await p.click('#market-prediction');assert((await content('#market-support')).includes('未启用实盘下单'));await theme('dark');await shot('capabilities-markets-dark');
 await p.click('#market-equities');await p.click('#market-open');await p.waitForFunction(()=>document.querySelector('#agent-frame').contentWindow.location.hash.includes('ashare_factor_rotation'),undefined,{timeout:5000});
 await p.waitForFunction(()=>document.querySelector('#agent-frame').contentDocument.body.innerText.includes('A 股因子轮动'),undefined,{timeout:5000});await shot('capabilities-ashare-native');
});
await check('Evolution requires validation and separates approval/application/rollback',async()=>{
 await section('#evolution-console');await p.click('#evolution-reset');await p.click('[data-evolution-step="4"]');
 assert.equal(await p.evaluate(()=>document.querySelector('[data-evolution-action="approve"]')===null),true);
 await p.click('[data-evolution-action="validate"]');await p.click('[data-evolution-action="approve"]');assert.equal((await content('#evolution-version')).trim(),'v1.3.2');
 await p.click('[data-evolution-action="apply"]');assert.equal((await content('#evolution-version')).trim(),'v1.3.3');await shot('capabilities-evolution-dark');
 await p.click('[data-evolution-action="rollback"]');assert.equal((await content('#evolution-version')).trim(),'v1.3.2');
 await p.click('#evolution-reset');for(let i=0;i<4;i++)await p.click('#evolution-next');await p.click('[data-evolution-action="reject"]');assert((await content('#evolution-status')).includes('退回修改'));
});
await check('Adapter reuse/new branches, error state and usable plan download',async()=>{
 await section('#adapters');await p.fill('#adapter-prompt','hi');await p.click('#adapter-generate');assert((await content('#adapter-status')).includes('请描述'));
 await p.click('[data-adapter-preset="existing"]');await p.click('#adapter-generate');await p.waitForFunction(()=>!document.querySelector('#adapter-download').disabled,undefined,{timeout:6000});assert((await content('#adapter-code')).includes('ccxt_bridge'));assert((await content('#adapter-target')).includes('Bybit'));
 await p.click('[data-adapter-preset="new"]');await p.click('#adapter-generate');await p.waitForFunction(()=>!document.querySelector('#adapter-download').disabled,undefined,{timeout:6000});assert((await content('#adapter-code')).includes('workspace_provider'));assert((await content('#adapter-code')).includes('"place_order": false'));await shot('capabilities-adapter-dark');
 const download=p.waitForEvent('download',{timeout:10000});await p.click('#adapter-download');const file=await download;await file.saveAs(base+'/examplex-integration-plan.json');
 const plan=JSON.parse(await fs.readFile(base+'/examplex-integration-plan.json','utf8'));assert.equal(plan.liveEnabled,false);assert.equal(plan.target,'ExampleX');assert.equal(plan.validation,'required');
});
await check('Bilingual state retention',async()=>{
 await p.click('#language');assert((await content('#market-sources')).includes('Tushare'));assert((await content('#adapter-target')).includes('ExampleX'));assert((await content('#evolution-status')).includes('revision'));await p.click('#language');
});
await check('Native Agent handles A-share and new-connector requests',async()=>{
 await section('#workspace');await p.click('#scenario-home');
 await p.fill('textarea[placeholder="随心输入…"]','构建一个 A 股因子轮动策略，检查样本外验证。');await p.click('button[aria-label="发送"]');
 await p.waitForFunction(()=>{const d=document.querySelector('#agent-frame').contentDocument;return d.body.innerText.includes('A 股策略工作区')&&d.body.innerText.includes('Tushare')&&!!d.querySelector('button[aria-label="发送"]')&&!d.querySelector('textarea[placeholder="给 Nerya 发消息…"]').disabled;},undefined,{timeout:15000});
 await p.fill('textarea[placeholder="给 Nerya 发消息…"]','帮我接入 ExampleX 的行情与账户接口。');await p.click('button[aria-label="发送"]');
 await p.waitForFunction(()=>{const d=document.querySelector('#agent-frame').contentDocument;return d.body.innerText.includes('ExampleX 接入方案')&&d.body.innerText.includes('订单权限保持关闭')&&!!d.querySelector('button[aria-label="发送"]')&&!d.querySelector('textarea[placeholder="给 Nerya 发消息…"]').disabled;},undefined,{timeout:15000});
 await shot('capabilities-native-chat-dark');
});
await check('Mobile 390/320px in both themes',async()=>{
 for(const width of [390,320]){
  await p.cdp('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true});
  for(const mode of ['dark','light']){await theme(mode);await p.evaluate(()=>scrollTo(0,0));assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await shot(`capabilities-mobile-${width}-${mode}`);}
  await section('#markets');await p.click('#market-futures');assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await shot(`capabilities-mobile-${width}-market`);
  await section('#adapters');assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await shot(`capabilities-mobile-${width}-adapter`);
 }
});
await check('Reduced motion and no unintended external requests',async()=>{
 await p.cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await section('#mission-console');await p.click('#mission-reset');await p.click('#mission-play');assert.equal(await p.evaluate(()=>document.querySelector('#mission-progress').value),'1');assert.equal(await p.evaluate(()=>document.querySelector('#mission-play').getAttribute('aria-pressed')),'false');
 const network=await p.evaluate(()=>performance.getEntriesByType('resource').filter(r=>/^(fetch|xmlhttprequest)$/.test(r.initiatorType)).map(r=>r.name));assert.deepEqual(network,[]);
 assert.equal(await p.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior),'auto');
 const errors=await p.evaluate(()=>window.__capErrors||[]);assert.deepEqual(errors,[]);
});
await p.cdp('Emulation.setEmulatedMedia',{features:[]});await p.cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await theme('dark');await p.evaluate(()=>scrollTo(0,0));
await fs.writeFile(base+'/capability-checks.json',JSON.stringify({checkedAt:new Date().toISOString(),browser:'Ego Browser',checks,passed:checks.length,viewports:[1440,390,320],themes:['light','dark'],languages:['zh','en']},null,2)+'\n');console.log({passed:checks.length});
