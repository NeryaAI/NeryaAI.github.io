// Run in the existing task: ego-browser nodejs < tools/qa-workspace-reveal.mjs
const fs=await import('node:fs/promises'),assert=(await import('node:assert/strict')).default;
const p=(await taskSpace(20)).page('p2');
const dir='/Users/rick/Documents/Project/Nerya/landing-page/docs/native-evidence-20260926';
await fs.mkdir(dir,{recursive:true});
await p.cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
await p.goto('http://127.0.0.1:4173/?qa=workspace-reveal');
await p.waitForFunction(()=>window.NeryaLanding&&document.querySelector('#agent-frame').contentDocument?.activeElement?.tagName==='TEXTAREA');
await p.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
const settle=()=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const state=()=>p.evaluate(()=>({scrollY,phase:document.querySelector('[data-workspace-reveal]').dataset.revealState,tilt:parseFloat(document.querySelector('#agent-frame-shell').style.getPropertyValue('--workspace-tilt')),transform:getComputedStyle(document.querySelector('#agent-frame-shell')).transform,overflow:document.documentElement.scrollWidth>innerWidth}));
await settle();const initial=await state();assert.equal(initial.phase,'scroll');assert.equal(initial.tilt,16);assert.equal(initial.overflow,false);
await p.screenshot({path:`${dir}/workspace-initial-tilt.png`});
await p.evaluate(()=>window.scrollTo({top:250,behavior:'instant'}));await settle();const middle=await state();assert(middle.tilt>0&&middle.tilt<initial.tilt);
await p.screenshot({path:`${dir}/workspace-mid-scroll.png`});
await p.evaluate(()=>document.querySelector('#workspace').scrollIntoView({block:'start',behavior:'instant'}));await settle();const upright=await state();assert.equal(upright.tilt,0);
await p.screenshot({path:`${dir}/workspace-upright.png`});
await p.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await settle();assert.equal((await state()).tilt,16);
console.log(await p.snapshot());
// Ego's structured iframe locator uses an untransformed frame offset and hit
// Strategies instead of Agents under perspective. This point was inspected in
// the 1440px screenshot; use a real pointer hit for the tilted first-click test.
await p.mouse.click(169,885,{label:'打开倾斜工作台中的智能体'});
await settle();
await p.waitForFunction(()=>document.querySelector('#agent-frame').contentWindow.location.hash.split('?')[0]==='#/agents');
await p.waitForFunction(()=>document.querySelector('[data-workspace-reveal]').dataset.revealState==='settled');
await p.waitForFunction(()=>[...document.querySelector('#agent-frame').contentDocument.querySelectorAll('img[data-avatar-role]')].some(i=>i.complete&&i.naturalWidth===256));
const interaction=await p.evaluate(()=>({phase:document.querySelector('[data-workspace-reveal]').dataset.revealState,transform:getComputedStyle(document.querySelector('#agent-frame-shell')).transform,hash:document.querySelector('#agent-frame').contentWindow.location.hash,avatars:[...document.querySelector('#agent-frame').contentDocument.querySelectorAll('img[data-avatar-role]')].map(i=>({role:i.dataset.avatarRole,width:i.naturalWidth})),errors:document.querySelector('#agent-frame').contentWindow.__demoErrors||[]}));
assert.equal(interaction.transform,'none');assert.deepEqual(interaction.errors,[]);
await p.screenshot({path:`${dir}/native-agent-avatars.png`});
await fs.writeFile(`${dir}/workspace-checks.json`,JSON.stringify({initial,middle,upright,interaction},null,2));
console.log({passed:true,initial,middle,upright,interaction});
