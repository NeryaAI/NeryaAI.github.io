/** Current workbench protocol, entirely in memory. Never calls a real runtime. */
type Row = Record<string, any>;
type Options = {
  run: (request: Row, signal: AbortSignal) => Promise<Row>;
  session: (id: string) => Row | undefined;
  start: (id: string, text: string) => void;
  agents: (id: string) => Row[];
  events: (id: string, commandId: string, after: number) => Row[];
};
export function createCommandFixtures(options: Options) {
  const commands = new Map<string, Row>();
  const queues = new Map<string, { paused: boolean; pause_reason: string; revision: number }>();
  const controllers = new Map<string, AbortController>();
  const queue = (sid: string) => { if (!queues.has(sid)) queues.set(sid, { paused: false, pause_reason: '', revision: 1 }); return queues.get(sid)!; };
  const rows = (sid: string) => [...commands.values()].filter(c => c.session_id === sid).sort((a,b) => a.position-b.position);
  const snapshot = (sid: string) => ({ ok: true, queue: queue(sid), commands: rows(sid), checkpoint: null });
  const update = (c: Row, state: string) => { c.state=state; c.revision++; c.updated_at=Date.now()/1000; };
  function drain(sid: string) {
    if (queue(sid).paused || rows(sid).some(c => c.state === 'running')) return;
    const next = rows(sid).find(c => c.state === 'queued'); if (next) begin(next);
  }
  function begin(command: Row) {
    update(command, 'running');
    const controller=new AbortController(); controllers.set(command.command_id,controller);
    options.start(command.session_id,command.input);
    // Accepted commands outlive the HTTP observer's signal. Stop is explicit.
    void Promise.resolve().then(() => options.run({ ...command.request, session_id:command.session_id,
      command_id:command.command_id, turn_id:command.turn_id,
      payload:{...command.request.payload,text:command.input} },controller.signal)).then(result=>{
      if(controller.signal.aborted)return;
      command.result={...result,command_id:command.command_id,turn_id:command.turn_id};
      command.has_result=true;update(command,'succeeded');
    }).catch(error=>{
      update(command,controller.signal.aborted?'interrupted':'failed');
      command.error=controller.signal.aborted?null:{code:'demo_command_failed'};
    }).finally(()=>{controllers.delete(command.command_id);drain(command.session_id);});
  }
  return function handle(path: string, q: URLSearchParams, body: Row, method: string): Row | undefined {
    const sid=String(q.get('session_id')||body.session_id||'');
    if(path==='/runtime/info'&&method==='GET')return {ok:true,protocol_version:1,build_id:'nerya-public-demo-current-ui',started_at:Date.now()/1000,workspace_id:'isolated-demo',capabilities:['conversation_commands','session_view']};
    if(path==='/agent/sessions/view'&&method==='GET'){
      const list=rows(sid),work=list.filter(c=>c.kind!=='guide'&&c.state!=='removed'),active=work.find(c=>c.state==='running'||c.state==='queued');
      const latest=active||work.at(-1),session=options.session(sid);
      const execution=latest?.state||(session?.messages?.length?'succeeded':'idle');
      return {ok:true,session_id:sid,revision:JSON.stringify(list.map(c=>[c.command_id,c.revision])),observed_at:Date.now()/1000,
        status:{execution,waiting_for:null,completion:execution==='succeeded'?'turn_finished':null,validation:'unknown',needs_attention:false,external:false,turn_id:latest?.turn_id},
        pending_interactions:[],queue:{count:list.filter(c=>c.state==='queued').length,paused:queue(sid).paused},approvals:[],
        agents:session?options.agents(sid):[],result_refs:[],available_actions:{send:true,guide:!!active,stop:!!active}};
    }
    if(path==='/agent/commands/events'&&method==='GET'){
      const after=Number(q.get('after_seq')||0),events=options.events(sid,q.get('command_id')||'',after);
      return {ok:true,events,cursor:events.at(-1)?.seq||after,has_more:false};
    }
    if(path==='/agent/commands'&&method==='GET'){
      const id=q.get('command_id');if(!id)return snapshot(sid);
      const command=commands.get(id);return command?.session_id===sid?{ok:true,command}:{ok:false,error:'command_not_found'};
    }
    if(path==='/agent/commands'&&method==='POST'){
      const id=String(body.command_id||''),request=body.request,kind=body.command_type||'send';
      if(!sid||!id||!request||typeof request!=='object'||Array.isArray(request)||!['send','resume','guide'].includes(kind))return {ok:false,error:'invalid_demo_command'};
      const existing=commands.get(id);if(existing)return existing.session_id===sid?{ok:true,command:existing,duplicate:true}:{ok:false,error:'command_session_mismatch'};
      const input=String(request.payload?.text||request.continuation_feedback||'');
      const command={command_id:id,session_id:sid,kind,turn_id:request.resume_turn_id||`turn-${id}`,revision:1,position:commands.size+1,
        state:kind==='guide'?'delivered':'queued',created_at:Date.now()/1000,updated_at:Date.now()/1000,input,attachments:request.payload?.attachments||[],
        context:{input_text:input,accepted_model:{provider:'workspace',model:'Research model'}},has_result:false,show_user:kind==='send',request};
      commands.set(id,command);if(kind!=='guide')drain(sid);
      return {ok:true,command,duplicate:false};
    }
    if(path==='/agent/commands/control'&&method==='POST'){
      const command=commands.get(String(body.command_id)),list=rows(sid),state=queue(sid);
      if(command&&command.session_id!==sid)return {ok:false,error:'command_session_mismatch'};
      if(body.action!=='reconcile'&&body.expected_revision!==(command?.revision||state.revision))return {ok:false,error:'command_revision_conflict'};
      if(['pause','resume'].includes(body.action)){state.paused=body.action==='pause';state.revision++;if(!state.paused)drain(sid);}
      else if(body.action==='stop'&&command){controllers.get(command.command_id)?.abort();update(command,'interrupted');}
      else if(['edit','remove','move'].includes(body.action)&&command?.state==='queued'){
        if(body.action==='edit')command.input=String(body.text||'');
        if(body.action==='remove')command.state='removed';
        if(body.action==='move'){const ordered=list.filter(c=>c!==command&&c.state==='queued');const at=ordered.findIndex(c=>c.command_id===body.before_command_id);ordered.splice(at<0?ordered.length:at,0,command);ordered.forEach((c,i)=>c.position=i+1);}
        command.revision++;
      }else if(body.action!=='reconcile')return {ok:false,error:'unsupported_demo_control'};
      return snapshot(sid);
    }
    return undefined;
  };
}
