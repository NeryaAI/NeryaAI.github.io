// ego-browser nodejs < tools/qa-avatars-copy.mjs
const assert=(await import('node:assert/strict')).default;
const fs=await import('node:fs/promises');
const task=await taskSpace(20),p=task.page('p1');
const base='/Users/rick/Documents/Project/Nerya/landing-page/docs/redesign-evidence-20260921';
const checks=[];
async function check(name,run){await run();checks.push(name);console.log('PASS',name);}
async function theme(value){if(await p.evaluate(()=>document.documentElement.dataset.theme)!==value)await p.click('#theme-toggle');await p.waitForFunction(v=>{const root=document.querySelector('#agent-frame').contentDocument.documentElement;return document.documentElement.dataset.theme===v&&root.classList.contains('light')===(v==='light');},value,{timeout:5000});await p.evaluate(()=>Promise.all(document.getAnimations().filter(a=>a.playState==='running'&&a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{}))));}
const scroll=selector=>p.evaluate(s=>document.querySelector(s).scrollIntoView({behavior:'instant',block:'start'}),selector);
const shot=name=>p.screenshot({path:base+'/'+name+'.png'});
await p.cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await p.goto('http://127.0.0.1:4173/');await p.reload();
await p.waitForFunction(()=>document.documentElement.dataset.ready==='true'&&[...document.querySelectorAll('img[data-avatar-role]')].every(i=>i.complete&&i.naturalWidth===192),undefined,{timeout:7000});
if(await p.evaluate(()=>document.documentElement.lang==='en'))await p.click('#language');
await check('Six local PNG identities; no role-symbol placeholders',async()=>{
 const state=await p.evaluate(()=>({roles:[...new Set([...document.querySelectorAll('img[data-avatar-role]')].map(i=>i.dataset.avatarRole))],placeholders:document.querySelectorAll('.role-icon,.member-orb svg').length,remote:[...document.querySelectorAll('img[data-avatar-role]')].some(i=>new URL(i.src).origin!==location.origin)}));
 assert.equal(state.roles.length,6);assert.equal(state.placeholders,0);assert.equal(state.remote,false);
});
await check('Role switching and desktop themes',async()=>{
 await scroll('#team');await p.click('#role-market');assert.equal(await p.evaluate(()=>document.querySelector('#team-detail img').dataset.avatarRole),'analyst');
 await p.click('#role-risk');assert.equal(await p.evaluate(()=>document.querySelector('#team-detail img').dataset.avatarRole),'risk');
 await theme('dark');await scroll('#team');await shot('avatars-team-dark');await theme('light');await shot('avatars-team-light');
});
await check('Native workflow portraits match each Agent role',async()=>{
 await scroll('#markets');await p.click('#market-crypto');await p.click('#market-open');
 await p.waitForFunction(()=>{const images=[...document.querySelector('#agent-frame').contentDocument.querySelectorAll('article[data-kind="agent"] img[data-avatar-role]')];return images.length===3&&images.every(i=>i.complete&&i.naturalWidth===192);},undefined,{timeout:7000});
 const state=await p.evaluate(()=>{const d=document.querySelector('#agent-frame').contentDocument;return [...d.querySelectorAll('article[data-kind="agent"] img[data-avatar-role]')].map(i=>({role:i.dataset.avatarRole,path:i.getAttribute('src'),loaded:i.complete&&i.naturalWidth===192}));});
 assert.deepEqual(state.map(i=>i.role).sort(),['researcher','reviewer','risk']);assert(state.every(i=>i.path.endsWith('.png')&&i.loaded));await scroll('#workspace');await shot('avatars-native-workflow');
});
await check('Native member tabs and conversation identity',async()=>{
 await scroll('#workspace');await p.click('#scenario-research');
 await p.waitForFunction(()=>document.querySelector('#agent-frame').contentDocument.querySelectorAll('[aria-label="任务成员"] img[data-avatar-role]').length===3,undefined,{timeout:7000});
 await p.click('#agent-members-tab-demo-research-risk_critic');
 await p.waitForFunction(()=>!!document.querySelector('#agent-frame').contentDocument.querySelector('#agent-members-panel-demo-research-risk_critic .native-agent-identity img[data-avatar-role="risk"]'),undefined,{timeout:5000});
 await scroll('#workspace');await shot('avatars-native-conversation');
});
await check('Native role library uses PNG portraits',async()=>{
 await p.click('a[aria-label="智能体"]');await p.waitForFunction(()=>document.querySelector('#agent-frame').contentDocument.querySelectorAll('.agent-library-list img[data-avatar-role]').length===3,undefined,{timeout:5000});
 assert.equal(await p.evaluate(()=>document.querySelector('#agent-frame').contentDocument.querySelectorAll('.agent-library-list svg').length),0);await scroll('#workspace');await shot('avatars-native-library');
});
await check('320px themes and English layout',async()=>{
 await p.cdp('Emulation.setDeviceMetricsOverride',{width:320,height:844,deviceScaleFactor:1,mobile:true});
 for(const mode of ['dark','light']){await theme(mode);await scroll('#mission-console');assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await shot('avatars-mobile-'+mode);}
 await p.click('#language');assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await p.evaluate(()=>scrollTo(0,0));await shot('copy-mobile-en');await p.click('#language');
});
await p.cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await p.reload();await p.waitForSelector('html[data-ready="true"]');
const after=await p.evaluate(()=>({language:document.documentElement.lang,nonWhitespaceChars:document.body.innerText.replace(/\s/g,'').length,text:document.body.innerText}));
const before=JSON.parse(await fs.readFile(base+'/copy-before-stop-slop.json','utf8'));
await check('Shorter Chinese default copy; execution boundaries retained',async()=>{
 assert.equal(after.language,'zh-CN');assert(after.nonWhitespaceChars<before.nonWhitespaceChars*.8);
 assert(await p.evaluate(()=>window.NeryaCapabilities.markets.prediction.support[1].includes('未启用实盘下单')));
 assert(await p.evaluate(()=>window.NeryaCapabilities.markets.equities.support[1].includes('券商网关')));
});
await theme('dark');await p.evaluate(()=>scrollTo(0,0));await shot('copy-hero-dark');await theme('light');await shot('copy-hero-light');
await fs.writeFile(base+'/avatar-copy-checks.json',JSON.stringify({checkedAt:new Date().toISOString(),checks,passed:checks.length,beforeChars:before.nonWhitespaceChars,afterChars:after.nonWhitespaceChars,reductionPercent:Number(((before.nonWhitespaceChars-after.nonWhitespaceChars)/before.nonWhitespaceChars*100).toFixed(1)),viewports:[1440,320],themes:['light','dark'],languages:['zh','en']},null,2)+'\n');
console.log({passed:checks.length,before:before.nonWhitespaceChars,after:after.nonWhitespaceChars});
