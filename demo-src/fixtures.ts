import type {WorkflowNode,WorkflowView} from '@dashboard/lib/workflowTypes.ts';
import capabilities from '../capabilities-data.js';
export type RecordData=Record<string,any>;
export const NOW=Date.parse('2026-09-20T08:42:00Z');
const iso=(minutes=0)=>new Date(NOW-minutes*60000).toISOString();
export const strategyRows=[
 {strategy_id:'btc_trend_guard',title:'BTC 趋势跟随',description:'4 小时趋势过滤，结合波动率调整仓位；风险审查后进入模拟执行。',status:'paper',state:'active',mode:'paper',markets:['BTC/USDT'],proposal_id:null,counts:{script:2,agent:3,source:2,risk:1,scheduler:1,account:1}},
 {strategy_id:'eth_range_balance',title:'ETH 区间均值回归',description:'识别低波动区间，过滤趋势突破；等待新一轮样本外验证。',status:'paused',state:'paused',mode:'paper',markets:['ETH/USDT'],proposal_id:null,counts:{script:2,agent:2,source:1,risk:1,scheduler:1,account:1}},
 {strategy_id:'macro_watch',title:'宏观与流动性观察',description:'汇总宏观事件、链上活动与风险分歧，交由团队每日上午审阅。',status:'draft',state:'draft',mode:'paper',markets:['BTC/USDT','ETH/USDT'],proposal_id:'proposal-021',counts:{script:1,agent:3,source:3,risk:1,scheduler:1}},
].map((r,i)=>({...r,id:r.strategy_id,key:r.strategy_id+':'+(r.proposal_id||'published'),name:r.title,enabled:i===0,execution_mode:'continuous',created_at:iso(7800+i*1000),updated_at:iso(i*22),accounts:['paper_main'],version:'1.3.'+i}));
for(const key of ['prediction','futures','equities']){
 const m=capabilities.markets[key];
 const title=key==='prediction'?'事件概率与证据核查':key==='futures'?'期货期限结构':'A 股因子轮动';
 strategyRows.push({...strategyRows[0],id:m.id,strategy_id:m.id,key:m.id+':published',title,name:title,description:m.prompt[1],status:'draft',state:'draft',enabled:false,markets:[m.symbol],version:'0.1.0',created_at:iso(180),updated_at:iso(12)});
}
function node(id:string,kind:WorkflowNode['kind'],title:string,x:number,y:number,config:RecordData={},file:string|null=null,content=''):WorkflowNode{
 return {id,kind,title,subtitle:kind,resource:file||id,position:{x,y},config,content,binding:{file,path:file?null:[kind]},editable:true,status:'ready',description:title};
}
export function makeWorkflow(id:string):WorkflowView{
 const row=strategyRows.find(s=>s.strategy_id===id)||strategyRows[0];
 const ns=[
 node('market-data','source','4h 行情与成交量',0,0,{id:'market-data',type:'market_candles',markets:row.markets,interval:'4h',lookback:240}),
 node('market-context','source','市场结构与波动率',0,230,{id:'market-context',type:'workspace_file',path:'research/market-context.json'}),
 node('signal','script','趋势信号',320,60,{schedule:'every:15m'},'scripts/trend_signal.py','def signal(candles):\n    trend = ema(candles.close, 20) > ema(candles.close, 60)\n    return {"trend": trend, "confirmation_bars": 3}\n'),
 node('sizing','script','波动率与仓位计算',320,310,{schedule:'every:15m'},'scripts/position_size.py','def size(equity, atr):\n    risk_budget = equity * 0.005\n    return min(risk_budget / max(atr, 1), equity * 0.05)\n'),
 node('researcher','agent','市场研究员',650,0,{name:'researcher',tier:'high',allowed_skills:['analysis','web_search']},'agents/researcher.agent.md','# 市场研究员\n分析趋势、流动性与波动率，保留来源和时间范围。'),
 node('reviewer','agent','独立审阅员',650,210,{name:'reviewer',tier:'high',allowed_skills:['analysis']},'agents/reviewer.agent.md','# 独立审阅员\n核查假设、样本外验证与费用，提出可追踪的异议。'),
 node('risk_critic','agent','风险审查员',650,410,{name:'risk_critic',tier:'medium',allowed_skills:['analysis']},'agents/risk_critic.agent.md','# 风险审查员\n复核仓位与风险敞口，保留反向情景和停止条件。'),
 node('risk','risk','风险检查',960,90,{max_position_pct:5,max_drawdown_pct:4,require_stop_loss:true,approval_required:true}),
 node('strategy','strategy',row.title,1260,90,{id,title:row.title,description:row.description,mode:'paper',markets:row.markets}),
 node('account','account','研究组合',1260,280,{account_id:'paper_main',mode:'paper',max_allocation_pct:20}),
 node('schedule','scheduler','每 15 分钟检查',960,320,{enabled:row.enabled,cron:'*/15 * * * *',timezone:'Asia/Shanghai'}),
 ];
 const edge=(source:string,target:string,label:string)=>({id:source+'-'+target,source,target,label,relation:'feeds',origin:'declared' as const});
 const edges=[edge('market-data','signal','K 线'),edge('market-data','sizing','波动率'),edge('market-context','researcher','上下文'),edge('signal','researcher','信号'),edge('researcher','reviewer','研究结论'),edge('sizing','risk_critic','仓位预算'),edge('reviewer','risk_critic','交叉审查'),edge('risk_critic','risk','风险判断'),edge('risk','strategy','通过检查'),edge('strategy','account','模拟执行'),edge('schedule','signal','定时触发')];
 row.counts={script:2,agent:3,source:2,risk:1,scheduler:1,account:1};
 if(id==='eth_range_balance'){ns.find(n=>n.id==='signal')!.title='区间回归信号';ns.find(n=>n.id==='signal')!.content='def signal(candles):\n    zscore = rolling_zscore(candles.close, 30)\n    return {"revert": abs(zscore) > 2, "trend_filter": "range"}\n';}
 if(id==='macro_watch'){ns.find(n=>n.id==='signal')!.title='宏观事件筛选';ns.find(n=>n.id==='signal')!.content='def screen(events):\n    return [e for e in events if e.impact == "high"]\n';ns.find(n=>n.id==='researcher')!.title='宏观研究员';}
 const market=Object.values(capabilities.markets).find((m:any)=>m.id===id) as any;
 if(market&&id!=='btc_trend_guard'){
  ns.find(n=>n.id==='market-data')!.title=market.nodes[0][1];
  ns.find(n=>n.id==='market-data')!.config={type:id==='event_probability'?'prediction_market':id==='futures_term_structure'?'contract_data':'equity_daily',markets:row.markets,source:market.sources[1],execution:'paper',connection_boundary:market.support[1]};
  ns.find(n=>n.id==='signal')!.title=market.nodes[1][1];
  ns.find(n=>n.id==='researcher')!.title=id==='event_probability'?'事件研究员':id==='futures_term_structure'?'合约研究员':'因子研究员';
  ns.find(n=>n.id==='reviewer')!.title=id==='event_probability'?'结算规则审阅员':id==='futures_term_structure'?'保证金与换月审阅员':'样本外审阅员';
  ns.find(n=>n.id==='signal')!.content=id==='event_probability'?'def evaluate(event, evidence):\n    return {"thesis": compare_probability(event, evidence), "execution": "paper"}\n':id==='futures_term_structure'?'def evaluate(contracts):\n    return {"spread": term_structure(contracts), "roll_check": True}\n':'def rank(universe):\n    return validate_holdout(factor_rank(universe), point_in_time=True)\n';
  ns.find(n=>n.id==='risk')!.config={execution:'paper',checks:market.constraints.map((c:string[])=>c[1]),live_enabled:false};
 }
 const stages=['evidence','proposal','validation','approval','apply','observation'] as const;
 const titles=['会话与执行记录','生成改进提案','样本外验证','人工审批','版本更新','持续观察'];
 return {ok:true,strategy_id:id,revision:'rev-'+id+'-13',strategy:{id:id+':strategy',nodes:ns,edges,enabled:row.enabled},evolution:{id:id+':evolution',nodes:stages.map((kind,i)=>node(kind,kind,titles[i],i*280,0,{required:true,state:i<2?'completed':'pending'})),edges:stages.slice(1).map((s,i)=>edge(stages[i],s,'下一步')),enabled:true},manifest:{id,strategy_id:id,title:row.title,description:row.description,mode:'paper',markets:row.markets,accounts:['paper_main'],execution:{mode:'continuous'},risk:{max_position_pct:5},agents:['researcher','reviewer','risk_critic']},metadata:{version:1,nodes:{},edges:[]},legacy:false,can_edit:true,agent_defaults:{tier:'high',max_parallel:3,max_iterations:12,max_tool_calls:40,max_wall_seconds:180},source:{proposal_id:row.proposal_id,state:row.state,omitted_files:[]}};
}
const workflows=new Map(strategyRows.map(r=>[r.strategy_id,makeWorkflow(r.strategy_id)]));
const runRows=Array.from({length:8},(_,i)=>({id:'run-'+(218-i),run_id:'run-'+(218-i),strategy_id:'btc_trend_guard',status:i===0?'running':'completed',state:i===0?'running':'completed',started_at:iso(i*15),finished_at:i===0?null:iso(i*15-2),created_at:iso(i*15),trigger:'schedule',mode:'paper',duration_ms:42000+i*1700,summary:i===0?'正在核查新增信号':'趋势过滤完成，风险条件满足',output:{signal:i%3===0?'hold':'observe',confidence:0.68+i*.012},error:null}));
export const taskRows=[
 {id:'task-218',task_id:'task-218',title:'更新 BTC 趋势与流动性判断',state:'running',status:'running',session_id:'demo-research',strategy_id:'btc_trend_guard',agent:'researcher',created_at:iso(2),updated_at:iso(0),progress:0.7},
 {id:'task-217',task_id:'task-217',title:'复核策略样本外窗口',state:'completed',status:'completed',session_id:'demo-strategy',strategy_id:'eth_range_balance',agent:'reviewer',created_at:iso(36),updated_at:iso(18),progress:1},
 {id:'task-216',task_id:'task-216',title:'检查仓位上限调整提案',state:'completed',status:'completed',session_id:'demo-review',strategy_id:'btc_trend_guard',agent:'risk_critic',created_at:iso(90),updated_at:iso(67),progress:1},
];
const schedules=[{id:'morning-research',title:'每日研究简报',description:'汇总宏观与市场结构变化',kind:'agent.task',session_kind:'agent',session_mode:'reuse',session_id:'demo-research',enabled:true,paused:false,cron:'0 9 * * 1-5',timezone:'Asia/Shanghai',next_run_at:iso(-24*60),last_run_at:iso(48),payload:{title:'每日研究简报',source_request:'对比观察清单的变化，交给审阅员复核后生成日报。',attached_skills:['analysis','web_search']}},{id:'risk-review',title:'策略运行复盘',kind:'agent.task',session_kind:'agent',session_mode:'reuse',session_id:'demo-review',enabled:true,paused:false,every_seconds:14400,timezone:'Asia/Shanghai',next_run_at:iso(-120),last_run_at:iso(120),payload:{title:'策略运行复盘',source_request:'检查最近会话记录、风险约束和待审批提案。'}}];
export const proposals:RecordData[]=[{id:'proposal-014',proposal_id:'proposal-014',kind:'strategy_config_patch',status:'pending',state:'pending',strategy_id:'btc_trend_guard',title:'降低波动扩张阶段的仓位上限',summary:'将单笔仓位从 8% 收紧至 5%，提高信号确认次数。',reason:'最近 18 个模拟会话中，短暂突破贡献了大部分回撤。',created_at:iso(65),updated_at:iso(20),scope:'strategy',validation:{ok:true,blockers:[],warnings:[]},before:{max_position_pct:8,signal_confirmation:1},after:{max_position_pct:5,signal_confirmation:3}}];
const items=[{id:'approval-014',type:'approval',kind:'evolution',title:'仓位上限调整待审阅',summary:'趋势跟随策略：8% → 5%，附验证报告与回滚快照。',severity:'warn',status:'pending',requires_action:true,read:false,created_at:iso(20),href:'/self-evolution?tab=proposals',actions:[{id:'review',label:'查看提案',href:'/self-evolution?tab=proposals'}],source_refs:[]},{id:'report-218',type:'report',kind:'task',title:'研究简报已更新',summary:'研究员与审阅员已完成交叉核查，仍有 2 项待验证假设。',severity:'info',status:'completed',requires_action:false,read:false,created_at:iso(8),href:'/chat/demo-research',actions:[],source_refs:[]}];
const envelope=(data:RecordData)=>({ok:true,status:'ok',severity:'info',summary:'',primary_action:null,next_actions:[],source_refs:[],debug_refs:[],data});
const memories=[['position-cap','decision','波动扩张阶段的单笔仓位上限保持为 5%，需要独立审查后才能修改。'],['source-freshness','learning','比较市场数据时必须对齐时间窗口；缺少成交量时不要推断确认强度。'],['review-context','preference','保留研究员与审阅员的分歧，不要求人为达成一致。']].map(([key,category,content],i)=>({scope:'global',strategy_id:'',workflow_id:'',memory_id:'memory-'+i,stable_key:key,category,content,source_ref:'session/demo-review',evidence_refs:['reports/research-brief.html'],updated_at:NOW/1000-i*3600}));
const account={profile:{id:'paper_main',mode:'paper',venue:'local',kind:'paper',provider_spec:'local',base_currency:'USD',subaccount:'Research',status:'active',live_trading_enabled:false,initial_balance_usd:100000,permissions:{read_balances:true,place_order:true,cancel_order:true,withdraw:false},limits:{max_position_pct:5},credentials:{},wallet_id:''},snapshot:{snapshot_id:'snapshot-218',account_id:'paper_main',ts:NOW/1000,health:'ok',total_usd:102430.75,free_usd:84640,available_usd:84640,positions_value_usd:17790.75,latency_ms:18,source:'paper'},reserved_usd:0,open_positions:[],open_position_count:2,protections:[],protection_count:2,active_executors:[],bound_strategies:strategyRows.slice(0,2),bound_strategy_count:2};
let killSwitch=false;
function candles(){return Array.from({length:96},(_,i)=>{const close=63800+i*7+Math.sin(i*.42)*360+Math.cos(i*.12)*620;return {time:Math.floor(NOW/1000)-(96-i)*3600,ts:Math.floor(NOW/1000)-(96-i)*3600,open:close-75*Math.cos(i),high:close+130,low:close-160,close,volume:320+Math.abs(Math.sin(i))*280};});}
export function richResponse(path:string,q:URLSearchParams,body:RecordData,method:string):RecordData|null{
 const id=String(q.get('strategy_id')||body.strategy_id||'btc_trend_guard');
 if(path==='/strategies/runtime/workflows')return {ok:true,workflows:strategyRows,total:strategyRows.length};
 if(path==='/strategies/runtime/workflow')return workflows.get(id)||makeWorkflow(id);
 if(path==='/strategies/runtime/workflow/check')return {ok:true,schema:'workflow-verification/v1',target:{strategy_id:id,proposal_id:null,state:'paper',revision:'rev-'+id+'-13',source_revision:'rev-'+id+'-13',checked_at:iso()},validation:{ok:true,scope:'strategy',blockers:[],warnings:[]},replay:{status:'sample',id:'replay-018',metrics:{trades:46,windows:5}},sources:[],report_warnings:[],operation:{state:'paper',installed_schedules:[]},mode:'paper',evaluation_mode:'paper',next_step:'review',unverified:[]};
 if(path==='/strategies/runtime/workflow/propose'){
  const workflow=workflows.get(id)||makeWorkflow(id);for(const change of body.changes||[]){const n=workflow.strategy.nodes.find(n=>n.id===change.node_id)||workflow.evolution.nodes.find(n=>n.id===change.node_id);if(n){if(change.config!==undefined)n.config=change.config;if(change.content!==undefined)n.content=change.content;}}
  if(body.metadata)workflow.metadata=body.metadata;workflow.revision='rev-'+id+'-'+Date.now();workflow.source={proposal_id:'proposal-'+Date.now(),state:'pending',omitted_files:[]};workflows.set(id,workflow);
  return {ok:true,strategy_id:id,proposal_id:workflow.source.proposal_id,state:'pending',workflow,validation:{ok:true,blockers:[]}};
 }
 if(path==='/strategies/runtime/service/status')return {ok:true,state:strategyRows.find(s=>s.strategy_id===id)?.enabled?'running':'stopped',connection:'connected',agent_active:false,queue_depth:0,accepted_events:218,rejected_events:3,restart_count:0,last_message_at:NOW/1000,last_event:{event_id:'evt-218',status:'processed',session_id:'demo-research'}};
 if(path==='/strategies/runtime/status')return {ok:true,strategy_id:id,status:'paper',package_hash:'sha256-'+id,manifest:(workflows.get(id)||makeWorkflow(id)).manifest};
 if(/^\/strategies\/runtime\/service\/(start|stop)$/.test(path)){const row=strategyRows.find(s=>s.strategy_id===id);if(row)row.enabled=path.endsWith('start');return {ok:true,state:row?.enabled?'running':'stopped',connection:'connected'};}
 if(path==='/strategies/runtime/runs')return {ok:true,runs:runRows,total:8,count:8};
 if(path==='/strategies/runtime/agent_tasks')return {ok:true,tasks:taskRows,total:3,count:3};
 if(path==='/strategies/runtime/agent_task')return {ok:true,task:taskRows[0],events:[],prompt:'分析趋势强度、波动扩张与风险敞口，输出可审查的判断。'};
 if(['/strategy/list','/strategy/list_all','/strategies'].includes(path))return {ok:true,strategies:strategyRows,count:strategyRows.length};
 if(path==='/strategy/rename'){const r=strategyRows.find(s=>s.strategy_id===id);if(r)r.title=String(body.title);return {ok:true};}
 if(path==='/triggers/schedules')return {ok:true,schedules,total:schedules.length};
 if(path==='/triggers/schedules/status')return {ok:true,statuses:schedules.map(s=>({id:s.id,enabled:s.enabled,paused:s.paused,last_run_ts:NOW/1000-3000,next_run_ts:NOW/1000+3600,state:s.paused?'paused':'scheduled'}))};
 if(/^\/triggers\/schedules\/(pause|resume|run_now|update|remove)$/.test(path)){
  const s=schedules.find(s=>s.id===body.id);if(!s)return {ok:false,error:'Schedule not found'};
  if(path.endsWith('pause')){s.paused=true;s.enabled=false;}if(path.endsWith('resume')){s.paused=false;s.enabled=true;}if(path.endsWith('update'))Object.assign(s,body.schedule||body);
  if(path.endsWith('remove'))schedules.splice(schedules.indexOf(s),1);
  return {ok:true,id:s.id,schedule:s,status:s.paused?'paused':'scheduled',accepted:true,result:{session_id:s.session_id}};
 }
 if(path==='/triggers/routes')return {ok:true,routes:[]};
 if(path==='/agent/tasks')return envelope({tasks:taskRows.map((r,i)=>({...r,status:i===0?'in_progress':'done',severity:'info',last_action:i===0?'cross_check':'completed',turn_count:3,skills_invoked:['analysis','filesystem'],meta:{},active_turn_ids:i===0?['turn-218']:[],failed_turn_ids:[]})),count:taskRows.length,counts:{in_progress:1,done:2,failed:0,empty:0}});
 if(path==='/agent/tasks/timeline')return envelope({task_id:q.get('id'),correlator:{session_id:'demo-research'},surfaces:['agent','filesystem'],events:runRows.slice(0,3).map(r=>({surface:'agent',ts:r.created_at,record:{action:'analysis',summary:r.summary}}))});
 if(path==='/agent/tasks/artifacts')return envelope({task_id:q.get('id'),counts:{files:1,messages:1,orders:0,created:0,memory:0},artifacts:{files:[{ts:iso(),action:'write_file',path:'reports/research-brief.html'}],messages:[{ts:iso(),channel:'workspace',text:'研究简报已更新'}],orders:[],created:[],memory:[]}});
 if(path.startsWith('/agent/tasks/')||path==='/agent/task/timeline')return envelope({task:taskRows[0],timeline:runRows.slice(0,3).map((r,i)=>({id:r.id,title:r.summary,kind:'progress',ts:r.created_at,summary:r.summary})),events:[],artifacts:[{path:'reports/market-brief.html',title:'市场结构简报'}]});
 if(path==='/inbox/items')return envelope({items,counts:{total:2,unread:2,actionable:1}});
 if(path==='/inbox/resolve'){const item=items.find(i=>i.id===body.item_id);if(item)item.read=true;return envelope({resolved:true,items});}
 if(path==='/operator/overview')return envelope({health:{live_trading:false,kill_switch:false,llm_ready:true,trading_account:true,strategies:true},portfolio:{equity_usd:102430.75,realized_usd:1642.5,unrealized_usd:788.25,positions:3},attention:items,activity:taskRows,counts:{strategies:3,running:1,pending_approvals:1},runtime:{mode:'paper'}});
 if(path==='/setup/readiness')return envelope({ready:true,overall:'ready',checks:[],blockers:[],warnings:[],counts:{ready:5,total:5}});
 if(path==='/accounts/list')return {accounts:[account],count:1,ts:NOW/1000};
 if(path==='/accounts/get')return {ok:true,account};
 if(path==='/portfolio/health')return {accounts:[{...account,account_id:'paper_main',mode:'paper',venue:'local',kind:'paper',live_trading_enabled:false}],totals:{accounts:1,live_accounts:0,open_positions:2,active_protections:2,active_executors:0,reserved_usd:0},ts:iso()};
 if(path==='/wallet/portfolio')return {accounts:[]};
 if(path==='/kill_switch/get')return {kill_switch:killSwitch,live_trading_enabled:false,ts:iso()};
 if(path==='/kill_switch/set'){killSwitch=!!body.enabled;return {ok:true,kill_switch:killSwitch,live_trading_enabled:false,ts:iso()};}
 if(path==='/portfolio/summary')return {ok:true,accounts:[{id:'paper_main',mode:'paper',live_trading_enabled:false,cash_usd:84640,equity_usd:102430.75,positions:{BTC:{symbol:'BTC/USDT',quantity:.15},ETH:{symbol:'ETH/USDT',quantity:2.5}},trade_count:46,fees_paid_usd:42.6}],totals:{cash_usd:84640,equity_usd:102430.75},mode:'paper',ts:iso()};
 if(path==='/portfolio/positions')return {positions:[{symbol:'BTC/USDT',market:'BTC/USDT',side:'long',quantity:.15,size:.15,avg_price:63480,mark_price:64280,value_usd:9642,unrealized_pnl:120,mode:'paper',account_id:'paper_main',strategy_id:'btc_trend_guard'},{symbol:'ETH/USDT',market:'ETH/USDT',side:'long',quantity:2.5,size:2.5,avg_price:3080,mark_price:3138,value_usd:7845,unrealized_pnl:145,mode:'paper',account_id:'paper_main',strategy_id:'eth_range_balance'}],count:2};
 if(path==='/portfolio/pnl')return {realized_usd:1642.5,unrealized_usd:788.25,total_usd:2430.75};
 if(path==='/portfolio/equity_curve'||path==='/accounts/equity_curve')return {ok:true,points:Array.from({length:30},(_,i)=>({ts:path.startsWith('/accounts')?Math.floor(NOW/1000)-(30-i)*86400:new Date(NOW-(30-i)*86400000).toISOString(),time:Math.floor(NOW/1000)-(30-i)*86400,equity_usd:100000+i*83+Math.sin(i*.8)*240,nav_usd:100000+i*83+Math.sin(i*.8)*240})),equity_usd:102430.75,mode:'paper'};
 if(path==='/market/candles')return {candles:candles(),symbol:q.get('symbol')||'BTCUSDT',interval:'1h'};
 if(path==='/market/venues')return {venues:[{name:'research',label:'研究数据'}]};
 if(path==='/trading/recent_trades')return {trades:Array.from({length:6},(_,i)=>({strategy_id:i%2?'eth_range_balance':'btc_trend_guard',ts:iso(24+i*53),market:i%2?'ETH/USDT':'BTC/USDT',side:i%3?'buy':'sell',type:'limit',size:i%2?.5:.025,price:i%2?3124+i*4:64180+i*22,fee_usd:1.2,status:'filled',order_id:'paper-order-'+(310-i)}))};
 if(path==='/search/engines/status')return {ok:true,engines:['workspace'],region:'global',safesearch:'moderate',supported:['workspace'],keyless:['workspace'],base_url_engines:[],engine_status:[{engine:'workspace',name:'Workspace index',label:'工作区检索',usable:true,enabled:true,key_counts:{total:0,enabled:0,valid:0,invalid:0},ready:true}],usable_in_chain:1,workspace_path:'research-workspace'};
 if(path==='/evolution/proposals')return {ok:true,proposals,count:proposals.length};
 if(path==='/evolution/timeline')return {ok:true,timeline:proposals.map(p=>({...p,id:p.id,title:p.title,summary:p.summary,created_at:p.created_at,stage:'review',source_refs:[],events:[],proposal:p})),count:proposals.length};
 if(path==='/evolution/proposal')return {ok:true,...proposals[0],proposal:proposals[0],files:[]};
 if(path==='/memory/profile')return envelope({profile:{name:'Research workspace'},facts:[{id:'fact-1',key:'risk.max_position_pct',value:'5%',source:'operator_review'},{id:'fact-2',key:'research.require_independent_review',value:true,source:'operator'}],preferences:[],rules:[]});
 if(path==='/memory/status')return {ok:true,enabled:true,backend:'sqlite',counts:{facts:28,reflections:12,sessions:46},profiles:[]};
 if(path==='/memory/domains')return {ok:true,domains:[{scope:'global',strategy_id:'',workflow_id:''},...strategyRows.map(s=>({scope:'strategy',strategy_id:s.strategy_id,workflow_id:''}))]};
 if(path==='/memory/records')return {ok:true,records:memories.filter(m=>!body.query||m.content.includes(body.query)),count:memories.length};
 if(path==='/memory/capture'){const record=memories.find(m=>m.memory_id===body.expected_memory_id);if(record){record.content=String(body.content);record.updated_at=Date.now()/1000;}else memories.push({scope:body.scope||'global',strategy_id:body.strategy_id||'',workflow_id:'',memory_id:'memory-'+Date.now(),stable_key:body.key,category:body.category,content:body.content,source_ref:'operator',evidence_refs:[],updated_at:Date.now()/1000});return {ok:true};}
 if(path==='/memory/forget'){const i=memories.findIndex(m=>m.stable_key===body.key||m.memory_id===body.memory_id);if(i>=0)memories.splice(i,1);return {ok:true};}
 return null;
}
