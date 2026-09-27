const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(new URL('../demo-src/theme.js', `file://${__filename}`), 'utf8');
assert.equal(source, fs.readFileSync(new URL('../demo/theme.js', `file://${__filename}`), 'utf8'));
const location = new URL('http://localhost/demo/index.html?lang=zh#/self-evolution');
const events = [];
const listeners = new Map();
const history = {};
// Model the new embedded-only focus/scroll boundary without invoking a host
// browser. The route assertions below remain unchanged; browser QA is separate.
class ElementMock {}
class HTMLElementMock extends ElementMock {
  focus(options) { this.focusOptions = options; }
}
const documentMock = {body: {}, documentElement:{classList:{toggle(){}},style:{}}};
for (const method of ['pushState','replaceState']) history[method] = (_, __, url) => {
  if (url == null) return;
  const target = new URL(url,location.href);
  if (target.origin !== location.origin) throw new Error('cross origin');
  location.href = target.href;
};
vm.runInNewContext(source, {location,history,URL,URLSearchParams,window:{},parent:{document:{documentElement:{dataset:{theme:'light'}}}},HTMLElement:HTMLElementMock,Element:ElementMock,getComputedStyle:el=>el.style||{},document:documentMock,matchMedia:()=>({matches:false}),queueMicrotask:fn=>fn(),addEventListener:(type,fn)=>listeners.set(type,fn),dispatchEvent:e=>events.push(e),HashChangeEvent:class{constructor(type,data){Object.assign(this,{type},data);}}});
const input = new HTMLElementMock();
input.focus({preventScroll:false,focusVisible:true});
assert.equal(input.focusOptions.preventScroll,true,'Native autofocus cannot scroll the host');
assert.equal(input.focusOptions.focusVisible,true,'Other focus options remain intact');
let scrolled;
const inner = {parentElement:documentMock.body,style:{overflowY:'auto'},scrollHeight:800,clientHeight:300,scrollTop:40,getBoundingClientRect:()=>({top:100,bottom:400,height:300}),scrollTo:options=>scrolled=options};
const target = new ElementMock();
target.parentElement=inner;target.getBoundingClientRect=()=>({top:350,bottom:450,height:100});
target.scrollIntoView({block:'nearest',behavior:'smooth'});
assert.equal(scrolled.top,90,'Transcript scroll remains inside its own viewport');
assert.equal(scrolled.behavior,'smooth');
scrolled=undefined;target.parentElement=documentMock.body;target.scrollIntoView();
assert.equal(scrolled,undefined,'No inner viewport must not fall back to host scrolling');
history.replaceState(null,'','/self-evolution?tab=memory');
assert.equal(location.pathname,'/demo/index.html');
assert.equal(location.search,'?lang=zh');
assert.equal(location.hash,'#/self-evolution?tab=memory');
assert.equal(events.length,1);
history.replaceState(null,'','/self-evolution?tab=memory');
assert.equal(events.length,1,'Same route does not retrigger renders');
history.pushState(null,'','?tab=learning');
assert.equal(location.hash,'#/self-evolution?tab=learning');
history.replaceState(null,'','#/settings');
assert.equal(location.hash,'#/settings');
assert.equal(events.length,2,'Hash-native router owns its own notifications');
assert.throws(()=>history.pushState(null,'','https://example.com/'),/cross origin/);
history.replaceState({},'',null);
assert.equal(location.pathname,'/demo/index.html');
location.hash='/strategies?strategy_id=btc_trend_guard%3Ftab%3Dperformance';
listeners.get('hashchange')();
assert.equal(location.hash,'#/strategies?strategy_id=btc_trend_guard&tab=performance');
location.hash='/strategies?strategy_id=event_probability%3Ftab%3Dperformance&tab=workflow';
listeners.get('hashchange')();
assert.equal(location.hash,'#/strategies?strategy_id=event_probability&tab=workflow');
console.log('PASS: native query history and card query normalization remain in static demo hash routing; duplicates and origin boundaries preserved.');
