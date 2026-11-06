# Nerya RSI positioning notes · 2026-10-30

This note records the research boundary behind the Recursive Self-Improvement
language on the landing page. It is product positioning, not a claim that the
website demo performs live trading or that Nerya autonomously rewrites its own
runtime.

## What the research says

1. Modern RSI demonstrations are structured around a proposal-and-evaluation
   loop. Darwin Gödel Machine explores self-modifying agents, but validates
   changes on coding benchmarks and reports sandboxing and human oversight.
2. AlphaEvolve makes the pattern legible for a broader audience: language
   models generate candidate programs, automated evaluators score them, and an
   evolutionary archive keeps the strongest directions for further search.
3. The AI Scientist frames open-ended discovery as an iterative research loop:
   generate ideas, implement experiments, inspect results, review, and add
   useful ideas to a growing archive. It also calls out failure modes and the
   continuing role of human scientists.
4. Agent design guidance consistently emphasizes environmental ground truth,
   explicit checkpoints, bounded iterations, and guardrails when an Agent can
   act for multiple turns. The right product story is therefore not
   “autonomy everywhere”; it is “autonomy where evidence is available, with
   clear stopping and approval boundaries.”

## Nerya's translation

Nerya uses “bounded Recursive Self-Improvement” to mean improvement at the
strategy layer:

`run history → diagnosis → candidate diff → independent challenge → validation → human promotion`

The assistant Agent is the front door. It turns a natural-language objective
into research and strategy work, then returns artifacts that can be inspected
in the workspace. Specialist Agents add parallel research, review and risk
perspectives. The runtime, risk boundary and execution authorization are not
silently changed by the loop.

## Message architecture for VC and partner audiences

- **Wedge:** a local-first quantitative research workspace that turns one
  trading idea into strategy, evidence and reviewable artifacts.
- **Moat:** a growing run/evidence/candidate archive, not a generic model
  wrapper. Each accepted change can be tied to its input window, rationale,
  validation and operator decision.
- **Assistant value:** one conversational entry point for research, strategy
  authoring, review, connector requests and next-step decisions.
- **Trust boundary:** paper/backtest/live are separate states. Risk Gate and
  human Approval Gate remain visible. A candidate is not an active strategy,
  and a backtest is not an investment return promise.
- **Partner surface:** connectors, data contracts, evaluator design and
  auditable promotion are natural integration points for market-data,
  execution, research and infrastructure partners.

## Sources

- Darwin Gödel Machine, arXiv: https://arxiv.org/abs/2505.22954
- AlphaEvolve, Google DeepMind: https://deepmind.google/discover/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms/
- The AI Scientist, Sakana AI: https://sakana.ai/ai-scientist/
- Building effective agents, Anthropic: https://www.anthropic.com/research/building-effective-agents
- QuantArena benchmark, arXiv: https://arxiv.org/abs/2508.00985

