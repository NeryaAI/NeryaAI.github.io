const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {transformSync}=require('esbuild');
const moduleFixture={exports:{}};
vm.runInNewContext(transformSync(fs.readFileSync(require('node:path').join(__dirname,'../demo-src/command-fixtures.ts'),'utf8'),{loader:'ts',format:'cjs'}).code,{module:moduleFixture,AbortController,Date,Promise,Map,String,JSON});
const {createCommandFixtures}=moduleFixture.exports;
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function setup(){
 const jobs=[],sessions=new Map();
 const handle=createCommandFixtures({run:(body,signal)=>new Promise((resolve,reject)=>{jobs.push({body,signal,resolve,reject});signal.addEventListener('abort',()=>reject(signal.reason),{once:true});}),session:id=>sessions.get(id),start:(id,text)=>sessions.set(id,{title:text,messages:[]}),agents:id=>[{id:id+'-researcher',name:'researcher'}],events:()=>[{seq:3,kind:'message.delta',text:'evidence'}]});
 const call=(path,body={},method='POST',query='')=>handle(path,new URLSearchParams(query),body,method);
 const send=(id,text='research')=>call('/agent/commands',{session_id:'s1',command_id:id,command_type:'send',request:{payload:{text}}});
 return {jobs,call,send};
}
(async()=>{
 const f=setup();
 assert.equal(f.call('/runtime/info',{},'GET').protocol_version,1);
 assert.equal(f.call('/unhandled',{},'GET'),undefined);
 assert.equal(f.call('/agent/commands',{session_id:'s1',command_id:'invalid',request:[]}).ok,false);
 const first=f.send('one');assert.equal(first.command.state,'running');await tick();assert.equal(f.jobs.length,1);
 assert.equal(f.send('one').duplicate,true);await tick();assert.equal(f.jobs.length,1,'One command ID cannot execute twice');
 const next=f.send('two');assert.equal(next.command.state,'queued');
 assert.equal(f.call('/agent/commands',{session_id:'other',command_id:'one',request:{}}).error,'command_session_mismatch');
 f.jobs[0].resolve({final_text:'reviewed'});await tick();await tick();
 assert.equal(first.command.state,'succeeded');assert.equal(first.command.result.command_id,'one');assert.equal(next.command.state,'running');assert.equal(f.jobs.length,2);
 const view=f.call('/agent/sessions/view',{},'GET','session_id=s1');assert.equal(view.session_id,'s1');assert.equal(view.status.execution,'running');assert.equal(view.agents.length,1);
 assert.equal(f.call('/agent/commands/control',{session_id:'s1',command_id:'two',action:'stop',expected_revision:0}).error,'command_revision_conflict');
 f.call('/agent/commands/control',{session_id:'s1',command_id:'two',action:'stop',expected_revision:next.command.revision});await tick();assert.equal(next.command.state,'interrupted');assert(f.jobs[1].signal.aborted);
 const state=f.call('/agent/commands',{},'GET','session_id=s1');
 f.call('/agent/commands/control',{session_id:'s1',action:'pause',expected_revision:state.queue.revision});
 assert.equal(f.send('three').command.state,'queued');
 const paused=f.call('/agent/commands',{},'GET','session_id=s1');
 f.call('/agent/commands/control',{session_id:'s1',action:'resume',expected_revision:paused.queue.revision});await tick();assert.equal(f.jobs.length,3);
 f.jobs[2].resolve({final_text:'done'});await tick();
 const stream=f.call('/agent/commands/events',{},'GET','session_id=s1&command_id=three&after_seq=0');assert.equal(stream.cursor,3);
 console.log('PASS: current command/session-view protocol, idempotent admission, serialized queue, control revisions, stop/cancellation and unknown-route passthrough.');
})().catch(error=>{console.error(error);process.exitCode=1;});
