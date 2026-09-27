import {build} from 'esbuild';
import assert from 'node:assert/strict';
const result=await build({entryPoints:['demo-src/fixtures.ts'],bundle:true,format:'esm',platform:'node',write:false});
const {richResponse,strategyRows}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const request=(p,b={})=>richResponse(p,new URLSearchParams(b),b,'GET');
assert.equal(strategyRows.length,6);
for(const row of strategyRows){const w=request('/strategies/runtime/workflow',{strategy_id:row.strategy_id});assert.equal(w.ok,true);const ids=new Set(w.strategy.nodes.map(n=>n.id));assert.equal(ids.size,w.strategy.nodes.length);for(const e of w.strategy.edges){assert(ids.has(e.source));assert(ids.has(e.target));}assert.equal(w.strategy.nodes.filter(n=>n.kind==='agent').length,row.counts.agent);assert.equal(w.manifest.mode,'paper');}
const workflow=request('/strategies/runtime/workflow',{strategy_id:strategyRows[0].strategy_id});
const proposed=request('/strategies/runtime/workflow/propose',{strategy_id:strategyRows[0].strategy_id,changes:[{node_id:'researcher',content:'Updated instruction'}],metadata:workflow.metadata});
assert.equal(proposed.workflow.strategy.nodes.find(n=>n.id==='researcher').content,'Updated instruction');assert.equal(proposed.state,'pending');
const schedule=request('/triggers/schedules').schedules[0];request('/triggers/schedules/pause',{id:schedule.id});assert.equal(schedule.paused,true);request('/triggers/schedules/resume',{id:schedule.id});assert.equal(schedule.paused,false);
assert(request('/portfolio/summary').accounts.length>0);assert(request('/trading/recent_trades').trades.length>0);assert(request('/teams/unrecognized')===null);
assert(strategyRows.some(r=>r.strategy_id==='event_probability'));
assert(strategyRows.some(r=>r.strategy_id==='futures_term_structure'));
assert(strategyRows.some(r=>r.strategy_id==='ashare_factor_rotation'));
const contentBundle=await build({entryPoints:['demo-src/content.ts'],bundle:true,format:'esm',platform:'node',write:false});
const {classifyPrompt,scenario}=await import('data:text/javascript;base64,'+Buffer.from(contentBundle.outputFiles[0].text).toString('base64'));
for(const [prompt,kind] of [['构建 A 股因子轮动策略','equities'],['研究预测市场事件合约','prediction'],['构建期货 CTA 策略','futures'],['帮我接入 ExampleX 的接口','adapter']]){
 assert.equal(classifyPrompt(prompt),kind);const result=scenario(kind,'zh',prompt);assert(result.reply.length>100);assert(!result.title.includes('BTC'));
}
assert(scenario('equities','zh').reply.includes('Tushare'));
assert(scenario('prediction','en').reply.includes('Polymarket'));
console.log('PASS: six populated strategy graphs across four market categories, valid edges/counts, paper-only fixtures, proposal staging and schedule state changes.');
