(() => {
  'use strict';
  const D=window.NeryaCapabilities, $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const lang=()=>window.NeryaLanding.language;
  const text=(en,zh)=>lang()==='en'?en:zh;
  const pair=a=>a[lang()==='en'?0:1];
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let market='crypto',mission=0,playing=false,timer=0,visibilityPauseTimer=0;
  let evolution=D.evolve({},'reset');
  let adapter=null,adapterStep=-1,adapterTimer=0,adapterRevision=0;
  let promptEdited=false;
  const pulse=(el)=>{if(reduced.matches)return;el.animate([{opacity:.4,transform:'translateY(7px)'},{opacity:1,transform:'none'}],{duration:320,easing:'cubic-bezier(.22,1,.36,1)'});};
  function renderMarket(animate=false){
    const data=D.markets[market];
    $$('[data-market]').forEach(b=>{const on=b.dataset.market===market;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;});
    $('#market-panel').setAttribute('aria-labelledby','market-'+market);
    $('#market-symbol').textContent=data.symbol;$('#market-title').textContent=pair(data.title);$('#market-prompt').textContent=pair(data.prompt);
    $('#market-constraints').innerHTML=data.constraints.map(c=>`<span>${window.NeryaIcons.svg('shield',16)} ${pair(c)}</span>`).join('');
    $('#market-flow').innerHTML=data.nodes.map((node,i)=>`<button class="flow-node ${i===0?'selected':''}" data-flow-node="${i}" aria-pressed="${i===0}"><span class="flow-index">${String(i+1).padStart(2,'0')}</span><strong>${pair(node)}</strong><small>${i===0?pair(data.sources):i===data.nodes.length-1?text('VALIDATE','验证'):text('Inspect this step','检查这个步骤')}</small><span class="flow-port" aria-hidden="true"></span></button>`).join('<span class="flow-connector" aria-hidden="true"><i></i></span>');
    $('#market-artifact').textContent=data.artifact;$('#market-sources').textContent=pair(data.sources);$('#market-support').textContent=pair(data.support);
    $('#market-validation').textContent=pair(data.stage);if(animate)pulse($('#market-panel'));
  }
  $$('[data-market]').forEach(b=>b.addEventListener('click',()=>{market=b.dataset.market;renderMarket(true);}));
  $('#market-flow').addEventListener('click',e=>{const b=e.target.closest('[data-flow-node]');if(!b)return;$$('[data-flow-node]').forEach(n=>{const on=n===b;n.classList.toggle('selected',on);n.setAttribute('aria-pressed',String(on));});const index=Number(b.dataset.flowNode);$('#market-validation').textContent=pair(D.markets[market].nodes[index])+' · '+(index===0?pair(D.markets[market].sources):index===4?text('Validate the strategy, then check connector support and execution permissions.','验证策略后，检查连接器支持与执行权限。'):pair(D.markets[market].constraints[index%3]));});
  $('#market-validate').addEventListener('click',()=>{$('#market-validation').textContent=text('5 steps linked · constraints included · execution requires a separate review.','5 个步骤已连接 · 已纳入市场约束 · 执行权限需单独审核。');$('#market-flow').classList.remove('validated');void $('#market-flow').offsetWidth;$('#market-flow').classList.add('validated');});
  $('#market-open').addEventListener('click',()=>window.NeryaLanding.openAgent('/strategies?strategy_id='+D.markets[market].id));

  function renderMission(animate=false){
    const step=D.collaboration[mission];
    $$('[data-mission]').forEach((b,i)=>{b.setAttribute('aria-pressed',String(i===mission));b.classList.toggle('complete',i<mission);});
    $('#mission-console').style.setProperty('--mission-progress',mission/3);
    $('#mission-message').innerHTML=`<div class="message-heading"><span class="role-author"><img class="inline-agent-avatar" src="${window.NeryaAvatars.path(step.role)}" width="28" height="28" alt="" aria-hidden="true" data-avatar-role="${step.role}"><strong>${pair(step.name)}</strong></span><span>${pair(step.state)}</span></div><p>${pair(step.message)}</p>`;
    $('#mission-artifact').textContent=step.artifact;$('#mission-progress').value=String(mission);$('#mission-position').textContent=`0${mission+1} / 04`;
    $('#mission-play').textContent=playing?text('Pause Ⅱ','暂停 Ⅱ'):mission===3?text('Replay ▷','重播协作 ▷'):text('Run the team ▷','启动团队 ▷');$('#mission-play').setAttribute('aria-pressed',String(playing));
    window.NeryaIcons.render($('#mission-play'));
    if(animate)pulse($('#mission-message'));
  }
  function stopMission(){clearTimeout(timer);playing=false;renderMission();}
  function tickMission(){clearTimeout(timer);timer=setTimeout(()=>{mission=Math.min(3,mission+1);if(mission===3)playing=false;renderMission(true);if(playing)tickMission();},1700);}
  $('#mission-play').addEventListener('click',()=>{if(playing){stopMission();return;}if(mission===3)mission=0;if(reduced.matches){mission=Math.min(3,mission+1);renderMission();return;}playing=true;renderMission();tickMission();});
  $('#mission-reset').addEventListener('click',()=>{stopMission();mission=0;renderMission();});
  $$('[data-mission]').forEach(b=>b.addEventListener('click',()=>{stopMission();mission=Number(b.dataset.mission);renderMission(true);}));
  $('#mission-progress').addEventListener('input',e=>{const next=Number(e.target.value);stopMission();mission=next;renderMission();});
  new IntersectionObserver(([e])=>{if(!e.isIntersecting&&playing)stopMission();}).observe($('#mission-console'));
  document.addEventListener('visibilitychange',()=>{
    clearTimeout(visibilityPauseTimer);
    if(document.hidden){
      clearTimeout(timer); // Freeze immediately; never advance while hidden.
      // Focus transfer can produce a sub-frame visibility pulse. Preserve its
      // current state; a genuinely hidden tab settles into an explicit pause.
      if(playing)visibilityPauseTimer=setTimeout(()=>{if(document.hidden)stopMission();},120);
    }else if(playing)tickMission();
  });
  reduced.addEventListener('change',()=>{if(playing)stopMission();});

  function renderEvolution(animate=false){
    const stage=D.evolution[evolution.step];
    $$('[data-evolution-step]').forEach((b,i)=>{b.setAttribute('aria-pressed',String(i===evolution.step));b.classList.toggle('complete',i<evolution.step);});
    $('#evolution-console').dataset.stage=String(evolution.step);$('#evolution-title').textContent=pair(stage.title);$('#evolution-body').textContent=pair(stage.body);$('#evolution-file').textContent=stage.file;$('#evolution-version').textContent='v'+evolution.version;
    $('#evolution-back').disabled=evolution.step===0;$('#evolution-next').disabled=evolution.step===4;$('#evolution-next').textContent=evolution.step===3?text('Run checks →','执行验证 →'):text('Next step →','下一步 →');
    window.NeryaIcons.render($('#evolution-next'));
    let controls='',status=text('Inspect each stage. The active version stays unchanged.','逐步检查，当前版本保持不变。');
    if(evolution.step===4){
      if(!evolution.validated){controls=`<button class="cap-button" data-evolution-action="validate">${text('Complete validation','先完成验证')}</button>`;status=text('Review requires a completed validation step.','审查前需要先完成验证。');}
      else if(!evolution.decision){controls=`<button class="cap-button primary" data-evolution-action="approve">${text('Approve candidate','批准候选版本')}</button><button class="cap-button" data-evolution-action="reject">${text('Request changes','退回修改')}</button>`;status=text('Checks complete. Waiting for your decision.','验证已完成，等待你的决定。');}
      else if(evolution.decision==='approved'){controls=`<button class="cap-button primary" data-evolution-action="apply">${text('Apply candidate','应用候选版本')}</button>`;status=text('Approved. Application is a separate action.','已批准，应用仍是独立动作。');}
      else if(evolution.decision==='applied'){controls=`<button class="cap-button" data-evolution-action="rollback">${text('Roll back to v1.3.2','回滚至 v1.3.2')}</button>`;status=text('Strategy version updated. Observation begins; rollback remains available.','策略版本已更新，进入观察阶段，仍可回滚。');}
      else if(evolution.decision==='revision')status=text('Returned for revision. v1.3.2 stays active.','已退回修改，继续保留 v1.3.2。');
      else status=text('Rolled back to v1.3.2. The review record is preserved.','已回滚至 v1.3.2，审查记录仍保留。');
    }
    $('#evolution-decisions').innerHTML=controls;$('#evolution-status').textContent=status;if(animate)pulse($('.evolution-focus'));
  }
  $('#evolution-next').addEventListener('click',()=>{evolution=D.evolve(evolution,'next');renderEvolution(true);});
  $('#evolution-back').addEventListener('click',()=>{evolution=D.evolve(evolution,'back');renderEvolution(true);});
  $('#evolution-reset').addEventListener('click',()=>{evolution=D.evolve(evolution,'reset');renderEvolution();});
  $$('[data-evolution-step]').forEach(b=>b.addEventListener('click',()=>{evolution={...D.evolve({},'reset'),step:Number(b.dataset.evolutionStep)};renderEvolution(true);}));
  $('#evolution-decisions').addEventListener('click',e=>{const action=e.target.closest('[data-evolution-action]')?.dataset.evolutionAction;if(!action)return;if(action==='validate')evolution=D.evolve({...evolution,step:3},'next');else evolution=D.evolve(evolution,action);renderEvolution(true);($('#evolution-decisions button')||$('#evolution-reset')).focus({preventScroll:true});});

  const presets={existing:['Connect Bybit through the existing CCXT bridge. Inspect capabilities before enabling order permissions.','帮我接入 Bybit，优先复用 CCXT 桥接，先检查能力，不开启订单权限。'],new:['Connect ExampleX market and account data. Prepare a connector and validation plan; keep order permissions disabled.','帮我接入 ExampleX 的行情与账户数据，先验证能力，订单权限保持关闭。']};
  const steps=[['Read the integration brief','读取接入需求'],['Check existing bridges','检查已有桥接'],['Map capabilities & boundaries','梳理能力与边界'],['Stage connector & test plan','准备连接器与验证方案'],['Ready for review','等待验证与审查']];
  function renderAdapter(){
    if(!adapter){$('#adapter-files').innerHTML='<div class="adapter-empty"><img src="assets/agent-avatars/coder.png" width="64" height="64" alt="" aria-hidden="true" data-avatar-role="coder"><p>'+text('Enter a venue and the API capabilities you need.','输入平台名称和需要接入的能力。')+'</p></div>';$('#adapter-code').textContent='';$('#adapter-status').textContent='';return;}
    $('#adapter-target').textContent='providers / '+adapter.target;$('#adapter-badge').textContent=adapterStep<4?text('Building a plan','生成方案中'):text('Review required','待验证与审查');
    $('#adapter-log').innerHTML=steps.map((s,i)=>`<div class="${i<adapterStep?'complete':i===adapterStep?'current':''}"><span>${window.NeryaIcons.svg(i<adapterStep?'check':i===adapterStep?'circleDot':'circle',16)}</span><span>${pair(s)}</span>${i===1&&adapterStep>=1?'<small>'+ (adapter.route==='reuse'?text('CCXT bridge found','发现 CCXT 桥接'):text('New provider module','新建 provider 模块'))+'</small>':''}</div>`).join('');
    $('#adapter-files').innerHTML=adapter.files.map((f,i)=>`<div class="adapter-file ${adapterStep>=2?'available':''}"><span>${window.NeryaIcons.svg('document',18)}</span><code>${escape(f)}</code><span>${window.NeryaIcons.svg(adapterStep>=3?'check':'circle',16)}</span></div>`).join('');
    $('#adapter-code').textContent=JSON.stringify({provider:adapter.target,route:adapter.route==='reuse'?'ccxt_bridge':'workspace_provider',capabilities:{market_data:'verify',account_read:'verify',place_order:false},validation:'required',activation:'operator_review'},null,2);
    $('#adapter-status').textContent=adapterStep===4?text('Plan staged. API documentation, contract tests and operator review are still required before enabling the connector.','方案已准备好。启用连接器前，仍需核对 API 文档、执行契约测试并完成操作者审查。'):pair(steps[Math.max(0,adapterStep)]);
    $('#adapter-download').disabled=adapterStep!==4;$('#adapter-generate').disabled=adapterStep<4;
  }
  $('#adapter-prompt').addEventListener('input',()=>{promptEdited=true;});
  $$('[data-adapter-preset]').forEach(b=>b.addEventListener('click',()=>{$('#adapter-prompt').value=pair(presets[b.dataset.adapterPreset]);promptEdited=true;}));
  $('#adapter-form').addEventListener('submit',e=>{
    e.preventDefault();const plan=D.adapterPlan($('#adapter-prompt').value);
    if(!plan.ok){$('#adapter-status').textContent=plan.error==='short'?text('Describe a venue and the capability you want to connect.','请描述要适配的平台与能力。'):text('Keep the request within 400 characters.','请将需求控制在 400 字以内。');$('#adapter-prompt').focus();return;}
    clearTimeout(adapterTimer);adapterRevision++;const revision=adapterRevision;adapter={...plan,prompt:$('#adapter-prompt').value};adapterStep=0;renderAdapter();
    const advance=()=>{if(revision!==adapterRevision)return;adapterStep++;renderAdapter();if(adapterStep<4)adapterTimer=setTimeout(advance,reduced.matches?0:650);};
    adapterTimer=setTimeout(advance,reduced.matches?0:650);
  });
  $('#adapter-download').addEventListener('click',()=>{if(!adapter||adapterStep!==4)return;const blob=new Blob([JSON.stringify({...adapter,notice:'Illustrative plan. Requires API verification, contract tests and review before deployment.'},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=adapter.target.toLowerCase()+'-integration-plan.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  function renderAll(){renderMarket();renderMission();renderEvolution();renderAdapter();if(!promptEdited)$('#adapter-prompt').value=pair(presets.new);}
  window.addEventListener('nerya:languagechange',renderAll);
  window.addEventListener('pagehide',()=>{clearTimeout(timer);clearTimeout(visibilityPauseTimer);clearTimeout(adapterTimer);adapterRevision++;});
  new IntersectionObserver(entries=>entries.forEach(e=>{e.target.dataset.inView=String(e.isIntersecting);})).observe($('.market-studio'));
  renderAll();
})();
