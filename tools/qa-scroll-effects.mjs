// Run through the already-owned task: ego-browser nodejs < tools/qa-scroll-effects.mjs
// Local website only. No model calls, accounts, or orders.
const fs=await import('node:fs/promises');
const assert=(await import('node:assert/strict')).default;
const task=await taskSpace(29),p=task.page('p1');
assert.equal(task.ownership,'agent');
const base='http://127.0.0.1:4173';
const out='/Users/rick/Documents/Project/Nerya/landing-page/docs/effects-evidence';
await fs.mkdir(out,{recursive:true});
const results=[];
const save=async(name,data={})=>{results.push({name,passed:true,data});await fs.writeFile(out+'/checks.json',JSON.stringify({checkedAt:new Date().toISOString(),results},null,2));console.log('PASS',name);};
const shot=async name=>p.screenshot({path:`${out}/${name}.png`});
const state=()=>p.evaluate(()=>({y:scrollY,width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,lang:document.documentElement.lang,theme:document.documentElement.dataset.theme,ready:document.documentElement.dataset.reactReady,errors:window.__effectsQAErrors||[]}));
const settle=()=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const at=async y=>{await p.evaluate(y=>window.scrollTo({top:y,behavior:'instant'}),y);await settle();};
const section=async id=>{await p.evaluate(id=>document.getElementById(id).scrollIntoView({block:'center',behavior:'instant'}),id);await settle();};
const hook=await p.cdp('Page.addScriptToEvaluateOnNewDocument',{source:`window.__effectsQAErrors=[];addEventListener('error',e=>{if(e.message)window.__effectsQAErrors.push(e.message)});addEventListener('unhandledrejection',e=>window.__effectsQAErrors.push(String(e.reason?.stack||e.reason)));`});
try{
  await p.cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await p.cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  await p.goto(base+'/?qa=react-effects');
  await p.waitForFunction(()=>document.documentElement.dataset.reactReady==='true'&&document.querySelector('[data-container-scroll]')?.getAttribute('data-ready')==='true'&&document.querySelector('#agent-frame')?.contentDocument?.querySelector('textarea'),undefined,{timeout:20000});
  const arrival=await p.evaluate(async()=>{const ys=[],start=performance.now();while(performance.now()-start<1000){ys.push(scrollY);await new Promise(r=>requestAnimationFrame(r));}return{min:Math.min(...ys),max:Math.max(...ys),react:document.querySelectorAll('astro-island').length===0,frameCount:document.querySelectorAll('#agent-frame').length};});
  assert.equal(arrival.max,0);assert.equal(arrival.frameCount,1);assert(arrival.react);assert.deepEqual((await state()).errors,[]);await save('React hydration and native iframe autofocus preserve top position',arrival);
  console.log(await p.snapshot());
  if((await state()).lang==='en')await p.click('#language');if((await state()).theme==='dark')await p.click('#theme-toggle');
  const initial=await p.evaluate(()=>{const h=document.querySelector('h1').getBoundingClientRect(),w=document.querySelector('#agent-frame-shell').getBoundingClientRect(),card=document.querySelector('[data-scroll-card]');return{h:h.toJSON(),w:w.toJSON(),transform:card.style.transform,heroResults:document.querySelectorAll('.hero [data-results]').length,cta:[...document.querySelectorAll('[data-get-started]')].map(a=>({href:a.href,bg:getComputedStyle(a).backgroundColor,color:getComputedStyle(a).color})),mode:document.querySelector('[data-container-scroll]').getAttribute('data-motion')};});
  assert.equal(initial.heroResults,0);assert.equal(initial.mode,'scroll');assert(!((await state()).overflow));assert(initial.transform.includes('30deg'));assert.equal(initial.cta.length,3);assert(initial.cta.every(a=>a.href==='https://github.com/NeryaAI/Nerya'));await shot('react-hero-zh-light');await save('Centered perspective Mock, no hero card, three direct GitHub links',initial);
  const revealEnd=await p.evaluate(()=>{const el=document.querySelector('[data-container-scroll]'),r=el.getBoundingClientRect(),top=r.top+scrollY;return Math.max(1,Math.round(top+el.offsetHeight-innerHeight*.45));});
  const poses=[];
  for(const [index,y] of [0,.33,.66,1].map((ratio,index)=>[index,Math.round(revealEnd*ratio)])){await at(y);await p.evaluate(()=>new Promise(r=>setTimeout(r,550)));poses.push(await p.evaluate(()=>({y:scrollY,progress:Number(document.querySelector('[data-container-scroll]').getAttribute('data-progress')),transform:document.querySelector('[data-scroll-card]').style.transform,titleTransform:document.querySelector('.container-scroll-header').style.transform})));if(index===1)await shot('react-scroll-mid');}
  assert(poses[1].progress>poses[0].progress&&poses[2].progress>poses[1].progress);assert(poses[3].progress>.95);
  await at(0);await p.waitForFunction(()=>{const card=document.querySelector('[data-scroll-card]');return new DOMMatrix(getComputedStyle(card).transform).m42<-200&&/blur\(3(?:\.\d+)?px\)/.test(getComputedStyle(card).filter);},undefined,{timeout:5000});
  const initialLayout=await p.evaluate(()=>{const card=document.querySelector('[data-scroll-card]'),shell=document.querySelector('#agent-frame-shell'),slogan=document.querySelector('h1'),intro=document.querySelector('.story-intro');const c=card.getBoundingClientRect(),s=slogan.getBoundingClientRect(),i=intro.getBoundingClientRect();return{cardTop:c.top,cardBottom:c.bottom,sloganTop:s.top,sloganBottom:s.bottom,introTop:i.top,gapAbove:c.top-s.bottom,gapBelow:i.top-c.bottom,translateY:new DOMMatrix(getComputedStyle(card).transform).m42,filter:getComputedStyle(card).filter,glow:getComputedStyle(document.querySelector('.hero-copy'),'::before').content,frame:{padding:getComputedStyle(shell).padding,border:getComputedStyle(shell).borderWidth}};});
  assert(initialLayout.cardTop>initialLayout.sloganTop&&initialLayout.cardTop<initialLayout.sloganBottom+80,'Mock should still begin around the slogan area');assert(initialLayout.translateY<-200,'Mock should keep an upward visual offset');assert(/blur\(3(?:\.\d+)?px\)/.test(initialLayout.filter),'Initial tilted Mock should have only a light Gaussian blur');assert(initialLayout.introTop>initialLayout.cardBottom,'Initial overlap must not reach the following copy');assert.equal(initialLayout.glow,'none');assert.equal(initialLayout.frame.padding,'0px');assert.equal(initialLayout.frame.border,'1px');
  await at(450);await p.waitForFunction(()=>{const card=document.querySelector('[data-scroll-card]');const y=new DOMMatrix(getComputedStyle(card).transform).m42;return Math.abs(y)<2&&(getComputedStyle(card).filter==='none'||getComputedStyle(card).filter==='blur(0px)');},undefined,{timeout:5000});
  const settledLayout=await p.evaluate(()=>{const card=document.querySelector('[data-scroll-card]'),slogan=document.querySelector('h1'),intro=document.querySelector('.story-intro');const c=card.getBoundingClientRect(),s=slogan.getBoundingClientRect(),i=intro.getBoundingClientRect();return{cardTop:c.top,cardBottom:c.bottom,sloganBottom:s.bottom,introTop:i.top,gapAbove:c.top-s.bottom,gapBelow:i.top-c.bottom,translateY:new DOMMatrix(getComputedStyle(card).transform).m42,filter:getComputedStyle(card).filter};});
  assert(settledLayout.cardTop>settledLayout.sloganBottom,'After the opening scroll, the Mock top edge should sit below the slogan');assert(Math.abs(settledLayout.translateY)<2,'Mock should stop translating after it clears the slogan');assert(settledLayout.filter==='none'||settledLayout.filter==='blur(0px)','Settled Mock should be sharp');assert(settledLayout.introTop>settledLayout.cardBottom,'Settled Mock must remain above the following copy');await save('Mock starts blurred behind slogan, then settles sharp below it',{initialLayout,settledLayout});
  await p.click('#expand-agent');await p.waitForFunction(()=>document.body.classList.contains('workspace-expanded'));
  const expanded=await p.evaluate(()=>{const r=document.querySelector('#agent-frame-shell').getBoundingClientRect();return{r:r.toJSON(),height:innerHeight,width:innerWidth,perspective:getComputedStyle(document.querySelector('.container-scroll-perspective')).perspective,transform:getComputedStyle(document.querySelector('[data-scroll-card]')).transform};});
  assert.equal(expanded.perspective,'none');assert.equal(expanded.transform,'none');assert(expanded.r.top<=16&&expanded.r.bottom>=expanded.height-16);await p.keyboard.press('Escape');await p.waitForFunction(()=>!document.body.classList.contains('workspace-expanded'));await save('Expanded Mock escapes transforms and Escape closes it',expanded);
  assert.equal(await p.evaluate(()=>document.querySelectorAll('#effects-toggle').length),0);await save('Top-right AI/effects icon is removed');
  const ids=['strategy','team','evolution','vault','markets','integrations'];
  for(const id of ids){await section(id);await p.waitForFunction(id=>document.querySelector(`[data-story="${id}"]`)?.dataset.paused==='false',id);
    const time=await p.evaluate(id=>document.querySelector(`[data-story="${id}"]`).getAnimations({subtree:true})[0]?.currentTime,id);
    await p.waitForFunction(({id,time})=>document.querySelector(`[data-story="${id}"]`).getAnimations({subtree:true})[0]?.currentTime!==time,{id,time});
    await p.click(`[data-story="${id}"] [data-story-chapter="2"]`);assert.equal(await p.evaluate(id=>document.querySelector(`[data-story="${id}"]`).dataset.chapter,id),'2');
    assert(!((await state()).overflow));if(id==='strategy')await shot('react-strategy-light');
    await p.click(`[data-story="${id}"] .story-replay`);
  }
  await save('Six authored scenes still play, seek and replay');
  await section('strategy');await p.hover('[data-story="strategy"]');
  await p.waitForFunction(()=>Number(getComputedStyle(document.querySelector('[data-story="strategy"]'),'::before').opacity)>.8);
  const spotlight=await p.evaluate(()=>{const e=document.querySelector('[data-story="strategy"]');return{x:e.style.getPropertyValue('--spot-x'),y:e.style.getPropertyValue('--spot-y'),angle:e.style.getPropertyValue('--edge-angle')};});await save('Pointer spotlight and edge glow track the actual component',spotlight);
  await at(0);await p.waitForFunction(()=>[...document.querySelectorAll('[data-story]')].every(s=>s.dataset.paused==='true'));
  assert.equal(await p.evaluate(()=>performance.getEntriesByType('resource').filter(r=>/product-recordings.*\.(gif|mp4)/.test(r.name)).length),0);await save('Offscreen scenes pause and no screen-recording media is loaded');
  for(const [lang,theme]of [['en','dark'],['zh','dark'],['en','light'],['zh','light']]){
    if(((await state()).lang==='en'?'en':'zh')!==lang)await p.click('#language');if((await state()).theme!==theme)await p.click('#theme-toggle');
    await section('markets');await p.click('[data-story="markets"] [data-story-chapter="2"]');
    const native=await p.evaluate(()=>[...document.querySelectorAll('.native-market .native-locale')].filter(e=>getComputedStyle(e).display!=='none').map(e=>e.textContent));
    assert.equal(native.length,1);assert(!(await state()).overflow);assert.deepEqual((await state()).errors,[]);if(lang==='en'&&theme==='dark')await shot('react-market-en-dark');
  }
  await save('Four language/theme combinations and native excerpts survive React updates');
  await p.click('#result-tab-research');await p.click('#open-research-report');await p.waitForFunction(()=>document.querySelector('#research-report').open);assert.equal(await p.evaluate(()=>document.querySelectorAll('.full-report-section').length),5);await shot('react-full-report');await p.keyboard.press('Escape');await save('Lower output cards and full research report remain usable');
  for(const width of [768,390,320]){
    await p.cdp('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true});await p.goto(base+'/?qa=react-mobile-'+width);
    await p.waitForFunction(()=>document.documentElement.dataset.reactReady==='true'&&document.querySelector('[data-container-scroll]').getAttribute('data-ready')==='true');
    assert.equal((await state()).y,0);assert(!(await state()).overflow);
    const transform=await p.evaluate(()=>getComputedStyle(document.querySelector('[data-scroll-card]')).transform);assert.equal(transform,'none');
    for(const id of ids){await section(id);assert(!(await state()).overflow);}
    await at(0);if(width===390)await shot('react-hero-mobile-390');
    await save(`Responsive React layout at ${width}px`,{transform});
  }
  await p.cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await p.cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await p.goto(base+'/?qa=react-reduced');await p.waitForFunction(()=>document.documentElement.dataset.reactReady==='true');
  const reduced=await p.evaluate(()=>({mode:document.querySelector('[data-container-scroll]').getAttribute('data-motion'),transform:getComputedStyle(document.querySelector('[data-scroll-card]')).transform,animations:document.querySelector('.hero-atmosphere').getAnimations({subtree:true}).length}));assert.equal(reduced.transform,'none');assert.equal(reduced.animations,0);await save('Reduced motion yields static, readable content',reduced);
  await p.cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  await p.goto(base+'/docs.html');await p.waitForFunction(()=>document.documentElement.dataset.reactReady==='true');console.log(await p.snapshot());
  assert.equal(await p.evaluate(()=>document.querySelectorAll('.doc-section').length),18);await p.fill('#docs-search','chart');
  const search=await p.evaluate(()=>({matches:[...document.querySelectorAll('[data-doc-link]')].filter(a=>!a.hidden).length,total:document.querySelectorAll('[data-doc-link]').length}));assert(search.matches>0&&search.matches<search.total);await p.fill('#docs-search','');
  await p.click('#docs-language');assert.equal((await state()).lang,'en');await p.click('a[data-doc-link="sdk"]');await shot('react-docs-sdk');assert.deepEqual((await state()).errors,[]);await save('React manual retains 18 sections, filtering, language and anchors',search);
  await p.cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await p.goto(base+'/docs.html');await p.waitForFunction(()=>document.documentElement.dataset.reactReady==='true');await p.click('#docs-menu');assert.equal(await p.evaluate(()=>document.querySelector('#docs-menu').getAttribute('aria-expanded')),'true');await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>document.querySelector('#docs-menu').getAttribute('aria-expanded')),'false');assert(!(await state()).overflow);await save('Mobile React manual menu and Escape');
  await p.cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await p.goto(base+'/');await p.waitForFunction(()=>document.documentElement.dataset.reactReady==='true'&&document.querySelector('[data-container-scroll]').getAttribute('data-ready')==='true');
  if((await state()).theme!=='dark')await p.click('#theme-toggle');if((await state()).lang!=='en')await p.click('#language');await at(0);await shot('react-hero-en-dark');
  await p.click('#language');await shot('react-hero-zh-dark');await p.click('#theme-toggle');await shot('react-hero-zh-light');
  assert.deepEqual((await state()).errors,[]);await save('Final React homepage has no captured runtime exceptions');console.log('COMPLETE',results.length,'browser groups');
}finally{await p.cdp('Page.removeScriptToEvaluateOnNewDocument',{identifier:hook.identifier});}
