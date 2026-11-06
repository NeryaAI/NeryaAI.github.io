import React, {type CSSProperties} from 'react';
import {cn} from '@/lib/utils';
import Copy from './Copy';
import Icon from './Icon';
import NativePart from './NativePart';






const titles = {
  strategy: ['Super Agent 生成第一版策略', 'Super Agent builds version one'],
  team: ['Super Agent 调度量化团队', 'Super Agent runs the quant team'],
  evolution: ['策略从结果中继续进化', 'The strategy evolves from results'],
  vault: ['API 密钥，交给 Vault 保管', 'Keep your API keys in Vault'],
  markets: ['查看各类市场研究示例', 'Explore market research examples'],
  integrations: ['准备数据接口接入方案', 'Plan a data API integration'],
};


export default function ProductStory({feature}: {feature: {id:string;steps: ReadonlyArray<{zh:string;en:string}>}}){
const id=feature.id; const title=titles[id as keyof typeof titles];
return <><figure className={cn(['product-story', `story-${id}`])} data-story={id} data-paused="true" data-chapter="0" aria-label={`${title[0]} / ${title[1]}`}>
  <div className="story-stage">
    <div className="scene-grid" aria-hidden="true"></div>
    {id === 'strategy' && <div className="strategy-scene scene-composition">
      <div className="scene-prompt phase-one"><img src="/assets/nerya-logo.webp" width="26" height="26" alt=""/><Copy zh="研究 BTC 趋势，做一套能继续进化的策略" en="Research the BTC trend and build a strategy that can keep evolving" /><span className="prompt-cursor" aria-hidden="true"/></div>
      <div className="scene-workflow phase-two">
        <svg className="scene-connectors" viewBox="0 0 560 110" preserveAspectRatio="none" aria-hidden="true"><path className="wire" d="M55 48H505"/><path className="wire-active" d="M55 48H505" pathLength="1"/><circle className="wire-packet" r="4"/></svg>
        {[['workflow','分派研究','Assign research'],['candles','分析行情','Read the market'],['code','编写策略','Write the strategy'],['shield','审阅风险','Review risk']].map(([icon,zh,en],i)=><div key={icon} className="scene-node" style={{ '--i': i } as CSSProperties}><span><Icon name={icon} size={23}/></span><Copy zh={zh} en={en}/></div>)}
      </div>
        <div className="scene-result phase-three"><div className="scene-card-heading"><span className="mini-document"><Icon name="chart" size={18}/></span><div><Copy as="strong" zh="版本 01 · 回测摘要" en="Version one · Backtest"/><Copy as="span" zh="Super Agent 准备下一版" en="Super Agent prepares the next pass"/></div></div>
        <svg className="scene-equity" viewBox="0 0 500 85" aria-label="示例净值曲线 / Illustrative equity curve" role="img"><path className="equity-guide" d="M0 25H500 M0 60H500"/><path className="equity-plot" pathLength="1" d="M0 70L24 66L48 72L72 55L96 59L120 47L144 55L168 42L192 46L216 28L240 39L264 22L288 29L312 19L336 26L360 15L384 23L408 10L432 15L456 7L480 12L500 3"/></svg>
        <NativePart name="backtest" />
      </div>
    </div>}
    {id === 'team' && <div className="team-scene scene-composition">
      <div className="team-core phase-one"><img src="/assets/nerya-logo.webp" width="43" height="43" alt=""/><Copy as="strong" zh="Super Agent" en="Super Agent"/><Copy as="span" zh="调度量化团队" en="Runs the quant team"/></div>
      <div className="team-network phase-two"><svg viewBox="0 0 560 130" preserveAspectRatio="none" aria-hidden="true"><path className="wire" d="M280 0V20Q280 32 260 32H93V122M280 32V122M280 32H467V122"/><path className="wire-active" pathLength="1" d="M280 0V32H93V122M280 32V122M280 32H467V122"/></svg>
        {[['researcher','研究员','Researcher','分析行情','Read the market'],['quant','因子分析师','Factor analyst','研究因子','Study factors'],['reviewer','审阅员','Reviewer','交叉审阅','Review findings']].map(([role,zh,en,subZh,subEn],i)=><div key={role} className="team-person" style={{ '--i': i } as CSSProperties}><img src={`/assets/agent-avatars/${role}.png`} width="54" height="54" alt=""/><Copy as="strong" zh={zh} en={en}/><Copy as="span" zh={subZh} en={subEn}/><span className="agent-working" aria-hidden="true"><i/><i/><i/></span></div>)}
      </div>
      <div className="team-evidence phase-three"><span className="evidence-spine"/><div><Copy as="h3" zh="多方研究，交叉审阅" en="Parallel research, independent review"/><Copy as="p" zh="分析行情与因子，比较不同判断，汇总成投研报告。" en="Study markets and factors, compare views and produce a research report."/><div className="evidence-lines" aria-hidden="true"><i/><i/><i/></div></div></div>
    </div>}
    {id === 'evolution' && <div className="evolution-scene scene-composition">
      <div className="review-orbit phase-one"><svg viewBox="0 0 250 250" aria-hidden="true"><circle className="orbit-track" cx="125" cy="125" r="105"/><circle className="orbit-progress" cx="125" cy="125" r="105" pathLength="1"/></svg><img src="/assets/agent-avatars/evolution.png" width="66" height="66" alt=""/><strong>18</strong><Copy as="span" zh="模拟会话" en="Paper sessions"/><span className="review-orbit-tick">↻</span></div>
      <div className="diff-stack phase-two"><div className="diff-behind"/><div className="diff-card"><div className="scene-card-heading"><Icon name="code" size={18}/><Copy as="strong" zh="下一版策略" en="Next strategy version"/><span>014</span></div><Copy as="code" className="diff-context" zh="持仓 / 确认 · position / confirmation" en="Position / confirmation"/><Copy as="code" className="diff-minus" zh="− 每次最多持有 8%" en="− Max position 8%"/><Copy as="code" className="diff-plus" zh="+ 每次最多持有 5%" en="+ Max position 5%"/><div className="diff-divider"/><Copy as="code" className="diff-minus" zh="− 确认 1 根 K 线" en="− Confirm 1 bar"/><Copy as="code" className="diff-plus" zh="+ 确认 3 根 K 线" en="+ Confirm 3 bars"/></div></div>
      <div className="review-receipt phase-three"><span className="receipt-ring"><Icon name="evolution" size={23}/></span><div><Copy as="strong" zh="版本 02 已准备" en="Version two is ready"/><Copy as="p" zh="Super Agent 根据上一轮结果改了仓位和确认条件" en="The Super Agent changed sizing and confirmation rules from the last run"/></div></div>
    </div>}
    {id === 'vault' && <div className="vault-scene scene-composition">
      <div className="vault-halo phase-one"><div className="halo-ring ring-a"/><div className="halo-ring ring-b"/><div className="vault-core"><Icon name="lock" size={54}/></div><Copy as="span" zh="本地密钥库" en="LOCAL KEY VAULT"/></div>
      <div className="reference-slip phase-two"><span className="reference-dot"/><Copy as="strong" zh="交易所 API 密钥" en="Exchange API key"/><code>•••• •••• •••• ••••</code><div><Icon name="lock" size={16}/><Copy zh="已保存到本地 Vault" en="Stored in your local Vault"/></div></div>
      <div className="review-receipt phase-three"><span className="receipt-ring"><Icon name="key" size={20}/></span><div><Copy as="strong" zh="连接账户，引用密钥" en="Connect an account with a key reference"/><p><code>vault://exchange/api_key</code></p></div></div>
    </div>}
    {id === 'markets' && <div className="market-scene scene-composition">
      <div className="market-chips phase-one">{[['₿','加密货币','Crypto'],['◈','预测市场','Prediction'],['↗','期货','Futures'],['A','海外美股','US equities']].map(([mark,zh,en],i)=><span key={mark} style={{ '--i': i } as CSSProperties}><b>{mark}</b><Copy zh={zh} en={en}/></span>)}</div>
      <div className="market-chart-stage phase-two"><div className="market-chart-title"><strong>BTC / USDT</strong><span>4H <i/> <Copy zh="持仓变化 + 波动" en="Position change + volatility" /></span></div><svg viewBox="0 0 520 190" preserveAspectRatio="none" aria-label="示意 K 线 / Illustrative candles" role="img"><path className="equity-guide" d="M0 35H520M0 90H520M0 145H520"/>{[87,83,96,78,75,91,68,59,72,56,49,62,39,43,36,50,28,18,30,22,11,25,8,15].map((y,i)=><g key={i} className={cn(['scene-candle',i%4===1&&'down'])} style={{ '--i': i } as CSSProperties}><line x1={i*21+9} x2={i*21+9} y1={y+15} y2={y+60}/><rect x={i*21+5} y={y+25} width="8" height={13+i%4*3} rx="1"/></g>)}<path className="equity-plot average" pathLength="1" d="M0 150C80 149 75 110 150 119S220 98 270 89S350 73 405 65S465 56 515 50"/><path className="scan-line" d="M280 0V190"/></svg></div>
      <div className="market-native phase-three"><NativePart name="market"/></div>
    </div>}
    {id === 'integrations' && <div className="integration-scene scene-composition">
      <div className="integration-request phase-one"><span className="api-bracket">{'{ }'}</span><div><Copy as="strong" zh="我想接一个新的行情接口" en="I want to connect a new market data API"/><span>ExampleX / market-data</span></div></div>
      <div className="integration-map phase-two"><div className="api-port"><code>GET</code><span>/markets</span><span>/candles</span><span>/account</span></div><div className="api-bridge"><span className="bridge-signal"/><Icon name="workflow" size={28}/><Copy zh="检查现有连接器" en="Check existing connectors"/></div><div className="api-package"><Icon name="code" size={27}/><span>provider_spec</span><span>validation_plan</span></div></div>
      <div className="integration-proposal phase-three"><div><span className="proposal-stamp"><Icon name="workflow" size={21}/></span><Copy as="strong" zh="数据源已接入研究流程" en="The data source is in the research flow"/></div><Copy as="p" zh="Super Agent 可以继续分析行情、编写策略和跑回测。" en="The Super Agent can now analyze the market, build strategies and run backtests."/></div>
    </div>}
  </div>
</figure></>;
}
