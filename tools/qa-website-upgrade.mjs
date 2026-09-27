// Execute with: ego-browser nodejs < tools/qa-website-upgrade.mjs
// One task-owned browser; tests only the isolated, local website.
const fs = await import('node:fs/promises');
const assert = (await import('node:assert/strict')).default;
const task = await taskSpace(27), page = task.page('p1');
assert.equal(task.ownership, 'agent');
const base = 'http://127.0.0.1:4173';
const out = '/Users/rick/Documents/Project/Nerya/landing-page/docs/website-upgrade-evidence';
await fs.mkdir(out, {recursive:true});
const results = [], screenshots = [];
function pass(name, evidence) { results.push({name, status:'passed', evidence}); console.log('PASS', name); }
async function shot(name) { await page.screenshot({path:`${out}/${name}.png`}); screenshots.push(name+'.png'); }
async function state() { return page.evaluate(() => ({lang:document.documentElement.lang,theme:document.documentElement.dataset.theme,y:scrollY,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,errors:window.__websiteQAErrors||[]})); }
async function settleHero() {
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.result-showcase')).opacity === '1' && getComputedStyle(document.querySelector('.hero-actions')).opacity === '1', undefined, {timeout:6000});
}
// Error logging is observational, installed before navigation in each document.
const errorHook = await page.cdp('Page.addScriptToEvaluateOnNewDocument', {source:`window.__websiteQAErrors=[];addEventListener('error',e=>{if(e.message)window.__websiteQAErrors.push(e.message)});addEventListener('unhandledrejection',e=>window.__websiteQAErrors.push(String(e.reason?.stack||e.reason)));`});
try {
  await page.cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  await page.cdp('Emulation.setDeviceMetricsOverride', {width:1440,height:950,deviceScaleFactor:1,mobile:false});
  await page.goto(base+'/?qa=upgrade-desktop');
  await page.waitForFunction(() => !!document.querySelector('#agent-frame')?.contentDocument?.querySelector('textarea'), undefined, {timeout:20000});
  // Deliberately observe an interval after the iframe's delayed native focus.
  const arrival = await page.evaluate(async () => {
    const ys=[],start=performance.now();
    while(performance.now()-start<1400){ys.push(scrollY);await new Promise(r=>requestAnimationFrame(r));}
    return {min:Math.min(...ys),max:Math.max(...ys),focus:document.activeElement?.tagName,innerFocus:document.querySelector('#agent-frame')?.contentDocument?.activeElement?.tagName};
  });
  assert.equal(arrival.max,0); pass('Desktop entry stays at top after native iframe autofocus',arrival);
  await settleHero();
  console.log(await page.snapshot());
  if((await state()).lang==='en')await page.click('#language');
  if((await state()).theme==='dark')await page.click('#theme-toggle');
  await page.click('#result-tab-strategy'); await shot('homepage-zh-light-strategy');
  let s=await state();assert(s.scrollWidth<=s.width);assert.deepEqual(s.errors,[]);pass('Desktop layout and JavaScript',s);
  for(const kind of ['backtest','market','research','strategy']){
    await page.click('#result-tab-'+kind);
    const panels=await page.evaluate(()=>[...document.querySelectorAll('[data-result-panel]')].filter(p=>!p.hidden).map(p=>p.dataset.resultPanel));
    assert.deepEqual(panels,[kind]);pass('Result tab '+kind,panels);
  }
  await page.press('#result-tab-strategy','ArrowRight');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'result-tab-backtest');
  await page.press('#result-tab-backtest','End');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'result-tab-research');
  pass('Result tabs keyboard arrows and End');
  await page.click('#open-research-report');
  await page.waitForFunction(()=>document.querySelector('#research-report').open);
  const report=await page.evaluate(()=>({open:document.querySelector('#research-report').open,sections:document.querySelectorAll('.full-report-section').length,text:document.querySelector('#research-report').innerText.length}));
  assert.equal(report.sections,5);assert(report.text>400);pass('Detailed research report opens with five sections',report);
  await shot('research-report-zh-light');
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(()=>document.querySelector('#research-report').open),false);
  assert.equal(await page.evaluate(()=>document.activeElement.id),'open-research-report');pass('Report Escape and return focus');

  // Follow an observed navigation link, then inspect the media controls.
  await page.click('header nav a[href="#strategy"]');
  await page.waitForFunction(()=>document.querySelector('#strategy video').currentTime>.12,undefined,{timeout:15000});
  console.log(await page.snapshot());
  for(const [lang,theme] of [['zh','light'],['zh','dark'],['en','dark'],['en','light']]){
    s=await state();if((s.lang==='en'?'en':'zh')!==lang)await page.click('#language');
    if((await state()).theme!==theme)await page.click('#theme-toggle');
    const variant=`${lang}-${theme}`;
    await page.waitForFunction(v=>[...document.querySelectorAll('.product-film')].every(f=>f.dataset.variant===v),variant);
    await page.waitForFunction(v=>{const video=document.querySelector('#strategy video');return video.currentSrc.includes(`strategy-${v}.mp4`)&&video.currentTime>.12;},variant,{timeout:15000});
    const films=await page.evaluate(()=>[...document.querySelectorAll('.product-film')].map(f=>({id:f.dataset.film,variant:f.dataset.variant,poster:f.querySelector('video').poster,video:f.querySelector('video').dataset.src,gif:f.querySelector('.film-gif').dataset.src})));
    assert.equal(films.length,6);for(const film of films){for(const key of ['poster','video','gif'])assert(film[key].includes(`${film.id}-${variant}`));}
    pass('Six matching video/GIF/poster variants: '+variant,films);
    await page.click('#strategy .film-format');
    await page.waitForFunction(v=>{const f=document.querySelector('#strategy .product-film'),img=f.querySelector('.film-gif');return f.dataset.mode==='gif'&&img.src.includes(`strategy-${v}.gif`)&&img.complete&&img.naturalWidth===1280;},variant,{timeout:15000});
    await page.click('#strategy .film-toggle');
    await page.waitForFunction(()=>document.querySelector('#strategy .film-gif').src.includes('-poster.webp'));
    pass('GIF playback and poster pause: '+variant);
    await page.click('#strategy .film-toggle');
    await page.click('#strategy .film-format');
  }
  await page.click('#strategy .film-cue[data-cue="2"]');
  const seek = await page.evaluate(()=>{const v=document.querySelector('#strategy video');return {time:v.currentTime,duration:v.duration,paused:v.paused};});
  assert(seek.time>seek.duration*.6);assert(seek.paused);pass('Video chapter seeking',seek);
  await page.click('#strategy .film-replay');
  await page.waitForFunction(()=>{const v=document.querySelector('#strategy video');return !v.paused&&v.currentTime<2;});pass('Replay resets and plays');
  await page.click('#motion-toggle');
  assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('motion-paused')),true);
  assert.equal(await page.evaluate(()=>[...document.querySelectorAll('.film-video')].every(v=>v.paused)),true);pass('Global motion pause');
  await page.click('#motion-toggle');

  // Return by an intentional home link, capture English/dark market results.
  await page.click('header .brand');
  await page.waitForFunction(()=>scrollY===0);
  if((await state()).theme!=='dark')await page.click('#theme-toggle');
  await page.click('#result-tab-backtest');await shot('homepage-en-dark-backtest');
  await page.click('#result-tab-market');await shot('homepage-en-dark-market');
  await page.mouse.move(270,400,{label:'检查手动页面滚动'});
  await page.mouse.wheel(0,420,{label:'主动向下浏览官网'});
  await page.waitForFunction(()=>scrollY>150);
  const manual=await page.evaluate(async()=>{const first=scrollY;await new Promise(r=>setTimeout(r,600));return {first,after:scrollY};});
  assert(manual.after>150);pass('Manual scrolling remains enabled',manual);

  await page.cdp('Emulation.setDeviceMetricsOverride', {width:390,height:844,deviceScaleFactor:1,mobile:true});
  await page.goto(base+'/?qa=upgrade-mobile');
  await page.waitForFunction(()=>!!document.querySelector('#agent-frame')?.contentDocument?.querySelector('textarea'),undefined,{timeout:15000});
  await settleHero();
  s=await state();assert.equal(s.y,0);assert(s.scrollWidth<=s.width);pass('Mobile entry and no horizontal overflow',s);
  if(s.lang==='en')await page.click('#language');
  await shot('homepage-zh-dark-mobile');
  await page.click('#menu-toggle');assert.equal(await page.evaluate(()=>document.querySelector('#menu-toggle').getAttribute('aria-expanded')),'true');
  await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.querySelector('#menu-toggle').getAttribute('aria-expanded')),'false');pass('Mobile navigation opens and closes');
  await page.click('#result-tab-research');await page.click('#open-research-report');
  const mobileReport=await page.evaluate(()=>{const r=document.querySelector('#research-report').getBoundingClientRect();return {left:r.left,right:r.right,width:innerWidth,open:document.querySelector('#research-report').open};});
  assert(mobileReport.open&&mobileReport.left>=0&&mobileReport.right<=mobileReport.width);pass('Mobile report remains inside viewport',mobileReport);await page.keyboard.press('Escape');

  await page.cdp('Emulation.setDeviceMetricsOverride', {width:1440,height:950,deviceScaleFactor:1,mobile:false});
  await page.goto(base+'/docs.html');
  await page.waitForSelector('#docs-search');
  console.log(await page.snapshot());
  let docs=await page.evaluate(()=>({sections:document.querySelectorAll('.doc-section').length,missing:[...document.querySelectorAll('[data-doc-link]')].filter(a=>!document.getElementById(a.dataset.docLink)).length,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,errors:window.__websiteQAErrors}));
  assert.equal(docs.sections,18);assert.equal(docs.missing,0);assert(docs.scrollWidth<=docs.width);assert.deepEqual(docs.errors,[]);pass('18 documentation sections and valid navigation',docs);
  await shot('docs-zh-dark');
  await page.click('#docs-language');
  assert.equal((await state()).lang,'en');
  assert((await page.evaluate(()=>document.querySelector('#sdk').innerText)).includes('Choose your SDK'));pass('Documentation language switching');
  await page.fill('#docs-search','publish_and_announce');
  let matches=await page.evaluate(()=>[...document.querySelectorAll('[data-doc-link]')].filter(a=>!a.hidden).map(a=>a.dataset.docLink));
  assert(matches.includes('sdk')&&matches.includes('artifacts'));pass('Documentation content search',matches);
  await page.fill('#docs-search','zzzz_no_such_topic_739');
  assert.equal(await page.evaluate(()=>[...document.querySelectorAll('[data-doc-link]')].filter(a=>!a.hidden).length),0);pass('Documentation no-match state');
  await page.fill('#docs-search','');
  await page.click('[data-doc-link="sdk"]');
  await page.waitForFunction(()=>location.hash==='#sdk');
  await page.click('#theme-toggle');await shot('docs-en-light-sdk');
  assert.equal((await state()).theme,'light');pass('Documentation theme switching and SDK anchor');
  const sourceSafety=await page.evaluate(()=>({invalidStart:/^nerya service start$/m.test(document.querySelector('#quickstart').innerText),hasEpoch:document.querySelector('#events').innerText.includes('reset_required'),cards:document.querySelector('#artifacts').innerText.includes('publish_and_announce')}));
  assert.equal(sourceSafety.invalidStart,false);assert(sourceSafety.hasEpoch&&sourceSafety.cards);pass('Current CLI, event reset and chart contracts',sourceSafety);
  await page.cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await page.goto(base+'/docs.html?qa=mobile');
  await page.click('#docs-menu');await page.fill('#docs-search','SDK');
  await page.click('[data-doc-link="sdk"]');
  assert.equal(await page.evaluate(()=>document.querySelector('#docs-menu').getAttribute('aria-expanded')),'false');
  s=await state();assert(s.scrollWidth<=s.width);pass('Mobile docs search, navigation and table containment',s);
  await shot('docs-en-light-mobile');

  await page.cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await page.cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:950,deviceScaleFactor:1,mobile:false});
  await page.goto(base+'/?qa=reduced');
  await page.waitForFunction(()=>window.NeryaLanding&&document.querySelector('#agent-frame')?.contentDocument?.querySelector('textarea'));
  const reduced=await page.evaluate(()=>({motion:document.documentElement.classList.contains('motion-paused'),opacity:getComputedStyle(document.querySelector('.result-showcase')).opacity,animations:document.querySelector('.result-showcase').getAnimations().length,scrollY,videos:[...document.querySelectorAll('video')].every(v=>v.paused)}));
  assert(reduced.motion&&reduced.opacity==='1'&&reduced.animations===0&&reduced.videos&&reduced.scrollY===0);pass('Reduced-motion entry is visible, paused and stays at top',reduced);
  assert.deepEqual((await state()).errors,[]);pass('No observed uncaught page errors at completion');
} catch(error) {
  await fs.writeFile(out+'/browser-qa.json',JSON.stringify({status:'failed',results,screenshots,error:String(error.stack||error)},null,2));
  console.log(await page.snapshot());throw error;
} finally {
  await page.cdp('Page.removeScriptToEvaluateOnNewDocument',{identifier:errorHook.identifier});
  await page.cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
}
await fs.writeFile(out+'/browser-qa.json',JSON.stringify({status:'passed',results,screenshots,checkedAt:new Date().toISOString()},null,2));
console.log('COMPLETE',results.length,'browser checks',screenshots.length,'screenshots');
// Leave this TaskSpace under agent control for review/fixes; the lead finishes it.
