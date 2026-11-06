import React from 'react';
import Copy from './Copy';
import Icon from './Icon';

export default function RsiLoop() {
  return <section className="rsi-loop-section wide" id="rsi-loop" aria-labelledby="rsi-loop-title">
    <div className="rsi-loop-heading">
      <div>
        <Copy as="h2" id="rsi-loop-title" zh="每跑一轮，策略就多一版" en="Every run gives the strategy a new version" />
      </div>
    </div>

    <div className="rsi-console">
      <div className="rsi-console-topline">
        <span><i className="rsi-live-dot" /> NERYA / <Copy zh="SUPER AGENT 工作流" en="SUPER AGENT WORKFLOW" /></span>
        <span className="rsi-console-meta">ASSIGN <b>→</b> BUILD <b>→</b> EVOLVE</span>
      </div>
      <div className="rsi-console-grid">
        <div className="rsi-workflow" aria-label="策略研究与改进 / Strategy research and improvement">
          <div className="rsi-workflow-title"><strong>BTC</strong><Copy zh="趋势策略 · 版本 01" en="Trend strategy · Version 01" /></div>
          <ol className="rsi-workflow-steps">
            <li><Icon name="candles" size={19}/><Copy zh="Super Agent 读行情" en="Super Agent reads the market" /></li>
            <li><Icon name="code" size={19}/><Copy zh="团队并行投研与审阅" en="The team researches and reviews in parallel" /></li>
            <li><Icon name="chart" size={19}/><Copy zh="回测，找出薄弱环节" en="Backtest and find the weak spot" /></li>
            <li><Icon name="evolution" size={19}/><Copy zh="带着结果进入版本 02" en="Carry the result into version two" /></li>
          </ol>
          <div className="rsi-feedback"><Icon name="refresh" size={15}/><Copy zh="版本 01 → 版本 02" en="Version one → version two" /></div>
        </div>

        <div className="rsi-agent-card">
          <div className="rsi-agent-head">
            <div className="rsi-agent-identity"><img src="/assets/nerya-logo.webp" width="30" height="30" alt="" /><div><strong>Nerya Super Agent</strong><Copy zh="团队调度与策略进化" en="Team orchestration & strategy evolution" /></div></div>
            <span className="rsi-status"><Copy zh="正在推进" en="Working" /></span>
          </div>
          <div className="rsi-agent-prompt"><span>YOU</span><p><Copy zh="研究 BTC 趋势，做一套能继续进化的策略。" en="Research the BTC trend and build a strategy that can keep evolving." /></p></div>
          <div className="rsi-agent-response"><span>SUPER AGENT</span><p><Copy zh="团队研究行情、交叉审阅。我把研究结论写成策略，再根据回测修改。" en="The team researches the market and reviews the findings. I turn them into a strategy and revise it after backtesting." /></p></div>
          <div className="rsi-agent-footer"><span><Icon name="workflow" size={14} /><Copy zh="行情研究 · 因子分析 · 独立审阅" en="Market research · Factor analysis · Review" /></span><span><Icon name="evolution" size={14} /><Copy zh="版本 02" en="Version two" /></span></div>
        </div>
      </div>
      <div className="rsi-console-foot"><Copy zh="你给一个方向" en="You give the direction" /><Copy zh="Super Agent 调度团队" en="Super Agent runs the team" /><Copy zh="策略带着结果继续进化" en="The strategy evolves from results" /></div>
    </div>

  </section>;
}
