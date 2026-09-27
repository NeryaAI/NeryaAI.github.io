const assert=require('node:assert/strict');
const d=require('../capabilities-data.js');
assert.deepEqual(Object.keys(d.markets),['crypto','prediction','futures','equities']);
for(const m of Object.values(d.markets)){assert.equal(m.nodes.length,5);assert.equal(m.constraints.length,3);for(const s of [m.label,m.title,m.prompt,m.sources,m.support,m.stage,...m.nodes,...m.constraints])assert(s.length===2&&s.every(Boolean));}
assert.equal(d.adapterPlan('hi').ok,false);assert.equal(d.adapterPlan('x'.repeat(401)).ok,false);
assert.equal(d.adapterPlan('帮我接入 Bybit，检查行情和账户能力。').route,'reuse');
const custom=d.adapterPlan('帮我接入 ExampleX 的行情与账户数据');assert.equal(custom.target,'ExampleX');assert.equal(custom.route,'author');assert.equal(custom.liveEnabled,false);assert.equal(custom.validation,'required');
let e=d.evolve({},'reset');assert.equal(d.evolve({...e,step:4},'approve').decision,null);assert.equal(d.evolve(e,'apply').version,'1.3.2');
for(let i=0;i<4;i++)e=d.evolve(e,'next');assert.equal(e.validated,true);assert.equal(e.version,'1.3.2');
e=d.evolve(e,'approve');assert.equal(e.version,'1.3.2');e=d.evolve(e,'apply');assert.equal(e.version,'1.3.3');e=d.evolve(e,'rollback');assert.equal(e.version,'1.3.2');
assert.equal(d.evolve({...e,step:4},'reject').version,'1.3.2');assert.equal(d.evolve(e,'reset').validated,false);
console.log('PASS: four bilingual market contracts, adapter branches, no live activation, validation → approval → apply separation, rollback/reset.');
