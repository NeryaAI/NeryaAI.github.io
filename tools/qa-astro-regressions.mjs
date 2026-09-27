// Run with the active, authorized Ego task space: ego-browser nodejs < tools/qa-astro-regressions.mjs
const fs=await import('node:fs/promises');
const assert=(await import('node:assert/strict')).default;
const task=await taskSpace(20),p=task.page(process.env.NERYA_BROWSER_PAGE || 'p1'),results=[];
const directory='/Users/rick/Documents/Project/Nerya/landing-page/docs/ui-refresh-evidence-20260926';
const settle=()=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
await p.cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:2600,deviceScaleFactor:1,mobile:false});
await p.goto('http://127.0.0.1:4173/');
await p.waitForFunction(()=>window.NeryaLanding&&document.querySelector('#agent-frame').contentDocument?.documentElement.dataset.demo==='real-agent');
console.log(await p.snapshot());
await p.evaluate(()=>document.querySelector('#workspace').scrollIntoView({behavior:'instant',block:'start'}));await settle();
await p.click('#expand-agent');
const expanded=await p.evaluate(()=>({role:document.querySelector('#agent-frame-shell').getAttribute('role'),modal:document.querySelector('#agent-frame-shell').getAttribute('aria-modal'),headerInert:document.querySelector('header').inert,footerInert:document.querySelector('footer').inert,storyInert:document.querySelector('.feature-stories').inert,toolbarInert:document.querySelector('.workspace-toolbar').inert}));
assert.equal(expanded.role,'dialog');assert.equal(expanded.modal,'true');assert(expanded.headerInert&&expanded.footerInert&&expanded.storyInert&&expanded.toolbarInert);
await p.press('#expand-agent','Escape');
assert(await p.evaluate(()=>!document.querySelector('header').inert&&!document.querySelector('footer').inert&&!document.querySelector('#agent-frame-shell').hasAttribute('aria-modal')&&document.activeElement.id==='expand-agent'));
results.push({name:'Expanded workspace isolates background and restores focus',passed:true,evidence:expanded});

await p.evaluate(()=>document.querySelector('#strategy').scrollIntoView({behavior:'instant',block:'start'}));await settle();
await p.waitForFunction(()=>{const v=document.querySelector('[data-film="strategy"] video');return v.readyState>=2&&!v.paused;});
await p.click('[data-film="strategy"] .film-format');
await p.waitForFunction(()=>parseFloat(document.querySelector('[data-film="strategy"] [data-cue="0"]').style.getPropertyValue('--cue-progress'))>18);
// Ego's native pointer action emits a verified 2ms hidden/visible pulse, which
// correctly restarts GIFs after hiding the document. Test unrelated handler
// synchronization in one visible page epoch; native button hits are tested in
// qa-astro.mjs. Do not change real background-pause behavior to mask this pulse.
const {before,after}=await p.evaluate(async()=>{
 const progress=()=>parseFloat(document.querySelector('[data-film="strategy"] [data-cue="0"]').style.getPropertyValue('--cue-progress'));
 const before=progress();
 document.querySelector('[data-film="team"] .film-toggle').click();
 await new Promise(r=>requestAnimationFrame(r));
 return {before,after:{progress:progress(),paused:document.querySelector('[data-film="strategy"]').dataset.paused}};
});
assert.equal(after.paused,'false');assert(after.progress>=before,`${before} -> ${after.progress}`);
results.push({name:'Unrelated film controls preserve active GIF progress',passed:true,evidence:{before,...after}});

await p.click('[data-film="strategy"] .film-format');
// Trigger the real media error handler without issuing a failing network request.
await p.evaluate(()=>document.querySelector('[data-film="strategy"] video').dispatchEvent(new Event('error')));
await p.waitForFunction(()=>{const f=document.querySelector('[data-film="strategy"]');return f.dataset.mode==='gif'&&f.querySelector('.film-gif').complete&&f.querySelector('.film-gif').currentSrc.endsWith('.gif');});
assert(await p.evaluate(()=>[...document.querySelectorAll('[data-film="strategy"] [data-cue],[data-film="strategy"] .film-format')].every(b=>b.disabled)));
await p.click('[data-film="strategy"] .film-toggle');
assert(await p.evaluate(()=>document.querySelector('[data-film="strategy"] .film-gif').src.endsWith('-poster.webp')));
await p.click('[data-film="strategy"] .film-toggle');
await p.waitForFunction(()=>document.querySelector('[data-film="strategy"] .film-gif').currentSrc.endsWith('.gif'));
results.push({name:'Media-error GIF fallback remains playable with seeking disabled',passed:true});
await fs.writeFile(`${directory}/regressions.json`,JSON.stringify({checkedAt:new Date().toISOString(),results},null,2));
await p.cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
await p.reload();await p.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await settle();
console.log({passed:results.length,results});
