// Run through the task-owned Ego Browser: ego-browser nodejs < tools/qa-real-agent.mjs
const assert=(await import('node:assert/strict')).default;
const fs=await import('node:fs/promises');
const task=await taskSpace(20), site=task.page('p2'), app=task.page('p3');
const base='/Users/rick/Documents/Project/Nerya/landing-page/docs/redesign-evidence-20260921';
const checks=[];
const check=async(name,fn)=>{await fn();checks.push(name);console.log('PASS',name);};
await site.cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
await site.goto('http://127.0.0.1:4173/');await site.reload();
if(await site.evaluate(()=>document.documentElement.lang==='en'))await site.click('#language');
await check('Clean copy, background, source-backed iframe',async()=>{
 const r=await site.evaluate(()=>({bad:/交互预览|交互沙盒|本地演示|真实 Agent 界面/.test(document.body.innerText),art:document.querySelector('.agent-stage-art'),frame:document.querySelector('#agent-frame').getAttribute('src'),overflow:document.documentElement.scrollWidth>innerWidth}));
 assert.equal(r.bad,false);assert.equal(r.art,null);assert.equal(r.frame,'demo/index.html?lang=zh');assert.equal(r.overflow,false);
});
await check('Motion pause and reduced-motion stable canvas',async()=>{
 await site.evaluate(()=>scrollTo(0,0));await site.click('#motion-toggle');
 assert.equal(await site.evaluate(()=>document.querySelector('#motion-toggle').getAttribute('aria-pressed')),'true');
 const before=await site.evaluate(()=>document.querySelector('#idea-field').toDataURL());
 await new Promise(r=>setTimeout(r,250));assert.equal(await site.evaluate(()=>document.querySelector('#idea-field').toDataURL()),before);
 await site.click('#motion-toggle');
 await site.cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 assert.equal(await site.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior),'auto');
 await site.cdp('Emulation.setEmulatedMedia',{features:[]});
});
await check('Route tabs and expanded workspace',async()=>{
 await site.evaluate(()=>document.querySelector('#workspace').scrollIntoView({block:'start',behavior:'instant'}));
 await site.click('#scenario-strategy');await site.waitForFunction(()=>document.querySelector('iframe').contentWindow.location.hash==='#/chat/demo-strategy',undefined,{timeout:6000});
 await site.click('#expand-agent');assert.equal(await site.evaluate(()=>document.querySelector('#agent-frame-shell').classList.contains('expanded')),true);
 await site.keyboard.press('Escape');assert.equal(await site.evaluate(()=>document.querySelector('#agent-frame-shell').classList.contains('expanded')),false);
 await site.screenshot({path:base+'/final-workspace-desktop.png'});
});
await check('Setup dialog and Escape',async()=>{
 await site.evaluate(()=>scrollTo(0,0));await site.click('.header [data-start]');
 assert.equal(await site.evaluate(()=>document.querySelector('#start-dialog').open),true);await site.keyboard.press('Escape');
 assert.equal(await site.evaluate(()=>document.querySelector('#start-dialog').open),false);
});
await check('390px and 320px bilingual layout and mobile menu',async()=>{
 for(const width of [390,320]){
  await site.cdp('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true});await site.evaluate(()=>scrollTo(0,0));
  assert.equal(await site.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await site.click('#menu-toggle');assert.equal(await site.evaluate(()=>document.querySelector('#menu-toggle').getAttribute('aria-expanded')),'true');await site.keyboard.press('Escape');
  await site.screenshot({path:base+`/final-mobile-${width}-zh.png`});await site.click('#language');assert.equal(await site.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await site.screenshot({path:base+`/final-mobile-${width}-en.png`});await site.click('#language');
 }
});
await app.goto('http://127.0.0.1:4173/demo/index.html?lang=zh#/');await app.reload();
await app.cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
await app.evaluate(()=>{window.__qaErrors=[];addEventListener('error',e=>window.__qaErrors.push(e.message||'resource error'));addEventListener('unhandledrejection',e=>window.__qaErrors.push(String(e.reason)));});
await check('Native prompt starters and streaming chat',async()=>{
 await app.click('[data-testid="starter-question"] >> nth=0');assert((await app.evaluate(()=>document.querySelector('textarea').value)).length>20);
 await app.fill('textarea','请研究 BTC 趋势，并让团队交叉核查。');await app.click('button[aria-label="发送"]');
 await app.waitForFunction(()=>document.body.innerText.includes('BTC · 趋势仍在'),undefined,{timeout:15000});
 assert.equal(await app.evaluate(()=>document.body.innerText.includes('Demo unavailable')),false);
 assert((await app.evaluate(()=>window.__demoRequests)).some(r=>r.path==='/agent/run_turn_internal'&&r.local));
});
await app.goto('http://127.0.0.1:4173/demo/index.html?lang=zh#/chat/demo-research');
await check('Three native members, continuing a member, files',async()=>{
 await app.waitForSelector('textarea[placeholder="继续与 researcher 对话…"]');
 assert.equal(await app.evaluate(()=>document.querySelectorAll('[aria-label="任务成员"] [role=tab]').length),3);
 await app.fill('textarea[placeholder="继续与 researcher 对话…"]','保留风险上限，补充成交量反例。');await app.click('text="继续此 agent"');
 await app.waitForFunction(()=>document.body.innerText.includes('已将成交量确认'),undefined,{timeout:8000});
 await app.screenshot({path:base+'/final-agent-member.png'});
 await app.click('loc=role:tab[name="文件"]');await app.click('[data-testid="workspace-files"] button:has-text("research")');await app.click('[data-testid="workspace-files"] button:has-text("market-context.json")');
 await app.waitForFunction(()=>document.querySelector('#task-workspace').innerText.includes('confirmation_bars'),undefined,{timeout:5000});
 assert(await app.evaluate(()=>document.querySelector('#task-workspace').innerText.includes('max_position_pct')));
});
await check('Three strategy workflows and native node editor',async()=>{
 await app.goto('http://127.0.0.1:4173/demo/index.html?lang=zh#/strategies');assert.equal(await app.evaluate(()=>document.querySelectorAll('[data-testid="strategy-directory-card"]').length),3);
 await app.click('button[aria-label="打开策略：BTC 趋势跟随"]');await app.click('button[aria-label="编辑详情: 市场研究员"]');
 assert((await app.evaluate(()=>document.querySelector('textarea[aria-label="编辑文件内容"]').value)).includes('市场研究员'));
 await app.click('button[aria-label="关闭详情"]');await app.screenshot({path:base+'/final-strategy-canvas.png'});
});
await check('Mobile real app and no external requests',async()=>{
 await app.goto('http://127.0.0.1:4173/demo/index.html?lang=zh#/');await app.cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 assert.equal(await app.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await app.screenshot({path:base+'/final-agent-mobile.png'});
 const external=await app.evaluate(()=>performance.getEntriesByType('resource').filter(r=>r.initiatorType==='fetch'||r.initiatorType==='xmlhttprequest').map(r=>r.name));assert.deepEqual(external,[]);
 assert.equal(await app.evaluate(()=>/bybit|byreal|binance|okx|bitget|coinbase|hyperliquid|交易所/i.test(document.body.innerText)),false);
 const errors=await app.evaluate(()=>window.__qaErrors||[]);assert.deepEqual(errors,[]);
});
await site.cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await site.evaluate(()=>scrollTo(0,0));
await site.screenshot({path:base+'/final-landing-desktop.png'});
await fs.writeFile(base+'/final-interaction-checks.json',JSON.stringify({checkedAt:new Date().toISOString(),checks,passed:checks.length,browser:'Ego Browser',viewports:[1440,390,320],network:'No real API or external requests'},null,2)+'\n');
console.log({passed:checks.length});
