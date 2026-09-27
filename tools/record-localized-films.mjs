// Run through Ego: ego-browser nodejs < tools/record-localized-films.mjs
// Actual native DOM captures in the task-owned browser. No live runtime calls.
const fs = await import('node:fs/promises');
const path = await import('node:path');
const {createHash}=await import('node:crypto');
const assert=(await import('node:assert/strict')).default;
const root='/Users/rick/Documents/Project/Nerya/landing-page';
const out=path.join(root,'assets/product-recordings');
const evidence=path.join(root,'docs/website-upgrade-evidence');
const work=path.join(root,'.tmp/localized-films');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const sleep=ms=>new Promise(r=>setTimeout(r,Math.max(0,ms)));
const task=await taskSpace(27),page=task.page('p1');
assert.equal(task.ownership,'agent');
const scenes={strategy:'/chat/demo-strategy',team:'/chat/demo-research',evolution:'/chat/demo-review',vault:'/env-vault',markets:'/strategies',integrations:'/chat'};
const selected=process.env.NERYA_FILM_VARIANTS?.split(',')||['zh-light','zh-dark','en-light','en-dark'];
await fs.mkdir(evidence,{recursive:true});await fs.mkdir(work,{recursive:true});
await page.cdp('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});
const sourceFiles=['demo/index.html','demo/app.js','demo/app.css','demo/global.css','demo/theme.js','demo/runtime.js','demo/native-fixtures.js'];
const sourceInputs=[];for(const file of sourceFiles)sourceInputs.push({file,sha256:hash(await fs.readFile(path.join(root,'dist',file)))});
const completed=[];
for(const variant of selected){
  assert(/^(zh|en)-(light|dark)$/.test(variant));
  const [lang,theme]=variant.split('-');
  for(const [name,route] of Object.entries(scenes)){
    if(process.env.NERYA_FILM_SCENES && !process.env.NERYA_FILM_SCENES.split(',').includes(name))continue;
    const stem=`${name}-${variant}`;
    // Resume only verified, byte-identical artifacts from this same source.
    try { const prior=JSON.parse(await fs.readFile(path.join(out,`${stem}.manifest.json`),'utf8'));
      if(prior.status==='verified'&&JSON.stringify(prior.sourceInputs)===JSON.stringify(sourceInputs)){
        let valid=true;for(const item of prior.outputs)if(hash(await fs.readFile(path.join(out,item.file)))!==item.sha256)valid=false;
        if(valid){completed.push(prior);console.log('REUSE',stem);continue;}
      }
    }catch{}
    assert.equal(task.ownership,'agent');
    const sourceUrl=`http://127.0.0.1:4173/demo/index.html?lang=${lang}&theme=${theme}#${route}`;
    await page.goto(sourceUrl);
    await page.waitForFunction(()=>document.documentElement.dataset.demo==='real-agent'&&document.body.innerText.length>100,undefined,{timeout:15000});
    await page.evaluate(async()=>{await document.fonts.ready;});
    const safety=await page.evaluate(()=>({csp:document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content,light:document.documentElement.classList.contains('light'),viewport:[innerWidth,innerHeight],dpr:devicePixelRatio,settings:JSON.parse(localStorage.getItem('nerya.ui_settings.v1')||'{}').language}));
    assert(safety.csp.includes("connect-src 'none'"));assert.equal(safety.light,theme==='light');assert.equal(safety.settings,lang);
    const folder=path.join(work,stem);await fs.mkdir(folder,{recursive:true});
    await fs.writeFile(path.join(folder,'before.txt'),await page.snapshot({scope:'full_page'}));
    if(name==='integrations'){
      const prompt=lang==='zh'?'接入 ExampleX 行情接口，检查已有连接器，准备适配与验证方案，订单权限保持关闭。':'Connect the ExampleX market data API. Check existing connectors and prepare an integration and validation plan. Keep order placement disabled.';
      await page.fill('textarea',prompt);
      await page.click(`button[aria-label="${lang==='zh'?'发送':'Send'}"]`);
    }
    // Obtain coordinates from an actual scrollable native container, not a guess.
    const scrollPoint=await page.evaluate(()=>{
      const candidates=[...document.querySelectorAll('main,section,div')].filter(el=>{const r=el.getBoundingClientRect();return r.width>400&&r.height>180&&r.right>innerWidth*.65&&el.scrollHeight>el.clientHeight+30&&/(auto|scroll)/.test(getComputedStyle(el).overflowY);});
      candidates.sort((a,b)=>b.getBoundingClientRect().width*b.clientHeight-a.getBoundingClientRect().width*a.clientHeight);
      const el=candidates[0];if(!el)return null;const r=el.getBoundingClientRect();return {x:r.x+r.width*.6,y:Math.min(innerHeight-120,r.y+r.height*.55),distance:el.scrollHeight-el.clientHeight};
    });
    const actions=[],frames=[];const start=performance.now();let capturing=true;
    const capture=(async()=>{
      while(capturing){
        const before=performance.now();const result=await page.cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
        const now=performance.now(),bytes=Buffer.from(result.data,'base64');const file=`frame-${String(frames.length).padStart(4,'0')}.png`;
        await fs.writeFile(path.join(folder,file),bytes);frames.push({file,time:((before+now)/2-start)/1000,sha256:hash(bytes)});
        await sleep(140-(performance.now()-before));
      }
    })();
    try{
      await sleep(1800-(performance.now()-start));
      if(scrollPoint){await page.mouse.move(scrollPoint.x,scrollPoint.y,{steps:6,label:'查看演示内容'});await page.mouse.wheel(0,240,{label:'阅读后续内容'});actions.push({time:(performance.now()-start)/1000,kind:'native-wheel',deltaY:240,point:scrollPoint});}
      await sleep(4300-(performance.now()-start));
      if(scrollPoint){await page.mouse.wheel(0,230,{label:'继续查看详情'});actions.push({time:(performance.now()-start)/1000,kind:'native-wheel',deltaY:230});}
      else{
        // Native keyboard focus makes a static settings/workflow scene inspectable.
        await page.keyboard.press('Tab');await page.keyboard.press('Tab');actions.push({time:(performance.now()-start)/1000,kind:'native-keyboard',keys:['Tab','Tab']});
      }
      await sleep(8000-(performance.now()-start));
    }finally{capturing=false;await capture;}
    await fs.writeFile(path.join(folder,'after.txt'),await page.snapshot({scope:'full_page'}));
    const demoErrors=await page.evaluate(()=>window.__demoErrors||[]);assert.deepEqual(demoErrors,[]);
    const duration=Math.max(8,frames.at(-1).time+.14);
    const concat=frames.map((frame,i)=>`file '${path.join(folder,frame.file)}'\nduration ${Math.max(.02,(frames[i+1]?.time??duration)-frame.time).toFixed(5)}`).join('\n')+`\nfile '${path.join(folder,frames.at(-1).file)}'\n`;
    await fs.writeFile(path.join(folder,'frames.txt'),concat);
    const posterFrame=frames[Math.min(frames.length-1,Math.floor(frames.length*.6))];
    const sourceInputsAfter=[];for(const file of sourceFiles)sourceInputsAfter.push({file,sha256:hash(await fs.readFile(path.join(root,'dist',file)))});
    assert.deepEqual(sourceInputsAfter,sourceInputs,'Do not encode a recording across source changes');
    const manifest={schema:'nerya-native-localized-recording/v1',name,lang,theme,variant,status:'captured',sourceUrl,sourceInputs,sourceInputsAfter,recordedAt:new Date().toISOString(),browser:{space:27,page:'p1'},viewport:{width:1280,height:800,deviceScaleFactor:1},capture:{method:'Ego Page.captureScreenshot native DPR1 PNG',retiming:'captured elapsed-time frame durations; no speed-up',duration},safety,disclosure:'Actual isolated Nerya demo DOM; synthetic data, no live model/account/order. No drawn UI or language overlays.',actions,frames,posterSourceFrame:posterFrame.file,demoErrors};
    // Encoding is intentionally outside Ego's NodeRuntime: native codecs must
    // not share its browser automation process or break a captured task.
    await fs.writeFile(path.join(folder,'capture.json'),JSON.stringify(manifest,null,2));completed.push(manifest);
    console.log('CAPTURED',stem,frames.length,'frames');
  }
}
console.log('CAPTURE COMPLETE',completed.length,'scenes; run node tools/encode-localized-films.mjs');
