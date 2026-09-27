// Run inside the already-owned Ego task space: import this module, then call
// its default export with the documented Ego Page and an absolute output path.
// Tests only the local public demo. No real runtime, models or orders are used.
export default async function verifyIcons(page, output, base = 'http://127.0.0.1:4186') {
  const fs = await import('node:fs/promises');
  const assert = (value, message) => { if (!value) throw new Error(message); };
  const results = [];
  await fs.mkdir(output, {recursive:true});
  const metrics = async (width=1440,height=1000) => page.cdp('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<768});
  await metrics();
  await page.cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  async function audit(name, minimum=1) {
    await page.waitForFunction(n=>document.querySelectorAll('[data-nerya-icon]').length>=n,minimum,{timeout:10000});
    const state = await page.evaluate(()=>{
      const icons=[...document.querySelectorAll('svg[data-nerya-icon]')];
      return {url:location.href,lang:document.documentElement.lang,theme:document.documentElement.dataset.theme||document.documentElement.className,
        icons:icons.length,visible:icons.filter(el=>el.getBoundingClientRect().width>0&&el.getBoundingClientRect().height>0).length,
        bad:icons.filter(el=>!el.querySelector('path')?.getAttribute('d')||el.getAttribute('viewBox')!=='0 0 24 24'||el.getAttribute('stroke-linecap')!=='round'||el.getAttribute('stroke-linejoin')!=='round'||el.getAttribute('aria-hidden')!=='true').map(el=>el.dataset.neryaIcon),
        overflow:document.documentElement.scrollWidth>innerWidth+1,errors:window.__demoErrors||[]};
    });
    results.push({name,...state});
    assert(state.visible>0&&state.bad.length===0,`${name}: invalid icon geometry / accessibility`);
    assert(state.errors.length===0,`${name}: React runtime errors`);
    assert(!state.overflow,`${name}: horizontal page overflow`);
    await page.screenshot({path:`${output}/${name}.png`});
    return state;
  }
  try {
    await page.goto(base+'/');
    await page.waitForFunction(()=>document.querySelector('iframe')?.contentDocument?.querySelectorAll('[data-nerya-icon]').length>5,undefined,{timeout:10000});
    await page.evaluate(()=>window.NeryaTheme.set('light'));
    await audit('01-website-light',20);
    await page.click('#theme-toggle');
    assert(await page.evaluate(()=>document.documentElement.dataset.theme==='dark'&&document.querySelector('#theme-toggle svg').dataset.neryaIcon==='sun'),'Theme icon did not update');
    await audit('02-website-dark',20);
    await page.click('#language');
    await audit('03-website-language',20);
    for(const [name,route] of [['04-agent-home','/'],['05-agent-research','/chat/demo-research'],['06-agent-strategies','/strategies']]) {
      await page.goto(base+'/demo/index.html?lang=zh#'+route);
      await audit(name,10);
    }
    for(const name of ['docs','skills','recipes']) {
      await page.goto(base+'/'+name+'.html');
      await audit('07-'+name,2);
    }
    await metrics(390,844);
    await page.goto(base+'/');
    await audit('08-mobile-website',20);
    await page.click('#menu-toggle');
    await page.waitForFunction(()=>document.querySelector('#menu-toggle svg')?.dataset.neryaIcon==='x',undefined,{timeout:3000});
    await audit('09-mobile-menu',20);
    await page.click('#menu-toggle');
    await page.waitForFunction(()=>document.querySelector('#menu-toggle svg')?.dataset.neryaIcon==='menu',undefined,{timeout:3000});
    await metrics(320,800);
    await audit('10-mobile-320',20);
    await metrics(390,844);
    await page.goto(base+'/demo/index.html?lang=zh#/');
    await audit('11-mobile-agent',5);
    await fs.writeFile(`${output}/browser-checks.json`,JSON.stringify({status:'passed',count:results.length,results},null,2));
    return {status:'passed',count:results.length,output};
  } catch(error) {
    await fs.writeFile(`${output}/browser-checks.json`,JSON.stringify({status:'failed',error:String(error),results},null,2));
    throw error;
  }
}
