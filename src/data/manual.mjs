export const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const copy = (zh,en,html=false) => `<span data-doc-copy${html?' data-doc-html="true"':''} data-zh="${escape(zh)}" data-en="${escape(en)}">${html?zh:escape(zh)}</span>`;
const p=(zh,en)=>({type:'p',zh,en}), h=(zh,en)=>({type:'h3',zh,en});
const note=(zh,en)=>({type:'note',zh,en});
const code=(language,text)=>({type:'code',language,text});
const rows=(headers,values)=>({type:'table',headers,values});
const steps=values=>({type:'steps',values});
export function render(block) {
  if(block.type==='code')return `<div class="code-block"><div><span>${escape(block.language)}</span><button data-code-copy aria-label="复制代码 / Copy code">${copy('复制','Copy')}</button></div><pre tabindex="0"><code>${escape(block.text)}</code></pre></div>`;
  if(block.type==='table')return `<div class="doc-table" tabindex="0"><table><thead><tr>${block.headers.map(v=>`<th>${copy(...v)}</th>`).join('')}</tr></thead><tbody>${block.values.map(row=>`<tr>${row.map(v=>`<td>${Array.isArray(v)?copy(...v):escape(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  if(block.type==='steps')return `<ol class="doc-steps">${block.values.map(v=>`<li>${copy(...v)}</li>`).join('')}</ol>`;
  if(block.type==='note')return `<aside class="doc-note">${copy(block.zh,block.en)}</aside>`;
  return `<${block.type}>${copy(block.zh,block.en)}</${block.type}>`;
}
export const sections = [
  {id:'overview',aliases:['pillars'],tag:'ORIENTATION',title:['先分清三层','Three layers to understand'],content:[
    p('Nerya Agent 是工作区原生的任务执行入口。Agent SDK 是调用它和相关能力的客户端，不是另一个独立的 Agent Loop。官网演示是隔离的示例界面，不是你的本地运行时。','Nerya Agent is the workspace-native task entry point. The Agent SDK is a client for that runtime and related capabilities, not a separate Agent loop. The website tour is an isolated demonstration, not your local runtime.'),
    rows([['层级','Layer'],['职责','Responsibility'],['入口','Entry point']],[
      ['Agent',['对话、研究、策略任务、工具执行与会话记录','Conversations, research, strategy tasks, tools and transcripts'],'AgentKernel → WorkspaceNativeAgentLoop'],
      ['Python SDK',['在本地 Python 进程中访问工作区','Access a workspace in the local Python process'],'nerya_sdk.connect(workspace=...)'],
      ['TypeScript SDK',['通过 HTTP 调用已经运行的 Nerya 服务','Call an already-running Nerya service over HTTP'],'connect({ baseUrl, timeoutMs, fetchImpl })'],
      [['官网演示','Website tour'],['只使用隔离示例数据；不连接模型或账户','Isolated example data; no model or account connection'],'/demo/index.html']]),
    note('本文的 Agent SDK 指仓库里的 nerya_sdk 与 @nerya/sdk。没有把未实现的 AgentSDK 构造器、流式方法或包发布状态写成现有功能。','Here, Agent SDK means the repository’s nerya_sdk and @nerya/sdk. This manual does not invent an AgentSDK constructor, streaming methods or package publication status.')
  ]},
  {id:'quickstart',tag:'GET STARTED',title:['安装与第一次运行','Install and start'],content:[
    p('已安装桌面端时，从初始化向导配置模型、按需绑定交易账户，并设置外部访问密码。本机研发环境可从 Nerya 产品源码目录安装；下方命令在含 pyproject.toml 的目录执行，而不是 landing-page。','With the desktop app installed, configure a model in onboarding, connect a trading account when needed, and set an external-access password. For development, run the following from the product repository containing pyproject.toml, not landing-page.'),
    code('Shell',`python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e .
nerya setup --web
nerya doctor
nerya run`),
    p('nerya run 在当前终端启动服务与 Dashboard；需要检查状态时，在另一个终端执行 nerya status。service 子命令用于 install、uninstall、status，并没有 service start。','nerya run starts the service and Dashboard in the current terminal. Use nerya status from another terminal to inspect it. The service subcommands are install, uninstall and status; there is no service start command.'),
    p('源码声明 Python ≥ 3.10。Python SDK 与产品一起安装。交易连接器、MCP、浏览器等可选依赖按实际功能安装；安装基础包不意味着所有外部连接器都已配置完成。','The source requires Python ≥ 3.10. The Python SDK is installed with the product. Install optional trading, MCP and browser dependencies for the capabilities you use; a base installation does not configure every external connector.'),
    steps([['先在 Agent 中完成一个只读任务，确认模型和工具调用记录正常。','Start with a read-only Agent task and verify the model and tool trace.'],['再创建策略候选，检查脚本、约束与回测结果。','Create a strategy candidate, then inspect its script, constraints and backtest evidence.'],['模拟验证与真实执行分开处理，不因为生成了策略就自动开始实盘。','Treat paper validation and live execution separately. Generating a strategy does not start live trading.']]),
    note('不要把 API 密钥粘贴到公开示例或官网演示。需要账户的功能应在你自己的运行时中配置。本文未验证公开软件包仓库或下载渠道的最新发布状态。','Do not paste API keys into public examples or the website tour. Configure account-backed capabilities in your own runtime. This manual does not verify current public package-registry or download releases.')
  ]},
  {id:'architecture',aliases:['gateway'],tag:'RUNTIME',title:['Agent 的完整调用链','The Agent execution path'],content:[
    code('Runtime flow',`Dashboard / Python SDK / HTTP client
                  ↓
           AgentKernel.run_turn
                  ↓
    WorkspaceNativeAgentLoop
       ↔ LLM gateway (messages + tools)
       ↔ Tool registry → permissions → tool execution
       ↔ Skill instructions / approved scripts
                  ↓
   blocks · tool_trace · events · artifacts
                  ↓
      Session transcript / Dashboard`),
    p('Kernel 负责绑定会话、取消令牌、钩子和日志，构建工具目录与提示上下文，再交给 WorkspaceNativeAgentLoop 执行。模型通过原生消息与工具协议推进任务，直到正常结束、预算限制、等待审批或其他停止条件。','The Kernel binds the session, cancellation token, hooks and journals, builds the tool catalog and prompt context, and delegates execution to WorkspaceNativeAgentLoop. The model advances through native messages and tools until completion, a budget limit, an approval pause or another stop condition.'),
    p('Gateway 负责模型路由与适配。SDK、Dashboard 和外部调用不应各自重新实现一套工具执行逻辑；下游要消费运行时返回的结构化结果。','The gateway handles model routing and adapters. SDK, Dashboard and external clients should not each implement their own tool-execution loop; consumers should use the runtime’s structured results.'),
    note('提示词里的“只读”不是权限边界。工具权限、执行模式、交易风控和审批规则仍需由运行时配置与处理器执行。','A “read-only” instruction in a prompt is not a security boundary. Runtime configuration and handlers still enforce tool permissions, execution mode, trading risk and approvals.')
  ]},
  {id:'sdk',tag:'AGENT SDK',title:['选择你的 SDK','Choose your SDK'],content:[
    rows([['能力','Capability'],['Python','Python'],['TypeScript','TypeScript']],[
      [['调用一次 Agent','Run an Agent turn'],'agent.run_turn(...)','agent.runTurn(...)'],
      [['查看工具目录','Inspect tool catalog'],'agent.list_tools()','agent.tools()'],
      [['取消执行','Interrupt execution'],['公开 facade 暂无同名方法','No matching public facade method'],'agent.interrupt(sessionId)'],
      [['触发器','Triggers'],'triggers.emit / dry_run','triggers.emit / dryRun'],
      [['策略历史与复盘','Strategy history and review'],'strategy.history / review','strategy.history / review'],
      [['发布图表','Publish charts'],'charts.publish_and_announce',['当前客户端未暴露 charts facade','No charts facade in the current client']],
      [['传输','Transport'],['进程内；工作区路径','In process; workspace path'],['HTTP；已启动的本地服务','HTTP; already-running local service']]]),
    h('Python：先检查工具目录','Python: inspect the tool catalog first'),
    code('Python',`from pathlib import Path
from nerya_sdk import connect

client = connect(workspace=str(Path.home() / ".nerya"))
catalog = client.agent.list_tools()
for tool in catalog.get("tools", []):
    print(tool["name"], tool["risk"], tool["read_only"])`),
    h('Python：显式执行一个回合','Python: explicitly run one turn'),
    code('Python',`from pathlib import Path
from nerya_sdk import connect

client = connect(workspace=str(Path.home() / ".nerya"))
# Reuse the same session ID for follow-up turns.
session_id = "sdk-research-example"
result = client.agent.run_turn(
    text="Inspect the available research workflow. Do not place orders.",
    session_id=session_id,
)
print(result.get("reply_text", ""))
for envelope in result.get("blocks", []):
    block = envelope.get("block", envelope)
    print(block.get("kind"))`),
    note('run_turn 会真正调用已配置模型和工具，可能产生模型费用。本文没有运行该示例。公开 Python facade 支持 text、trigger、strategy_id、session_id、attached_skills；内部 API 的恢复参数没有自动暴露到公开 facade。','run_turn actually invokes the configured model and tools and may incur model charges. This example was not executed for this manual. The public Python facade accepts text, trigger, strategy_id, session_id and attached_skills; internal recovery parameters are not automatically exposed by the public facade.'),
    h('TypeScript：连接已有服务','TypeScript: connect to an existing service'),
    p('仓库中的 SDK 源码位于 sdk/typescript，构建脚本是 npm run build。先在该目录安装依赖并构建，再从消费项目安装该本地目录。包名是 @nerya/sdk；这里不假定它已发布到 npm。','The SDK source lives in sdk/typescript and builds with npm run build. Install dependencies and build there, then install that local directory from your consuming project. The package is named @nerya/sdk; availability on npm is not assumed here.'),
    code('Shell',`# Run in the product repository (not landing-page).
npm install --prefix sdk/typescript
npm run build --prefix sdk/typescript
# In your consuming project, use the real local SDK path:
npm install /absolute/path/to/product/sdk/typescript`),
    code('TypeScript',`import { connect } from "@nerya/sdk";

const client = connect({
  baseUrl: "http://127.0.0.1:18317",
  timeoutMs: 120_000,
  caller: "script:research-example",
});

const catalog = await client.agent.tools();
console.log(catalog.tools.map(tool => tool.name));

// Executing this call invokes your configured runtime and model.
const result = await client.agent.runTurn({
  text: "Inspect the research workflow without placing orders.",
  session_id: "sdk-research-example",
});
console.log(result.reply_text);
console.log(result.tool_trace);`),
    p('TypeScript 默认超时为 10 秒，较长 Agent 任务应显式配置 timeoutMs。caller 只设置 X-Nerya-Caller，不是鉴权凭据。需要鉴权时，通过可信服务端环境中的 fetchImpl 接入现有鉴权；不要把服务令牌放进公开前端。','The TypeScript default timeout is 10 seconds; set timeoutMs explicitly for longer Agent tasks. caller only sets X-Nerya-Caller and is not authentication. Where authentication is required, supply fetchImpl from a trusted server environment using your existing auth wiring; never expose the service token in a public frontend.')
  ]},
  {id:'sessions',aliases:['memory'],tag:'CONVERSATIONS',title:['会话与执行记录','Sessions and execution records'],content:[
    p('session_id 标识连续对话；turn_id 标识一次执行。对同一任务继续提问时复用 session_id，不要每调用一个工具就创建新会话。策略上下文通过 strategy_id 显式传入，附加 Skills 通过 attached_skills 指定。','session_id identifies a conversation; turn_id identifies a single execution. Reuse session_id for follow-up messages instead of creating a session for every tool call. Pass strategy_id explicitly for strategy context and attached_skills for attached Skills.'),
    rows([['字段','Field'],['如何使用','How to consume it']],[
      ['reply_text',['快速显示最终文本，但不要只保留这个字段','Display the final text quickly, but do not retain only this field']],
      ['blocks',['按 envelope.block.kind 渲染文本、工具、图表等内容，保留原顺序','Render text, tools, charts and other content by envelope.block.kind, preserving order']],
      ['tool_trace',['用 call_id 关联工具调用与结果；保留错误、耗时与 payload','Correlate calls and results by call_id; preserve errors, timing and payload']],
      ['events / steps',['执行事件与步骤视图；不要凭文本推断成功','Execution events and step views; do not infer success from prose']],
      ['stopped_reason',['区分完成、暂停和其他停止原因，不能把 HTTP 成功当作任务成功','Distinguish completion, pauses and other stops; HTTP success is not task success']]]),
    p('刷新后使用会话 transcript 接口恢复消息和结构化内容。长期记忆与对话历史不是同一个概念；不要把浏览器 localStorage 当成运行时权威状态。','After refresh, restore messages and structured content from the session transcript endpoint. Durable memory and conversation history are different concerns; browser localStorage is not authoritative runtime state.')
  ]},
  {id:'events',tag:'PROGRESS & CONTROL',title:['进度、续读与取消','Progress, replay and cancellation'],content:[
    p('保存事件响应中的 epoch 与 cursor，并在下一页传回 epoch、after_seq。has_more 为真时继续读取；reset_required 为真时先恢复持久 transcript，再建立新的事件游标，不能把旧进程的 seq 当成新进程的连续序号。','Persist epoch and cursor from event responses and send them as epoch and after_seq on the next page. Continue while has_more is true. When reset_required is true, restore the durable transcript before establishing a new event cursor; sequence numbers from different process epochs are not continuous.'),
    p('GET /agent/stream/events 是事件分页／轮询接口，不是 SDK 的 SSE 生成器。用 session_id 过滤会话、after_seq 续读，并按 seq 去重；消费返回的 cursor，同时尊重响应中的重置或截断信息。运行时事件缓冲有限，不替代持久 transcript。','GET /agent/stream/events is an event-page/polling endpoint, not an SDK SSE generator. Filter by session_id, resume with after_seq and deduplicate by seq. Consume the returned cursor and honor reset or truncation metadata. The bounded runtime event buffer is not a replacement for the durable transcript.'),
    code('HTTP',`GET /agent/stream/events?session_id=sdk-research-example&after_seq=0&limit=100
GET /agent/session/transcript?session_id=sdk-research-example
POST /agent/interrupt
Content-Type: application/json

{"session_id":"sdk-research-example","reason":"operator_interrupt"}`),
    p('取消是协作式的：请求取消不代表已经撤销外部副作用。客户端 HTTP 超时也不等于服务端回合停止。超时后先查询状态与 transcript，再决定是否续接，避免盲目重复执行。','Cancellation is cooperative: requesting it does not roll back external side effects. A client HTTP timeout does not imply the server turn stopped. Inspect state and the transcript before resuming or retrying to avoid duplicated execution.'),
    note('内部恢复机制不等于每个 SDK 都有 resume 方法。不要给当前公开 wrapper 传入尚未支持的恢复参数；具体恢复入口与返回状态以本地服务版本为准。','An internal recovery mechanism does not mean every SDK has a resume method. Do not pass unsupported recovery parameters to the current public wrapper; use the recovery entry points and state schema supported by your local service version.')
  ]},
  {id:'skills',tag:'TOOLS & SKILLS',title:['工具与 Skills','Tools and Skills'],content:[
    p('工具是可执行能力及其输入 schema；Skill 是指导 Agent 何时、如何使用这些能力的工作说明。通过工具目录读取 name、input_schema、risk、permission_scope、read_only 等字段，不要根据名字猜参数。','A tool is an executable capability with an input schema. A Skill is a playbook for when and how the Agent uses those capabilities. Read name, input_schema, risk, permission_scope and read_only from the tool catalog instead of guessing arguments from names.'),
    code('Skill layout',`my_research_skill/
├── SKILL.md        # Required: when to use, workflow, boundaries
├── references/     # Optional: methods, report templates, source rules
├── scripts/        # Optional: deterministic executable helpers
└── templates/      # Optional: reusable artifacts`),
    steps([['把触发场景、输入、步骤、产物和失败处理写入 SKILL.md。','Document triggers, inputs, workflow, artifacts and failure handling in SKILL.md.'],['把长方法论和报告模板放进 references，按需加载。','Put detailed methodology and report templates in references and load them on demand.'],['需要执行时使用 scripts，副作用走 SDK、Vault 或变更提案，不绕过风控。','Use scripts for execution. Route side effects through the SDK, Vault or change proposals without bypassing risk controls.']]),
    note('新 Skill 不使用 skill.yml、manifest.yaml 或 actions.py 来定义。仓库中残留的旧文件属于迁移遗留，不应继续扩展。','Do not define new Skills with skill.yml, manifest.yaml or actions.py. Legacy files that remain in the repository are migration artifacts, not the authoring contract.')
  ]},
  {id:'agent-team',tag:'COLLABORATION',title:['Agent 团队与独立审阅','Agent teams and independent review'],content:[
    p('主 Agent 可以把研究任务拆给研究员、策略作者和审阅员。并行任务仍需遵守依赖关系；汇总报告不代表每个必需任务都成功完成。','The main Agent can split research among researchers, strategy authors and reviewers. Parallel tasks still have dependencies; a synthesized report does not prove that every required task completed successfully.'),
    steps([['明确研究范围、时间尺度和所需产物。','Define the research scope, horizon and required artifacts.'],['给成员明确职责，并保留工具调用、来源与成员会话。','Assign explicit responsibilities and preserve tool traces, sources and member sessions.'],['独立审阅要保留反证和分歧，缺证据就标记缺失。','Independent review should retain counterevidence and disagreement; missing evidence stays missing.'],['主 Agent 汇总结论、局限和下一步，不把报告自动转成真实订单。','The main Agent synthesizes conclusions, limitations and next steps without automatically turning a report into live orders.']])
  ]},
  {id:'artifacts',tag:'CARDS & CHARTS',title:['卡片、图表与研究产物','Cards, charts and research artifacts'],content:[
    p('前端应展示每次 Agent 回复自己的产物，而不是把所有研究品种堆在当前输入框旁。策略提案、回测、行情和报告都有不同的数据契约；只在文本中写“已生成图表”不会产生可渲染图表。','The frontend should show artifacts belonging to each Agent reply, not collect every researched instrument beside the current composer. Strategy proposals, backtests, market data and reports have distinct contracts; saying “chart generated” in prose does not create a renderable chart.'),
    rows([['产物','Artifact'],['应显示的信息','What to show']],[
      [['策略卡片','Strategy card'],['strategy_id、提案状态、工作流、约束、审阅与验证入口','strategy_id, proposal status, workflow, constraints, review and validation entry points']],
      [['回测卡片','Backtest card'],['数据窗口、费用、滑点、净值曲线、回撤、交易记录与样本外边界','Data window, fees, slippage, equity, drawdown, trades and out-of-sample boundaries']],
      [['行情卡片','Market card'],['市场／品种、时间戳、来源、K 线与指标；缺数据不造价格','Market/instrument, timestamp, source, candles and indicators; missing data is not a price']],
      [['研究报告','Research report'],['结论、来源、证据、情景、分歧、风险与失效条件','Thesis, sources, evidence, scenarios, dissent, risks and invalidation']]]),
    h('Python：发布图表并交给当前回合','Python: publish a chart for the current turn'),
    code('Python',`from nerya_sdk import connect

client = connect()
# Illustrative observations, not live market data.
chart = {
    "kind": "chart",
    "chart_kind": "line",
    "title": "Example observations (illustrative)",
    "series": [{
        "type": "line", "name": "observed_value",
        "data": [
            {"time": 1704067200, "value": 100},
            {"time": 1704153600, "value": 102},
            {"time": 1704240000, "value": 101},
        ],
    }],
    "time": {"timezone": "UTC", "format": "unix_seconds"},
    "source": {
        "skill": "agent", "action": "example",
        "as_of": "2024-01-03T00:00:00Z",
    },
    "warnings": ["Illustrative data; not a backtest or live quote."],
}
result = client.charts.publish_and_announce(chart)
print(result["chart_id"])`),
    p('publish_and_announce 会写入当前工作区的图表产物，并输出 @@nerya:chart@@ 标记。Agent 的脚本执行链路读取标记后，将对应 chart block 放入回合；单独在终端运行脚本只会发布文件并打印标记，不会凭空附加到已有对话。','publish_and_announce writes a chart artifact in the current workspace and emits an @@nerya:chart@@ marker. The Agent script-execution path resolves that marker into a chart block in the turn. Running the script in a separate terminal only publishes the file and prints the marker; it does not attach itself to an existing conversation.'),
    p('图表支持 inline 与 bulk。公开 Python 发布方法会转为 bulk，用 chart_id 和 bulk_data_uri 读取数据，避免把大数组塞进模型上下文。保留 source.as_of、数据时间格式、指标名称和 warnings；不要丢掉 envelope 的其他字段。','Charts support inline and bulk paths. The public Python publish method uses bulk artifacts addressed by chart_id and bulk_data_uri to keep large arrays out of model context. Preserve source.as_of, time format, indicator names and warnings rather than discarding additional envelope fields.')
  ]},
  {id:'research',tag:'RESEARCH REPORTS',title:['一份可以审阅的投研报告','A reviewable research report'],content:[
    steps([['研究问题：品种、市场、观察窗口和假设。','Research question: instrument, market, observation window and hypothesis.'],['证据：每项关键结论的来源、时间戳、原始链接或产物标识。','Evidence: source, timestamp and original link or artifact identifier for each key finding.'],['方法：数据清洗、指标口径、样本划分和局限。','Method: data cleaning, indicator definitions, sample splits and limitations.'],['情景：基准、上行、下行，以及触发这些情景的条件。','Scenarios: base, upside and downside cases with explicit conditions.'],['独立审阅：支持、反对、缺失证据和仍未解决的问题。','Independent review: supporting and opposing evidence, gaps and unresolved questions.'],['行动边界：失效条件、下一次复查点和执行前仍需满足的要求。','Action boundaries: invalidation, the next review point and requirements before execution.']]),
    p('详细研究规范放在 Skill 的 references 中按需加载。报告应可通过工作区产物重新打开，图表与品种卡片绑定到产生它们的回复。示例、回测、模拟执行和真实成交需要明确区分。','Keep detailed research standards in on-demand Skill references. Reports should reopen from workspace artifacts, while charts and instrument cards remain attached to the reply that produced them. Clearly distinguish illustrative data, backtests, paper execution and live fills.')
  ]},
  {id:'trading',tag:'STRATEGIES & EXECUTION',title:['策略、回测与执行边界','Strategies, backtests and execution'],content:[
    p('策略任务应携带 strategy_id，保留自然语言目标、脚本、解释性工作流和运行证据。定时检查是工作流里的触发职责，不能用一个模糊的“已配置”代替可检查的运行记录。','A strategy task should carry strategy_id and retain the natural-language objective, scripts, explanatory workflow and run evidence. Scheduled checks are a trigger responsibility in the workflow, not an opaque “configured” status without inspectable runs.'),
    code('Execution boundary',`Strategy candidate → Validation / backtest → Review
                         ↓
                    Paper execution
                         ↓
      Explicit live enablement + account capability
                         ↓
             Risk Gate → Approval policy
                         ↓
              Order result / reconciliation`),
    p('submit_intent / submitIntent 表示向运行时提交交易意图，不是直接调用交易所。是否允许执行由账户能力、实盘开关、风控、审批策略与执行处理器共同决定。审批策略可含自动审批规则，不应宣传每笔订单必然手动点击。','submit_intent / submitIntent submits a trading intent to the runtime, not directly to an exchange. Account capabilities, live enablement, risk checks, approval policy and execution handlers determine whether it can execute. Approval policy can include automatic approval; do not claim every order requires a manual click.'),
    note('回测曲线不是实盘收益证明。报告应披露数据窗口、费用与滑点、样本外划分和数据局限。官网中的数字只用于界面展示。','A backtest curve is not evidence of live returns. Disclose the data window, fees, slippage, out-of-sample split and data limitations. Numbers in the website showcase are illustrative only.')
  ]},
  {id:'triggers',tag:'AUTOMATION',title:['触发器与幂等','Triggers and idempotency'],content:[
    p('触发器把外部事件或定时事件路由到明确目标。先 dry_run 检查路由，再决定是否发送；为可能重试的事件使用稳定的 idempotency_key，不要每次重试都生成一个新键。','Triggers route external or scheduled events to an explicit target. Inspect the route with dry_run before emitting. Use a stable idempotency_key for retryable events instead of generating a new key for every retry.'),
    code('Python',`from nerya_sdk import connect

client = connect()
preview = client.triggers.dry_run(
    source="script",
    kind="research.requested",
    payload={"question": "Review the available market evidence"},
    target="main",
    idempotency_key="research-example-001",
)
print(preview)`),
    p('Python 的 emit_to_file 写入工作区 inbox，SDK 不会因此自动启动守护进程。需要有相应运行时消费文件，才会产生后续处理。','Python emit_to_file writes to the workspace inbox. The SDK does not start a daemon as a result; an appropriate running consumer is required to process it.')
  ]},
  {id:'connectors',tag:'INTEGRATIONS',title:['连接器与外部 Agent','Connectors and external Agents'],content:[
    p('接入交易平台前先检查当前连接器与账户能力。CEX 优先复用 CCXT/provider-spec 路径；不支持的平台走可审阅的适配方案和验证流程。生成了接入计划，不代表已经实现、安装或验证了连接器。','Inspect connector and account capabilities before integrating a venue. Reuse the CCXT/provider-spec path for CEX venues where available; unsupported platforms need a reviewable adaptation and validation workflow. A generated integration plan is not an implemented, installed or verified connector.'),
    p('通过 MCP 或其他外部 Agent 接入时，复用运行时工具目录、会话与产物展示契约。外部模型发起工具调用，不应导致每次调用创建一条孤立会话，也不应把工具轨迹和卡片降级为一大段纯文本。','When connecting through MCP or another external Agent, reuse the runtime’s tool catalog, session and artifact contracts. Calls initiated by an external model should not create an isolated conversation per tool call or flatten tool traces and cards into one text block.'),
    note('“支持研究某类市场”与“已验证某个账户能够实盘交易”是不同声明。以本地连接器的能力、鉴权状态和测试结果为准，不根据官网市场分类推断订单支持。','“Researches a market category” and “a verified account can trade live” are different claims. Use your connector’s capabilities, auth state and tests rather than inferring order support from website market categories.')
  ]},
  {id:'self-evolution',tag:'REVIEW & CHANGE',title:['复盘与变更提案','Review and change proposals'],content:[
    p('启用复盘计划后，Agent 可以检查运行历史并提出调整。证据不足时可以 hold 或 skip，不应承诺每次复盘都会优化策略，更不能保证改善收益。策略调优计划与工作区 Dream 反思计划不是同一开关。','After a review schedule is enabled, the Agent can inspect run history and propose changes. Insufficient evidence may lead to hold or skip; not every review improves a strategy or returns. Strategy tuning and workspace Dream reflection are separate schedules.'),
    steps([['收集运行记录和证据，说明问题与不确定性。','Collect run evidence and state the issue and uncertainty.'],['生成可审阅的提案与差异，保留验证结果。','Create a reviewable proposal and diff with validation results.'],['根据提案类型和策略审批，再应用、观察和必要时回滚。','Apply approval policy for the proposal type, then apply, observe and roll back when needed.']]),
    p('存在默认关闭、范围受限的自动应用路径，允许特定 prompt_patch 与 core_config_patch，并有保护路径和验证要求。不能泛称“所有变更自动上线”或“没有任何自动应用”。策略调优提案不属于该自动应用白名单。','A default-off, scope-limited auto-apply path exists for specific prompt_patch and core_config_patch changes, with protected paths and validation requirements. Neither “all changes go live automatically” nor “nothing can ever auto-apply” is accurate. Strategy tuning proposals are outside that auto-apply allowlist.')
  ]},
  {id:'security',tag:'SECURITY',title:['安全、凭据与权限','Security, credentials and permissions'],content:[
    rows([['控制','Control'],['边界','Boundary']],[
      ['Vault',['账户凭据通过 vault:// 引用使用；解密后的值可能存在于进程内存中','Account credentials use vault:// references; decrypted values may exist in process memory']],
      [['本地密钥','Local key'],['可使用显式口令或本机生成密钥；不要假定必须输入主密码','An explicit passphrase or a generated local key may be used; a master password is not always mandatory']],
      [['工具权限','Tool permissions'],['由权限配置和执行器判断，不由 SDK 的 caller 字段授权','Evaluated by permission configuration and the executor, not granted by the SDK caller field']],
      [['交易控制','Trading controls'],['账户能力、实盘开关、Risk Gate 与审批策略分别检查','Account capabilities, live enablement, Risk Gate and approval policy are separate checks']],
      [['变更保护','Change protection'],['受保护路径与提案审批约束变更通道，不等同整个主机的操作系统沙箱','Protected paths and approval constrain the proposal path, not an OS sandbox for the whole host']]]),
    p('标准依赖安装包含 cryptography，对应加密路径使用 scrypt 与 AES-GCM；源码仍存在缺少加密依赖时的兼容分支，因此不要假设所有部署都具备相同加密强度。尤其是实盘运行，应检查本机诊断与加密依赖。','A standard dependency installation includes cryptography, whose encryption path uses scrypt and AES-GCM. The source retains a compatibility branch when that dependency is absent, so do not assume identical encryption strength in every deployment. Check local diagnostics and crypto dependencies, especially before live execution.'),
    p('敏感文本扫描是启发式处理，不能保证任意密钥永不进入模型。避免把凭据放入提示、报告、代码示例或日志。不要将 localhost 的可达性视为外部暴露场景下的鉴权保证。','Sensitive-text scanning is heuristic and cannot guarantee that arbitrary secrets never reach a model. Keep credentials out of prompts, reports, examples and logs. Localhost reachability is not an authentication guarantee for externally exposed deployments.')
  ]},
  {id:'api',tag:'HTTP REFERENCE',title:['常用 HTTP 接口','Common HTTP endpoints'],content:[
    rows([['方法与路径','Method and path'],['用途','Purpose']],[
      ['GET /agent/tools',['查询工具目录与 schema','Tool catalog and schemas']],['POST /agent/run_turn',['发起一个 Agent 回合','Run an Agent turn']],['GET /agent/sessions',['列出会话','List sessions']],['GET /agent/session/transcript',['恢复对话和结构化内容','Restore transcript and structured content']],['GET /agent/stream/events',['分页获取进度事件','Page through progress events']],['POST /agent/interrupt',['协作式取消','Cooperative cancellation']],['POST /agent/steer',['向进行中的回合追加引导','Steer an active turn']],['POST /agent/trace',['重建关联执行轨迹','Rebuild the correlated execution trace']],['POST /agent/turn_state',['读取回合恢复状态','Read turn recovery state']]]),
    p('此表列出运行时路径。Dashboard 的 /api/proxy 前缀是前端代理，不要把它误当成 TypeScript SDK 默认 baseUrl 的一部分。内部 loopback 专用端点不应当作公共集成接口。','These are runtime paths. The Dashboard /api/proxy prefix belongs to the frontend proxy and is not part of the TypeScript SDK’s default baseUrl. Internal loopback-only endpoints are not public integration interfaces.')
  ]},
  {id:'migration',tag:'MIGRATION',title:['从旧接入方式迁移','Migrate an existing integration'],content:[
    rows([['旧做法','Old pattern'],['迁移到','Migrate to']],[
      [['只显示最终回答文本','Display only final reply text'],['保留 blocks、tool_trace、产物与停止状态','Preserve blocks, tool_trace, artifacts and stop state']],
      [['每个工具调用新建会话','Create a session per tool call'],['复用 session_id，用 turn_id 与 call_id 关联执行','Reuse session_id; correlate execution with turn_id and call_id']],
      [['默认 Python 和 TS 所有接口一致','Assume Python and TS APIs are identical'],['按实际 facade 调用，尤其注意 charts、取消与恢复能力','Use actual facades, especially for charts, cancellation and recovery']],
      [['Skill 的 YAML action 清单','YAML action catalogs for Skills'],['SKILL.md + scripts / references','SKILL.md + scripts / references']],
      [['把图表大数组放入提示','Put large chart arrays in prompts'],['发布 bulk 图表产物并保留 chart_id','Publish bulk chart artifacts and retain chart_id']],
      [['超时立即重新执行','Immediately rerun after a timeout'],['查询原回合状态与记录，避免重复副作用','Inspect the original turn and transcript before risking duplicate side effects']]]),
    note('首先匹配你安装版本的客户端与运行时。未知的 envelope 字段应保留；未知的 block 类型可降级为安全的结构化预览，不要直接丢弃或执行其中的代码。','First align your installed client and runtime versions. Preserve unknown envelope fields. Unknown block types may fall back to a safe structured preview rather than being discarded or executing embedded code.')
  ]},
  {id:'cli',aliases:['modules','status'],tag:'DIAGNOSTICS',title:['诊断与源码导航','Diagnostics and source map'],content:[
    code('Shell',`nerya --help
nerya doctor
nerya service status`),
    rows([['源码位置','Source location'],['用途','Purpose']],[
      ['nerya/agent/kernel.py',['统一 Agent 回合入口','Canonical Agent turn entry']],['nerya/agent/loop.py',['原生消息与工具循环','Native messages and tools loop']],['sdk/python/nerya_sdk/client.py',['公开 Python facade','Public Python facade']],['sdk/typescript/src/client.ts',['TypeScript HTTP 客户端','TypeScript HTTP client']],['nerya/api/routes_agent.py',['Agent HTTP 接口','Agent HTTP routes']],['nerya/sdk/agent_api.py',['进程内 Agent API','In-process Agent API']],['dashboard/lib/chartBlock.ts',['图表结构契约','Chart schema contract']],['dashboard/components/chat/ResearchReplyCards.tsx',['每次回复的研究卡片','Per-reply research cards']]]),
    p('排查时记录 request/turn/session 标识、停止原因和相关错误，不复制秘密值。当前页面是源码核对后的接入说明，不是对模型正确性、账户连接或真实下单链路的验收证明。','When debugging, record request/turn/session identifiers, stop reasons and relevant errors without copying secret values. This source-reviewed manual is not a validation of model correctness, account connectivity or live order execution.')
  ]}
];
