(function(root){
  const markets={
    crypto:{label:['Crypto','加密货币'],icon:'₿',symbol:'BTC / USDT',id:'btc_trend_guard',title:['BTC trend strategy','BTC 趋势策略'],prompt:['Build a BTC trend strategy. Let a researcher and a reviewer challenge each other; define risk limits and live execution requirements.','构建 BTC 趋势策略，让研究员和审阅员交叉质疑，明确风控限额与实盘执行条件。'],sources:['CCXT · Binance / Bybit / OKX','CCXT · Binance / Bybit / OKX'],nodes:[['Market feed','行情输入'],['Trend signal','趋势信号'],['Agent review','团队审阅'],['Risk Gate','风险检查'],['Execution review','执行审核']],constraints:[['Position budget','仓位预算'],['Fees & slippage','费用与滑点'],['Signal confirmation','信号确认']],artifact:'btc_trend_guard / strategy.yml',support:['Existing CCXT bridge. Live execution requires a configured account, supported order lifecycle, risk checks and approval.','已有 CCXT 桥接。实盘还需账户配置、完整订单生命周期、风控及审批。'],stage:['Research → risk review → live execution','研究 → 风控审查 → 实盘执行']},
    prediction:{label:['Prediction markets','预测市场'],icon:'◒',symbol:'EVENT / YES–NO',id:'event_probability',title:['Event probability strategy','事件概率策略'],prompt:['Research an event contract. Compare implied probability, source evidence and resolution rules before building the strategy.','研究一个事件合约，对比隐含概率、来源证据和结算规则，再构建策略。'],sources:['Polymarket · CLOB + Gamma','Polymarket · CLOB + Gamma'],nodes:[['Event contract','事件合约'],['Evidence review','证据核查'],['Probability thesis','概率判断'],['Resolution checks','结算检查'],['Strategy validation','策略验证']],constraints:[['Resolution rules','结算规则'],['Liquidity','流动性'],['Evidence freshness','证据时效']],artifact:'event_probability / thesis.md',support:['Market, order-book and balance reads are available. Live order placement is not currently enabled; the signing path still needs validation.','已有行情、订单簿与余额读取。当前未启用实盘下单，签名链路仍需验证。'],stage:['Event research → strategy validation','事件研究 → 策略验证']},
    futures:{label:['Futures','期货'],icon:'↗',symbol:'CONTRACT / TERM',id:'futures_term_structure',title:['Futures term structure','期货期限结构策略'],prompt:['Build a futures term-structure strategy with separate contract, expiry, margin and risk checks. Import an existing VNpy strategy if available.','构建期货期限结构策略，分别检查合约、到期、保证金和风险；有 VNpy 策略时沿用现有代码。'],sources:['VNpy compatibility · IBKR data · Tushare','VNpy 兼容 · IBKR 数据 · Tushare'],nodes:[['Contract data','合约数据'],['Term structure','期限结构'],['CTA strategy','CTA 策略'],['Margin & roll','保证金与换月'],['Replay validation','回放验证']],constraints:[['Contract metadata','合约规格'],['Expiry & roll','到期与换月'],['Margin budget','保证金预算']],artifact:'futures_term_structure / cta_strategy.py',support:['VNpy strategy import and replay are supported. Broker execution is a separate capability; the current IBKR connector does not advertise order placement.','支持 VNpy 策略导入与回放。券商执行是独立能力，当前 IBKR 连接器未声明下单支持。'],stage:['CTA import → replay → validation','CTA 导入 → 回放 → 验证']},
    equities:{label:['A-shares','A 股'],icon:'沪',symbol:'A-SHARES / DAILY',id:'ashare_factor_rotation',title:['A-share factor rotation','A 股因子轮动'],prompt:['Build an A-share factor rotation strategy. Separate data quality, factor research and holdout validation; encode the applicable trading calendar and rules.','构建 A 股因子轮动策略，分别检查数据质量、因子研究与样本外验证，并明确适用的交易日历和交易规则。'],sources:['Tushare · AkShare','Tushare · AkShare'],nodes:[['Equity dataset','股票数据'],['Factor research','因子研究'],['Independent review','独立复核'],['Calendar & rules','日历与规则'],['Portfolio validation','组合验证']],constraints:[['Adjustment method','复权口径'],['Look-ahead checks','未来数据检查'],['Execution constraints','交易约束']],artifact:'ashare_factor_rotation / research.ipynb',support:['A-share data sources support research and strategy construction. A live broker gateway is not established by data-source support alone.','A 股数据源用于研究和策略构建。数据源接入不等于已具备实盘券商网关。'],stage:['Data → factors → holdout → validation','数据 → 因子 → 样本外 → 验证']}
  };
  const collaboration=[
    {role:'lead',name:['Coordinator','协调者'],state:['Assigning the question','拆解研究问题'],message:['Research the trend and collect opposing evidence. Keep each member’s context.','研究趋势，收集反向证据，保留成员各自的上下文。'],artifact:'research/plan.md'},
    {role:'researcher',name:['Researcher','研究员'],state:['Working in parallel','并行研究'],message:['The trend is positive, but volume has not confirmed it. I recorded the gap on the board.','趋势偏强，量能尚未确认。我已在共享黑板上记录缺口。'],artifact:'evidence/market-context.json'},
    {role:'reviewer',name:['Reviewer','审阅员'],state:['Cross-checking disagreement','交叉核查分歧'],message:['Check the counterexample before adding exposure. Ask the researcher for the missing volume evidence.','增加敞口前先检查反例，请研究员补充量能证据。'],artifact:'review/counter-evidence.md'},
    {role:'risk',name:['Risk critic','风控审查员'],state:['Preparing the handoff','汇总并交接'],message:['Submit the strategy package with risk limits, disagreements and open questions for review.','提交策略包供审查，附上风险限额、分歧和待验证问题。'],artifact:'strategy/candidate-v1.3.3'}
  ];
  const evolution=[
    {label:['Observe','观察'],title:['Check the session record','检查会话记录'],body:['The researcher checks decisions, fills and rejected signals against the run record.','研究员对照运行记录，核查决策、成交和被拒绝的信号。'],file:'sessions/paper-018.jsonl'},
    {label:['Reflect','反思'],title:['Record the cause','记录原因'],body:['The agent records the cause in strategy memory. The execution configuration stays unchanged.','Agent 将原因写入策略记忆，运行配置保持不变。'],file:'memory/strategy-findings.md'},
    {label:['Propose','提案'],title:['Prepare the configuration change','准备配置变更'],body:['The coding agent stages a lower position limit and additional signal confirmation.','代码 Agent 暂存新的仓位上限和信号确认条件。'],file:'proposals/014/candidate.diff'},
    {label:['Validate','验证'],title:['Validate the candidate','验证候选版本'],body:['Check the schema and replay results, risk limits and rollback snapshot.','检查结构、回放结果、风险限制和回滚快照。'],file:'validation/report.json'},
    {label:['Review','审查'],title:['Review and apply','审核与应用'],body:['Approve or return the candidate. After approval, choose whether to apply it.','你可以批准或退回候选；批准后再选择是否应用。'],file:'review/operator-decision'}
  ];
  function adapterPlan(prompt){
    const input=String(prompt||'').trim();
    if(input.length<8)return {ok:false,error:'short'};
    if(input.length>400)return {ok:false,error:'long'};
    const known=['Binance','Bybit','OKX','Hyperliquid'];
    const existing=known.find(n=>input.toLowerCase().includes(n.toLowerCase()));
    const target=existing||(input.match(/(?:适配|接入|连接|integrate|connect|adapt)\s+([A-Za-z][\w-]{1,40})/i)||[])[1]||'CustomVenue';
    return {ok:true,target,route:existing?'reuse':'author',files:existing?['provider-alias.json','capabilities.json','validation-plan.md']:['provider.py','capabilities.json','tests/test_contract.py','review-checklist.md'],liveEnabled:false,validation:'required'};
  }
  function evolve(state,action){
    if(action==='reset')return {step:0,decision:null,version:'1.3.2',validated:false};
    if(action==='next')return {...state,step:Math.min(4,state.step+1),validated:state.validated||state.step===3};
    if(action==='back')return {...state,step:Math.max(0,state.step-1),decision:null,version:'1.3.2',validated:false};
    if(action==='approve'&&state.step===4&&state.validated)return {...state,decision:'approved'};
    if(action==='apply'&&state.decision==='approved'&&state.validated)return {...state,decision:'applied',version:'1.3.3'};
    if(action==='reject'&&state.step===4)return {...state,decision:'revision',version:'1.3.2'};
    if(action==='rollback'&&state.decision==='applied')return {...state,decision:'rolled-back',version:'1.3.2'};
    return state;
  }
  const data={markets,collaboration,evolution,adapterPlan,evolve};
  if(typeof module!=='undefined'&&module.exports)module.exports=data;else root.NeryaCapabilities=data;
})(typeof window!=='undefined'?window:globalThis);
