/* Authored, deterministic examples. No live data, model calls, or trade requests. */
(function (root) {
  'use strict';
  const roles = {
    lead: { avatar:'lead', label:['Research lead','研究负责人'], title:['Assign research tasks','分配研究任务'], note:['Set the scope, assign members and track their findings.','确定研究范围，分配任务并汇总结论。'], list:[['Confirm the assets and time horizon','确认标的与时间范围'],['Track the evidence and open questions','记录证据与待验证问题']], footer:['research/plan.md → shared-board.json','research/plan.md → shared-board.json'] },
    market: { avatar:'analyst', label:['Market analyst','市场分析师'], title:['Check data and sources','核对数据和来源'], note:['Compare market data and record the source, timestamp and gaps.','对照行情与链上数据，记录来源、时间和缺失项。'], list:[['Separate observations from assumptions','区分观察与假设'],['List conditions that invalidate the thesis','列出判断失效的条件']], footer:['research/brief.md','research/brief.md'] },
    risk: { avatar:'risk', label:['Risk critic','风险审查员'], title:['Check exposure and assumptions','检查敞口与假设'], note:['Flag missing evidence and risk before you approve execution.','标出证据缺口和风险，再交由你审批。'], list:[['Check position size and exposure','检查仓位与风险敞口'],['Define stop conditions','列出停止条件']], footer:['review/risk-checks.json','review/risk-checks.json'] },
  };
  function gateState(mode, size, approved, executed) {
    if (!Number.isFinite(size) || size < 1 || size > 5) return 'blocked';
    if (mode !== 'paper' && mode !== 'live') return 'blocked';
    if (mode === 'live') return approved ? 'approved' : 'pending';
    return executed ? 'simulated' : 'ready';
  }
  const api = { roles, gateState };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.NeryaDemo = api;
})(typeof window !== 'undefined' ? window : globalThis);
