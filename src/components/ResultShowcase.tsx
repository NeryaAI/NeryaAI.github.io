import React, {type CSSProperties} from 'react';
import {cn} from '@/lib/utils';
import Copy from './Copy';
import Icon from './Icon';



const tabs = [['strategy','策略','Strategy'],['backtest','回测','Backtest'],['market','行情','Market'],['research','投研','Research']];
const curve = 'M0 146 L18 144 L36 152 L54 138 L72 140 L90 126 L108 133 L126 112 L144 117 L162 98 L180 108 L198 80 L216 89 L234 69 L252 76 L270 55 L288 62 L306 38 L324 49 L342 27 L360 37 L378 18 L396 25 L420 10';
const candles = [70,76,64,84,91,88,103,115,106,97,118,131,124,145,156,147,166,158,174,189,184,202,193,216];

export default function ResultShowcase(){

return <><div className="result-showcase" id="results" data-results>
  <div className="result-topline"><span><i className="signal-dot" /> NERYA <span className="result-desk">/ AGENT OUTPUT</span></span><Copy className="sample-badge" zh="交互示例" en="Interactive sample" /></div>
  <div className="result-tabs" role="tablist" aria-label="成果类型 / Output type">
    {tabs.map(([id,zh,en],i)=><button key={id} id={`result-tab-${id}`} role="tab" aria-selected={i===0?'true':'false'} aria-controls={`result-${id}`} tabIndex={i===0?0:-1} data-result-tab={id}><span className="result-tab-index">0{i+1}</span><Copy zh={zh} en={en} /></button>)}
  </div>
  <div className="result-panels">
    <section id="result-strategy" role="tabpanel" tabIndex={0} aria-labelledby="result-tab-strategy" data-result-panel="strategy">
      <div className="result-heading"><div><Copy className="result-kicker" zh="策略草稿 · 可以继续改" en="STRATEGY DRAFT · READY FOR ANOTHER PASS" /><Copy as="h2" zh="BTC 趋势跟随" en="BTC trend guard" /></div><span className="result-mark"><Icon name="workflow" size={26} /></span></div>
      <p className="result-description"><Copy zh="根据趋势与波动设置买卖条件，单次持仓上限为 5%" en="Use trend and volatility to define trades, with a 5% position cap" /></p>
      <div className="strategy-pipeline">
        {[['clock','运行频率','Schedule'],['candles','行情数据','Market data'],['code','买卖规则','Trading rules'],['shield','仓位限制','Position limits']].map(([icon,zh,en],i)=><div key={icon} className="pipeline-node" style={{ '--node': i } as CSSProperties}><span><Icon name={icon} size={19} /></span><Copy zh={zh} en={en} /></div>)}
      </div>
      <div className="strategy-rules"><div><Copy zh="看什么" en="WHAT TO READ" /><Copy as="strong" zh="趋势 + 波动" en="Trend + volatility" /></div><div><Copy zh="最多持有" en="MAX POSITION" /><strong>5<span>%</span></strong></div><div><Copy zh="运行方式" en="RUN MODE" /><strong><Copy zh="纸面演练" en="Paper" /></strong></div></div>
      <div className="review-line"><img src="/assets/agent-avatars/reviewer.png" alt="" width="25" height="25" /><Copy zh="审阅员：行情变剧烈时，先别加仓" en="Reviewer: wait before adding when the market turns violent" /></div>
      <button className="result-link" data-open-agent="/strategies?strategy_id=btc_trend_guard"><Copy zh="打开这条策略" en="Open this strategy" /><Icon name="arrowUpRight" size={16} /></button>
    </section>
    <section id="result-backtest" role="tabpanel" tabIndex={0} aria-labelledby="result-tab-backtest" data-result-panel="backtest" hidden>
      <div className="result-heading"><div><Copy className="result-kicker" zh="回测报告 · 示例数据" en="BACKTEST REPORT · SAMPLE DATA" /><Copy as="h2" zh="查看历史收益、回撤与交易次数" en="Review historical returns, drawdown and trades" /></div><span className="result-mark"><Icon name="chart" size={25} /></span></div>
      <div className="backtest-metrics"><div><Copy zh="这段时间的结果" en="PERIOD RESULT" /><strong className="positive">+12.8<span>%</span></strong></div><div><Copy zh="最大跌幅" en="LARGEST DROP" /><strong>−4.2<span>%</span></strong></div><div><Copy zh="做了几次交易" en="TRADES" /><strong>64</strong></div></div>
      <svg className="result-chart" viewBox="0 0 420 175" role="img" aria-label="示例回测净值曲线 / Sample backtest equity curve"><defs><linearGradient id="equity-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="currentColor" stopOpacity=".2"/><stop offset="100%" stopColor="currentColor" stopOpacity="0"/></linearGradient></defs><g className="chart-grid"><path d="M0 25H420 M0 75H420 M0 125H420 M0 174H420"/></g><path className="chart-area" d={`${curve} L420 175 L0 175Z`} fill="url(#equity-fill)"/><path className="chart-benchmark" d="M0 146 L50 150 L100 142 L150 143 L200 130 L250 125 L300 128 L350 119 L420 113"/><path className="chart-line" d={curve} pathLength="1"/><circle cx="420" cy="10" r="4" fill="currentColor"/></svg>
      <div className="chart-legend"><span><i/><Copy zh="策略净值" en="Strategy equity" /></span><span><i/><Copy zh="对照基准" en="Benchmark" /></span><Copy zh="180 天 · 含费用与滑点" en="180 days · Fees & slippage included" /></div>
      <a className="result-link" href="/docs.html#artifacts"><Copy zh="查看回测输出说明" en="Read the backtest output guide" /><Icon name="arrowUpRight" size={16} /></a>
    </section>
    <section id="result-market" role="tabpanel" tabIndex={0} aria-labelledby="result-tab-market" data-result-panel="market" hidden>
      <div className="result-heading"><div><Copy className="result-kicker" zh="行情卡片 · 历史示意" en="MARKET CARD · ILLUSTRATIVE SNAPSHOT" /><h2>BTC / USDT</h2></div><span className="market-interval">4H</span></div>
      <div className="market-price"><strong>84,320<span>.50</span></strong><span className="positive">+2.34%</span><Copy zh="非实时行情" en="Not a live quote" /></div>
      <svg className="result-chart candle-preview" viewBox="0 0 420 175" role="img" aria-label="示例 K 线与均线 / Illustrative candles and signal overlay"><g className="chart-grid"><path d="M0 25H420 M0 75H420 M0 125H420 M0 174H420"/></g>{candles.map((n,i)=>{const up=i===0||n>candles[i-1];const y=165-n*.62;return <g key={i} className={cn(['candle',up?'up':'down'])} style={{ '--candle': i } as CSSProperties}><line x1={i*17+7} y1={y-12} x2={i*17+7} y2={y+23}/><rect x={i*17+3} y={y} width="8" height={10+i%4*3} rx="1"/></g>;})}<path className="moving-average" d="M5 138 C45 145 50 127 88 124 S145 122 171 104 S225 85 260 72 S310 59 345 54 S382 47 413 32"/></svg>
      <div className="market-indicators"><span><Copy zh="持仓变化" en="Position change" /> <b>+2.8%</b></span><span><Copy zh="波动状态" en="Volatility" /> <b><Copy zh="较高" en="High" /></b></span><span><Copy zh="资金费率偏离" en="Funding skew" /> <b>+0.013%</b></span></div>
      <button className="result-link" data-open-agent="/chat/demo-research"><Copy zh="在投研上下文中查看" en="Explore in research context" /><Icon name="arrowUpRight" size={16} /></button>
    </section>
    <section id="result-research" role="tabpanel" tabIndex={0} aria-labelledby="result-tab-research" data-result-panel="research" hidden>
      <div className="result-heading"><div><Copy className="result-kicker" zh="投研报告 · 多角色审阅" en="RESEARCH BRIEF · MULTIPLE VIEWS" /><Copy as="h2" zh="趋势还在，先别急着下结论" en="The trend is there. Do not rush the conclusion." /></div></div>
      <div className="report-authors"><span className="avatar-stack">{['researcher','reviewer','risk'].map(role=><img key={role} src={`/assets/agent-avatars/${role}.png`} width="25" height="25" alt="" />)}</span><Copy zh="研究员 / 审阅员 / 风控" en="Researcher / Reviewer / Risk" /></div>
      <div className="report-excerpt"><span className="report-number">01</span><div><Copy as="h3" zh="先说判断" en="The read" /><Copy as="p" zh="4h 趋势结构还在，但突破量能没有跟上。先观察，不急着加仓。" en="The 4h structure is still there, but breakout volume has not followed. Keep watching before adding exposure." /></div></div>
      <div className="report-excerpt"><span className="report-number">02</span><div><Copy as="h3" zh="再说分歧" en="The disagreement" /><Copy as="p" zh="研究员偏向趋势延续，审阅员想再看几根 K 线。连续两根收盘跌回区间，就重新评估。" en="The researcher leans toward continuation. The reviewer wants a few more bars. Reassess after two closes back inside the range." /></div></div>
      <button className="result-link" id="open-research-report"><Copy zh="阅读完整投研报告" en="Read the full research brief" /><Icon name="arrowUpRight" size={16} /></button>
    </section>
  </div>
</div>
<dialog id="research-report" className="research-report" aria-labelledby="research-report-title">
  <div className="report-toolbar"><span>NERYA / RESEARCH DESK</span><button id="close-research-report" className="icon-button" aria-label="关闭报告 / Close report"><Icon name="x" size={21}/></button></div>
  <div className="report-paper"><Copy className="result-kicker" zh="投研报告示例 · 非投资建议" en="SAMPLE RESEARCH BRIEF · NOT INVESTMENT ADVICE" /><Copy as="h2" id="research-report-title" zh="BTC 市场结构与风险观察" en="BTC market structure & risk review" /><Copy as="p" className="report-summary" zh="结论：保持观察。趋势结构与量能证据尚未形成一致确认，不建议仅凭单一信号增加风险。" en="Conclusion: keep observing. Structure and volume have not converged. A single signal is insufficient to justify more risk." />
  {[
    ['01','研究范围','Research scope','对比 4h 趋势与 1h 执行窗口，检查持仓量、资金费率偏离、波动状态与仓位约束。本页数值为界面示例，未进行实时数据采集或模型执行。','Compare the 4h trend with a 1h execution window, using open interest, funding skew, volatility regime and position constraints. This page uses illustrative values; no live data fetch or model run was performed.'],
    ['02','证据与来源','Evidence & sources','正式报告应逐项附上数据源、采样窗口、时间戳、原始链接或产物 ID。本示例沿用官网演示中的 持仓量变化、资金费率偏离与 ATR 波动状态框架，不伪造外部来源。','A real brief should attach a source, sampling window, timestamp and original link or artifact ID to each claim. This sample uses the tour’s open-interest delta, funding skew and ATR-regime framework without inventing external citations.'],
    ['03','情景分析','Scenario analysis','基准情景：等待量能确认后重评。上行情景：结构与量能同时确认仍须通过风控。下行情景：连续两根收盘跌回区间，撤销原判断并重新研究。','Base case: wait for volume confirmation. Upside: structure and volume align, but risk checks still apply. Downside: two closes below the range invalidate the thesis and trigger new research.'],
    ['04','独立审阅与分歧','Independent review & dissent','研究员倾向于趋势延续；审阅员认为量能证据不足；风控要求波动扩张时不得提高敞口。报告保留不同意见，而不是把它们压成一致结论。','The researcher favors continuation; the reviewer finds volume evidence insufficient; the risk reviewer forbids increasing exposure during volatility expansion. The brief preserves disagreement rather than manufacturing consensus.'],
    ['05','失效条件与下一步','Invalidation & next steps','检查后续三根已完成 K 线；保留 5% 仓位上限的示例约束；只在证据窗口更新后重评。回测、模拟执行和真实订单属于不同阶段，不从报告自动跳到下单。','Review the next three completed bars; retain the sample 5% position cap; reassess when the evidence window updates. Backtesting, paper execution and live orders are separate stages; this report does not place orders.'],
  ].map(([n,zh,en,bodyZh,bodyEn])=><section key={n} className="full-report-section"><span>{n}</span><div><Copy as="h3" zh={zh} en={en}/><Copy as="p" zh={bodyZh} en={bodyEn}/></div></section>)}
  <a className="button" href="/docs.html#artifacts"><Copy zh="阅读产物与报告接入文档" en="Read the artifact integration guide"/><Icon name="arrowUpRight" size={16}/></a></div>
</dialog></>;
}
