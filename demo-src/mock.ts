/** All transport and storage belongs to this demo, never to a real runtime.
 * No passthrough fetch exists; CSP connect-src 'none' is a second boundary.
 */
import {richResponse, strategyRows, NOW} from './fixtures';
import {scenario, reportDocument, classifyPrompt} from './content';
import {createCommandFixtures} from './command-fixtures';
type Json=Record<string,any>;
const memory=new Map<string,string>();
const storage={get length(){return memory.size;},key:(i:number)=>[...memory.keys()][i]??null,getItem:(k:string)=>memory.get(String(k))??null,setItem:(k:string,v:string)=>memory.set(String(k),String(v)),removeItem:(k:string)=>memory.delete(String(k)),clear:()=>memory.clear()};
Object.defineProperty(window,'localStorage',{value:storage,configurable:true});
Object.defineProperty(window,'sessionStorage',{value:storage,configurable:true});
const query=new URLSearchParams(location.search);
let locale=query.get('lang')==='en'?'en':'zh';
storage.setItem('nerya.ui_settings.v1',JSON.stringify({language:locale,darkMode:document.documentElement.classList.contains('light')?'light':'dark',kline:{venue:'research',symbol:'BTCUSDT',interval:'1h',count:96},refreshSeconds:60,showVolume:true,chartType:'candlestick',timezone:'auto'}));
storage.setItem('nerya.sidebar.advanced-open','1');
window.addEventListener('nerya:ui_settings_changed',()=>{
 const settings=JSON.parse(storage.getItem('nerya.ui_settings.v1')||'{}');
 document.documentElement.style.colorScheme=settings.darkMode==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):settings.darkMode||'light';
});
const stamp='2026-09-20T08:00:00.000Z';
const copy=(en:string,zh:string)=>locale==='en'?en:zh;
const assistantProfiles:Json[]=[{
 id:'main',name:'Nerya',role:copy('Research assistant','研究助理'),instructions:'',avatar:'',enabled:true,
 revision:1,created_at:NOW/1000,updated_at:NOW/1000,model_provider:'',model_id:'',model_tier:'',
 research_allowed:true,memory_allowed:true,browser_allowed:true,files_allowed:true,shell_allowed:false,
 tool_policy:{allow_groups:[],deny:[]},
}];
const deny=()=>{throw new Error('Network transport is disabled in this local demo.');};
window.WebSocket=class{constructor(){deny();}} as any;
window.EventSource=class{constructor(){deny();}} as any;
window.XMLHttpRequest=class{open(){deny();}send(){deny();}} as any;
Object.defineProperty(navigator,'sendBeacon',{value:()=>false,configurable:true});
const requests:Json[]=[];(window as any).__demoRequests=requests;
const reportHtml=()=>reportDocument('research',locale);
const roles=[{name:'researcher',tier:'high',allowed_skills:['web_search','analysis'],source:'default',description:'研究员 · Research and source verification',prompt:'Research the question. Cite evidence and disclose uncertainty.',persistent:true},{name:'reviewer',tier:'high',allowed_skills:['analysis'],source:'default',description:'审阅员 · Independent critical review',prompt:'Challenge the assumptions and review the evidence.',persistent:true},{name:'risk_critic',tier:'medium',allowed_skills:['analysis'],source:'default',description:'风险审查员 · Risk and uncertainty',prompt:'Identify risk without executing any action.',persistent:true}];
const skills=[{id:'analysis',name:'Analysis',version:'1.0',description:'结构化分析与报告 · Structured analysis',permissions:[],actions:['analyze'],source:'default'},{id:'web_search',name:'Web search',version:'1.0',description:'来源检索 · Source research',permissions:[],actions:['search'],source:'default'},{id:'filesystem',name:'Workspace files',version:'1.0',description:'工作区产物 · Workspace artifacts',permissions:[],actions:['read_file'],source:'default'}];
function turn(kind:string,text=''):Json{
 const s=scenario(kind,locale,text);const reply=s.reply;
 const plan=copy('Define the horizon, inspect the source records, then ask a reviewer to challenge the thesis.','先明确时间尺度，再检查来源记录，最后让审阅员质疑假设。');
 return {reply_text:reply,final_text:reply,turn_id:'turn-'+kind,stopped_reason:'completed',
 blocks:[{block:{kind:'thinking',text:plan}},
 {block:{kind:'tool_use',call_id:'read-'+kind,skill_id:'filesystem',action:'read_file',payload:{path:'research/market-context.json'}}},
 {block:{kind:'tool_result',call_id:'read-'+kind,skill_id:'filesystem',action:'read_file',ok:true,result:{path:'research/market-context.json',content:'{"window":"4h","confirmation_bars":3,"risk_limit_pct":5}'}}},
 {block:{kind:'text',text:reply}}],
 subagents:{},
 attachments:[{id:'report-'+kind,name:kind==='strategy'?'validation-plan.md':'research-brief.html',mime_type:kind==='strategy'?'text/markdown':'text/html',size:reply.length,kind:'document',text:kind==='strategy'?reply:reportDocument(kind,locale)}],
 artifact_index:{artifacts:[{path:'reports/research-brief.html',title:s.title,type:'html'}]},budget:{total_tokens:4268,total_cost_usd:0.024}};
}
const sessions:Json[]=['research','strategy','review'].map((kind,i)=>{
 const s=scenario(kind,locale);const ts=new Date(NOW-i*1800000).toISOString();
 const clarification=copy('Use a four-hour research window. Keep opposing evidence visible and save the report to the workspace.','按 4 小时窗口研究。保留反对证据，把报告保存到工作区。');
 return {session_id:'demo-'+kind,title:s.title,meta:{title:s.title},kind,assistant_id:'main',strategy_id:i===0?undefined:'btc_trend_guard',source:i===2?'strategy_evolution':'user_chat',created_at:ts,updated_at:ts,status:'completed',state:'completed',message_count:4,messages:[
 {message_id:kind+'-u0',role:'user',content:s.prompt,ts},
 {message_id:kind+'-a0',role:'assistant',content:copy('I’ll split the work between research, independent review, and risk checks. Which time horizon should the team prioritize?','我会把任务拆给研究、独立审阅与风险检查。团队优先关注哪个时间尺度？'),ts},
 {message_id:kind+'-u',role:'user',content:clarification,ts},
 {message_id:kind+'-a',role:'assistant',content:turn(kind).reply_text,turn:turn(kind),ts}]};
});
const threadRows=()=>sessions.map(s=>({id:s.session_id,title:s.title,created_ts:Date.parse(stamp),updated_ts:Date.parse(stamp),message_count:s.messages.length,messages:s.messages.map((m:Json)=>({id:m.message_id,role:m.role,text:m.content,turn:m.turn,ts:Date.parse(stamp),backend_message_id:m.message_id})),transcript_loaded:true,imported:true}));
storage.setItem('nerya.chat.threads.v1',JSON.stringify(threadRows()));
storage.setItem('nerya.chat.task-dock.v2',JSON.stringify(Object.fromEntries(['research','strategy','review'].map(kind=>['demo-'+kind,{open:true,expanded:false,selected:'agents',tabs:['agents','files'],dismissed:[]}]))));
const files:Record<string,string>={'reports/research-brief.html':reportHtml(),'strategies/validation-plan.md':turn('strategy').reply_text,'proposals/candidate.diff':'--- config.yaml\n+++ candidate.yaml\n@@ -1,2 +1,2 @@\n-max_position_pct: 10\n+max_position_pct: 5\n-confirmations: 1\n+confirmations: 3'};
files['research/market-context.json']=JSON.stringify({symbol:'BTC/USDT',timeframe:'4h',window_bars:240,trend:{fast_ema:20,slow_ema:60,confirmation_bars:3},volume_confirmation:false,risk:{max_position_pct:5},review:{researcher:'conditional continuation',reviewer:'wait for volume confirmation'}},null,2);
const tiers=['light','medium','high'].map(tier=>({tier,provider:'workspace',model:tier==='high'?'Research model':'Fast model',has_key_ref:false,reasoning_effort:'high'}));
const envelope=(data:Json)=>({ok:true,status:'ok',severity:'info',summary:'',primary_action:null,next_actions:[],source_refs:[],debug_refs:[],data});
const empty={ok:true,count:0,total:0,items:[],rows:[],events:[],strategies:[],accounts:[],orders:[],positions:[],proposals:[],runs:[],tasks:[],routes:[],providers:[],reports:[],files:[],agents:[],messages:[],warnings:[],errors:[],data:{},status:'ok'};
const englishTerms: Array<[string,string]> = [
 ['BTC 市场结构 · 4h','BTC market structure · 4h'],['BTC 趋势跟随','BTC trend guard'],['ETH 区间均值回归','ETH range mean reversion'],['宏观与流动性观察','Macro and liquidity watch'],['仓位上限 · 提案 014','Position cap · Proposal 014'],['每日研究简报','Daily research brief'],['策略运行复盘','Strategy run review'],['更新 BTC 趋势与流动性判断','Update BTC trend and liquidity read'],['复核策略样本外窗口','Review strategy holdout window'],['检查仓位上限调整提案','Review position cap proposal'],['宏观与市场结构变化','Macro and market structure changes'],['研究资产 / FACTOR LIBRARY','Research assets / FACTOR LIBRARY'],['因子库','Factor library'],['趋势与成交量确认','Trend and volume confirmation'],['A 股质量因子','A-share quality factor'],['研究行情，写策略，跑回测','Research, build and backtest'],['市场研究','Market research'],['策略验证','Strategy validation'],['持仓复盘','Portfolio review'],['团队协作','Team collaboration'],['今天想研究什么？','What would you like to explore?'],['研究市场、验证策略，或把一个任务交给你的 Agent 团队。','Research markets, test a strategy, or work through a task with your agent team.'],['下次发送','Next send'],['运行时默认','Runtime default'],['思考 自动','Think Auto'],['从下方选择问题，或直接描述你的目标。','Choose a question below, or describe your goal.'],['推荐问题','Suggested'],['研究员','Researcher'],['审阅员','Reviewer'],['风险审查员','Risk reviewer'],['策略作者','Strategy author'],['市场研究员','Market researcher'],['独立审阅员','Independent reviewer'],['风险判断','Risk judgment'],['通过检查','Passed checks'],['模拟执行','Paper execution'],['研究组合','Research portfolio'],['风险检查','Risk check'],['趋势信号','Trend signal'],['波动率与仓位计算','Volatility and position sizing'],['市场结构与波动率','Market structure and volatility'],['4h 行情与成交量','4h market data and volume'],['趋势过滤完成，风险条件满足','Trend filter complete; risk conditions met'],['正在核查新增信号','Checking a new signal'],['加密货币','Crypto'],['预测市场','Prediction markets'],['期货','Futures'],['A 股因子轮动','A-share factor rotation'],['事件概率与证据核查','Event probability and evidence review'],['期货期限结构','Futures term structure'],['样本外审阅员','Holdout reviewer'],['结算规则审阅员','Settlement rules reviewer'],['合约研究员','Contract researcher'],['因子研究员','Factor researcher'],['会话与执行记录','Session and execution record'],['生成改进提案','Generate improvement proposal'],['样本外验证','Holdout validation'],['人工审批','Human approval'],['版本更新','Version update'],['持续观察','Ongoing observation'],['查看提案','View proposal'],['研究简报已更新','Research brief updated'],['仓位上限调整待审阅','Position cap change pending review'],['研究员与审阅员已完成交叉核查','Researcher and reviewer completed cross-check'],['波动扩张阶段的单笔仓位上限保持为 5%，需要独立审查后才能修改。','Keep the single-position cap at 5% during volatility expansion; independent review is required for changes.'],['保留研究员与审阅员的分歧，不要求人为达成一致。','Preserve researcher and reviewer disagreement; do not force consensus.'],['趋势、价格变化与组合策略','Trend, price action and portfolio strategies'],['因子变化和组合轮动','Factor changes and portfolio rotation'],['持仓变化','Position change'],['波动状态','Volatility'],['资金费率偏离','Funding skew'],['较高','High'],['持仓 / 确认','Position / confirmation'],['每次最多持有','Max position'],['确认','Confirm'],['根 K 线','bars'],['版本 02 已准备','Version two is ready'],['策略进化','Strategy evolution']
];
function englishize(value: any): any {
  if (typeof value === 'string') return englishTerms.reduce((text,[zh,en]) => text.split(zh).join(en), value);
  if (Array.isArray(value)) return value.map(englishize);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key,item]) => [key,englishize(item)]));
  return value;
}
let seq=0;const events:Json[]=[];

const memberMessages=new Map<string,Json[]>();
const memberStates=new Map<string,string>();
const memberAttempts=new Map<string,number>();
const memberReplies=new Map<string,string>();
const memberTimes=new Map<string,number>();
const memberExtraEvents=new Map<string,Json[]>();
function agentRows(id:string){return roles.map((r,i)=>({id:id+'-'+r.name,session_id:id,group_id:id+'-team',parent_call_id:'team-'+id,name:r.name,title:scenario(sessions.find(s=>s.session_id===id)?.kind||'research',locale).title,state:memberStates.get(id+'-'+r.name)||'completed',attempt:memberAttempts.get(id+'-'+r.name)||1,updated_at:memberTimes.get(id+'-'+r.name)||NOW/1000+i,output:{summary:memberReplies.get(id+'-'+r.name)||[copy('Trend remains intact, but volume has not confirmed the breakout.','趋势尚未破坏，但量能未确认突破。'),copy('Retain the opposing view. Three completed bars are required before increasing exposure.','保留反对意见，增加敞口前需要三根已完成 K 线确认。'),copy('Keep risk at 5% and preserve the rollback path.','保持 5% 风险上限，并保留回滚路径。')][i],findings:[copy('240 bars reviewed','已核查 240 根 K 线'),copy('Source window and timestamps verified','已核查来源窗口与时间戳')],next_steps:[copy('Check the next completed bar','检查下一根已完成 K 线')]},context:{parent_session_id:id,scope:'session',inherited_messages:4,saved_messages:12+i*2,allowed_skills:r.allowed_skills,model:i===1?'Review model':'Research model'},activity:{action:i===0?'analysis':i===1?'cross_check':'risk_review'},pending_messages:0}));}

const commandFixtures=createCommandFixtures({
 run:(body,signal)=>api('/agent/run_turn_internal',new URLSearchParams(),body,'POST',signal),
 session:id=>sessions.find(s=>s.session_id===id),agents:agentRows,
 start:(id,text)=>{if(!sessions.some(s=>s.session_id===id))sessions.unshift({session_id:id,title:text.slice(0,28),kind:classifyPrompt(text),created_at:stamp,updated_at:stamp,status:'running',state:'running',messages:[],message_count:0});},
 events:(id,commandId,after)=>events.filter(e=>e.session_id===id&&e.command_id===commandId&&e.seq>after),
});
async function api(path:string,q:URLSearchParams,body:Json,method:string,signal?:AbortSignal):Promise<Json>{
 const command=commandFixtures(path,q,body,method);if(command!==undefined)return command;
 // This public, memory-only demo has no credentials or runtime access. Match
 // AuthGate's status contract without weakening the real dashboard's gate.
 if(path==='/auth/status' && method==='GET')return {ok:true,local_access:true,mode:'isolated-demo',demo:true};
 if(path==='/assistants'&&method==='GET')return {ok:true,assistants:assistantProfiles,channels:[],workspace:'isolated-demo'};
 if(path==='/assistants/session'&&method==='GET'){
  const session=sessions.find(s=>s.session_id===q.get('session_id'));
  const assistant=assistantProfiles.find(row=>row.id===session?.assistant_id)||assistantProfiles[0];
  return {ok:true,assistant,conversation:session?{conversation_kind:'task',parent_session_id:null}:{conversation_kind:'assistant',parent_session_id:null}};
 }
 if(path==='/assistants/conversations'&&method==='GET'){
  const assistantId=q.get('assistant_id')||'main';
  return {ok:true,sessions:sessions.filter(s=>s.assistant_id===assistantId).map(({messages,...session})=>session),count:sessions.filter(s=>s.assistant_id===assistantId).length};
 }
 if(path==='/assistants/conversations'&&method==='POST'){
  const assistantId=String(body.assistant_id||'main'),id='demo-new-'+Date.now(),title=copy('New task conversation','新任务对话');
  sessions.unshift({session_id:id,title,meta:{title},kind:'research',assistant_id:assistantId,source:'user_chat',created_at:new Date().toISOString(),updated_at:new Date().toISOString(),status:'idle',state:'idle',message_count:0,messages:[]});
  return {ok:true,session_id:id,assistant_id:assistantId};
 }
 if(path==='/assistants/home'&&method==='POST')return {ok:true,session_id:'demo-research',assistant_id:String(body.assistant_id||'main')};
 const rich=richResponse(path,q,body,method);if(rich!==null)return rich;
 if(path==='/operator/nav')return envelope({primary:[['home','/dashboard','Overview'],['agent_workspace','/chat','New chat'],['runtime_library','/agents','Agents'],['strategy_lab','/strategies','Strategies'],['trading','/portfolio','Trading'],['automation','/workflows','Automation'],['inbox','/inbox','Inbox'],['settings','/settings','Settings']].map(([id,href,label])=>({id,href,label,always_visible:true})),advanced:[{id:'learning',href:'/self-evolution',label:'Memory and learning'},{id:'browser',href:'/browsers',label:'Browser'}],hidden:[],capabilities:{}});
 if(path==='/health')return {status:'ok',version:'0.1.0'};
 if(path==='/workspace')return {root:'research-workspace',live_trading_enabled:false,kill_switch:false};
 if(path==='/llm/tiers')return {tiers,count:tiers.length};
 if(path==='/llm/config')return {ok:true,default_tier:'high',tiers,provider_profiles:[],reasoning_levels:['off','low','medium','high','xhigh']};
 if(path==='/llm/models')return {providers:{workspace:[{id:'Research model'},{id:'Fast model'}]},errors:{},counts:{workspace:2}};
 if(path==='/llm/providers')return {providers:[{provider:'demo',adapter_present:true,configured_tiers:['high'],has_key_ref:false,ready:true}]};
 if(path==='/agent/sessions')return {sessions:sessions.filter(s=>!q.get('strategy_id')||s.strategy_id===q.get('strategy_id')).map(({messages,...row})=>row),has_more:false,offset:0};
 if(path==='/agent/session'||path==='/agent/session/transcript') {const s=sessions.find(s=>s.session_id===q.get('session_id'));return s?{ok:true,...s,count:s.messages.length}:{ok:true,messages:[],count:0};}
 if(path==='/agent/stream/events'){const after=Number(q.get('after_seq')||0);const id=q.get('session_id');const list=events.filter(e=>e.seq>after&&(!id||e.session_id===id));return {events:list,latest_seq:seq,cursor:seq,count:list.length};}
 if(path==='/agent/run_turn_internal'){
  const text=String(body.payload?.text||'');const kind=classifyPrompt(text);const id=String(body.session_id||'demo-'+Date.now());
  const emit=(event:Json)=>events.push({...event,seq:++seq,session_id:id,command_id:body.command_id,turn_id:body.turn_id,ts:Date.now()/1000});
  const wait=(ms:number)=>new Promise<void>((resolve,reject)=>{if(signal?.aborted)return reject(new DOMException('Aborted','AbortError'));const timer=setTimeout(()=>{signal?.removeEventListener('abort',abort);resolve();},ms);const abort=()=>{clearTimeout(timer);reject(new DOMException('Aborted','AbortError'));};signal?.addEventListener('abort',abort,{once:true});});
  emit({kind:'turn.step',step:{kind:'thinking',detail:{text:copy('Assign the question to research and review, then compare the evidence.','将问题分配给研究员与审阅员，对照双方证据。')}}});
  emit({kind:'tool.start',call_id:'scan-'+seq,skill_id:'filesystem',action:'read_file',payload:{path:'research/market-context.json'}});
  await wait(700);emit({kind:'tool.complete',call_id:'scan-'+(seq-1),skill_id:'filesystem',action:'read_file',ok:true,result:{path:'research/market-context.json',content:'4h / 3 confirmation bars / max position 5%'}});
  const words=scenario(kind,locale,text).reply.match(/[\s\S]{1,100}/g)||[];
  for(const chunk of words){emit({kind:'message.delta',text:chunk});await wait(170);}
  const result=turn(kind,text);if(body.command_id){result.command_id=body.command_id;result.turn_id=body.turn_id;}
  let s=sessions.find(s=>s.session_id===id);if(!s){s={session_id:id,title:text.slice(0,28),kind,created_at:stamp,updated_at:stamp,status:'completed',state:'completed',messages:[]};sessions.unshift(s);}
  s.status='completed';s.state='completed';s.updated_at=new Date().toISOString();
  s.messages.push({message_id:body.turn_id?body.turn_id+':user':id+'-u-'+seq,role:'user',content:text,ts:new Date().toISOString()},{message_id:body.turn_id?body.turn_id+':assistant':id+'-a-'+seq,role:'assistant',content:result.reply_text,turn:result,ts:new Date().toISOString()});s.message_count=s.messages.length;
  return result;
 }
 if(path==='/agent/session/rename'){const s=sessions.find(s=>s.session_id===body.session_id);if(s)s.title=String(body.title);return {ok:true,session:s};}
 if(path==='/agent/session/delete'){const i=sessions.findIndex(s=>s.session_id===body.session_id);if(i>=0)sessions.splice(i,1);return {ok:true};}
 if(path==='/agent/interrupt')return {ok:true,interrupted:true};
 if(path==='/agent/open_turns')return {open_turns:[]};
 if(path==='/approvals/pending')return {ok:true,approvals:[],count:0};
 if(path==='/teams/roles')return {ok:true,roles};
 if(path==='/teams/role/get')return {ok:true,role:roles.find(r=>r.name===body.name)||roles[0]};
 if(path==='/teams/agents')return {ok:true,agents:agentRows(q.get('session_id')||'demo-research')};
 if(path==='/teams/agents/get'){
  const id=String(body.session_id||q.get('session_id')||'demo-research');const row=agentRows(id).find(r=>r.id===body.agent_id)||agentRows(id)[0];const time=NOW/1000;
  return {ok:true,agent:row,has_more:false,events:[{seq:1,kind:'started',ts:time-120,data:{attempt:1,title:row.title}},{seq:2,kind:'text',ts:time-110,data:{attempt:1,text:copy('Inspect the source records and separate assumptions from observations.','先检查来源记录，将观察结果与假设分开。')}},{seq:3,kind:'tool_use',ts:time-100,data:{attempt:1,call_id:'source-check',action:'read_file',payload:{path:'research/market-context.json'}}},{seq:4,kind:'tool_result',ts:time-80,data:{attempt:1,call_id:'source-check',action:'read_file',ok:true,result:{window:'4h',records:240,quality:'complete'}}},{seq:5,kind:'completed',ts:time-30,data:{attempt:1,output:row.output}},...(memberExtraEvents.get(row.id)||[])],messages:memberMessages.get(row.id)||[{id:'mail-'+row.id,sender:'lead',recipient:row.id,content:copy('Compare both sides of the thesis and flag missing evidence.','请比较假设两侧的证据，先指出缺失项，再整理结论。'),status:'consumed',ts:time-115}]};
 }
 if(/^\/teams\/agents\/(message|send|resume|pause|stop|cancel)$/.test(path)){
  const id=String(body.agent_id),sid=String(body.session_id);const row=agentRows(sid).find(r=>r.id===id);if(!row)return {ok:false,error:'Member not found'};
  if(body.message){const list=memberMessages.get(id)||[];list.push({id:'mail-'+Date.now(),sender:'operator',recipient:id,content:String(body.message),status:'consumed',ts:Date.now()/1000},{id:'reply-'+Date.now(),sender:id,recipient:'operator',content:copy('I will keep the current risk limits and add a separate evidence check.','我会保留当前风险限制，并增加独立的证据检查。'),status:'delivered',ts:Date.now()/1000+1});memberMessages.set(id,list);}
  if(path.endsWith('/resume')){
    const attempt=(memberAttempts.get(id)||1)+1;const now=Date.now()/1000;
    const reply=copy('I will keep the current risk limits and add a separate evidence check. I have added volume confirmation and the opposing scenario to the review checklist.','我会保留当前风险限制，并增加独立的证据检查。已将成交量确认和反向情景加入审查清单。');
    memberAttempts.set(id,attempt);memberReplies.set(id,reply);memberTimes.set(id,now);
    const extra=memberExtraEvents.get(id)||[];let n=6+extra.length;
    extra.push({seq:n++,kind:'instruction',ts:now-.5,data:{attempt,text:body.message||copy('Continue the review','继续审查')}},{seq:n,kind:'completed',ts:now,data:{attempt,output:{summary:reply}}});memberExtraEvents.set(id,extra);
  }
  memberStates.set(id,/pause|stop|cancel/.test(path)?'paused':'completed');return {ok:true,agent:{...row,state:memberStates.get(id)}};
 }
 if(path==='/skills')return {ok:true,skills,count:skills.length};
 if(path==='/mcp-settings/roles')return {ok:true,roles};
 if(path==='/skills/catalog')return {ok:true,skills:[...skills,{id:'factor_library',name:'Factor library',version:'1.0',description:'因子定义、版本与验证结果 · Factor definitions and validation',permissions:[],actions:['list','get','data','export'],source:'builtin',enabled:true,assigned:true,revision:'v1',files:['SKILL.md'],method_count:4}],count:skills.length+1,total:skills.length+1,next_offset:null,enabled_revision:'v1',binding_revision:'v1'};
 if(path==='/skills/read'){const s=skills.find(s=>s.id===q.get('skill_id'))||skills[0];return {ok:true,id:s.id,source:'builtin',file:q.get('file')||'SKILL.md',revision:'v1',text:'# '+s.name+'\n\n'+s.description+'\n\n## Workflow\n1. Confirm scope and inputs.\n2. Inspect evidence and record uncertainty.\n3. Return a structured, reviewable result.\n',next_offset:null,files:['SKILL.md']};}
 if(path==='/skills/installed')return {ok:true,installed:skills.map(s=>({id:s.id,skill_id:s.id,version:s.version,source:'workspace'}))};
 if(path==='/skills/lock/status')return {ok:true,lock:{entries:skills.map(s=>({id:s.id,version:s.version}))},drift:{changed:[],missing:[],extra:[]},signature:null};
 if(path==='/skills/lock/inspect')return {ok:true,entries:skills.map(s=>({id:s.id,skill_id:s.id,version:s.version,status:'matched'}))};
 if(path==='/skills/detail'){const s=skills.find(s=>s.id===q.get('skill_id'))||skills[0];return {ok:true,skill:{...s,path:'skills/'+s.id,relative_path:'skills/'+s.id,editable:false,has_playbook:true,status:'ready',skill_md:'# '+s.name+'\n\n'+s.description+'\n\n## Workflow\n1. Confirm the question and scope.\n2. Inspect the available evidence.\n3. Record findings, uncertainty, and next steps.\n',files:[{path:'SKILL.md',kind:'playbook',size:248,mtime:NOW/1000}]}};}
 if(path==='/workspace/files'){const dir=q.get('path')||'.';return {ok:true,path:dir,entries:dir==='.'?[...new Set(Object.keys(files).map(p=>p.split('/')[0]))].map(name=>({name,path:name,kind:'dir'})):Object.keys(files).filter(p=>p.startsWith(dir+'/')).map(p=>({name:p.split('/').at(-1),path:p,kind:'file',size:files[p].length})),truncated:false};}
 if(path==='/workspace/file'){const name=q.get('path')||'';return {ok:!!files[name],path:name,content:files[name]||'',error:files[name]?undefined:'Demo file not found',binary:false,truncated:false};}
 if(path==='/workspace/file/save'&&body.path in files){files[body.path]=String(body.content||'');return {ok:true,path:body.path,detail:'Saved'};}
 if(path==='/inbox/items')return envelope({items:[],counts:{total:0,unread:0,actionable:0}});
 if(path==='/setup/readiness')return envelope({ready:true,overall:'ready',checks:[],blockers:[],warnings:[],counts:{ready:0,total:0}});
 if(path==='/operator/overview')return envelope({health:{live_trading:false,kill_switch:false,llm_ready:true,trading_account:false,strategies:false},portfolio:{},attention:[],activity:[],counts:{},runtime:{mode:'paper'}});
 if(path==='/strategy/list'||path==='/strategy/list_all'||path==='/strategies')return {ok:true,strategies:[],count:0};
 if(path==='/accounts/list')return {accounts:[],count:0};
 if(path==='/portfolio/summary')return {equity:0,equity_usd:0,cash_usd:0,exposure_usd:0,positions_count:0,mode:'paper'};
 if(path==='/portfolio/positions')return {positions:[]};
 if(path==='/market/candles')return {candles:[]};
 if(path==='/memory/profile')return envelope({profile:{},facts:[],preferences:[],rules:[]});
 if(path.startsWith('/teams/agent/'))return {ok:true,agent:{id:body.agent_id||q.get('agent_id'),name:'researcher',state:'completed',context:{allowed_skills:['analysis']}},events:[],messages:[],has_more:false};
 // Only read-style routes can return empty demo collections. Unknown writes
 // never report success, and never reach a backend.
 const readOnly=method==='GET'||/\/(list|list_all|status|summary|positions|proposals|events|history|roles|read|config|catalog|search|get|overview|readiness)$/.test(path);
 if(readOnly)return {...empty,data:{...empty}};
 return {ok:false,error:copy('This action requires an installed workspace.','此操作需要在已安装的工作区中执行。')};
}
window.fetch=(async (input:RequestInfo|URL,init:RequestInit={})=>{
 const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url,location.href);
 const method=(init.method||'GET').toUpperCase();
 const directRuntimeInfo=url.pathname==='/runtime/info'&&method==='GET';
 if(url.origin!==location.origin||(!url.pathname.startsWith('/api/')&&!directRuntimeInfo))throw Error('Demo blocks all external/runtime network requests.');
 const raw=typeof init.body==='string'?init.body:'{}';let body:Json={};try{body=JSON.parse(raw);}catch{}
 const path=directRuntimeInfo?'/runtime/info':url.pathname.replace(/^\/api\/proxy/,'').replace(/^\/api/,'');requests.push({path,method,local:true});
 const response=await api(path,url.searchParams,body,method,init.signal||undefined);
 return new Response(JSON.stringify(locale==='en'?englishize(response):response),{status:200,headers:{'content-type':'application/json'}});
}) as typeof fetch;
window.addEventListener('message',e=>{
 if(e.source!==window.parent||e.origin!==location.origin||e.data?.type!=='nerya-demo')return;
 if(e.data.lang==='en'||e.data.lang==='zh'||e.data.theme==='dark'||e.data.theme==='light'){
  if(e.data.lang==='en'||e.data.lang==='zh')locale=e.data.lang;
  const settings=JSON.parse(storage.getItem('nerya.ui_settings.v1')||'{}');
  storage.setItem('nerya.ui_settings.v1',JSON.stringify({...settings,language:locale,...(e.data.theme==='dark'||e.data.theme==='light'?{darkMode:e.data.theme}:{})}));dispatchEvent(new Event('nerya:ui_settings_changed'));
 }
 if(typeof e.data.route==='string'&&/^\/(?:chat(?:\/[a-z0-9_-]+)?|agents|assistants|strategies|factors|self-evolution|memory|settings|dashboard|portfolio|workflows|tasks|accounts|advanced|browsers|desktop|env-vault|gateway|inbox|incidents|orders|skills|web-search)(?:\?[A-Za-z0-9_=&%-]+)?$|^\/$/.test(e.data.route))location.hash=e.data.route;
});
window.addEventListener('hashchange',()=>{if(window.parent!==window)window.parent.postMessage({type:'nerya-demo-route',route:(location.hash.slice(1)||'/').split('?')[0]},location.origin);});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&window.parent!==window)window.parent.postMessage({type:'nerya-demo-escape'},location.origin);});
