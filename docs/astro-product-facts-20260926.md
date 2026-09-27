# Nerya feature copy facts · 2026-09-26

## Scope and content contract

This pass owns only `src/data/product.ts` and this document in `/Users/rick/Documents/Project/Nerya/landing-page` on `main`. The source repository `/Users/rick/Documents/Project/Nerya/agent` is read-only. Its inspected base is `main` at `1d510e1`, with uncommitted changes; citations refer to the working files, not a released version.

No credentials, live user workspace, running service, browser, external write, build, commit or deployment was used. This is a source-backed copy review, not a security audit or runtime acceptance test. Existing unrelated changes remain outside scope.

`product.ts` exports `LocalizedText`, `ProductFeature`, `hero`, `features`, `markets` and `connectorAuthoring`. Each feature has the requested ID, bilingual title/description/CTA, three bilingual steps, an internal demo route and optional detail. The order is strategy → team → evolution → vault. Market categories and connector authoring remain secondary. The hero is an editable suggestion:

> 把策略想法 / 交给 Agent 团队
>
> Bring your strategy ideas / to an Agent team

Copy follows stop-slop: concrete actions, short sentences, no sales superlatives or rhetorical reversals. Titles contain no periods or commas. “Fast creation” is expressed through a direct conversational workflow, without a timing promise. No performance, profit or automatic-success claim is supported by this review.

## Feature evidence

All agent paths below are under `/Users/rick/Documents/Project/Nerya/agent`.

| Feature | Defensible wording | Current source |
| --- | --- | --- |
| Strategy creation | Describe intent in the main Agent conversation; the authoring workflow writes a candidate, validates it and inspects replay results. | [strategy_author/SKILL.md:27](/Users/rick/Documents/Project/Nerya/agent/nerya/skills/builtin/strategy_author/SKILL.md:27), steps at lines 85–91 |
| Strategy explanations | Show logic, reasons, scope and evidence limits alongside saved strategy code. | [strategy_author/SKILL.md:13](/Users/rick/Documents/Project/Nerya/agent/nerya/skills/builtin/strategy_author/SKILL.md:13), lines 13–20 |
| Multi-agent research | Run research tasks in parallel, respect dependencies, then perform risk review and synthesis. | [teams/templates.py:194](/Users/rick/Documents/Project/Nerya/agent/nerya/teams/templates.py:194), lines 194–229; [teams/orchestrator.py:529](/Users/rick/Documents/Project/Nerya/agent/nerya/teams/orchestrator.py:529), lines 529–578 |
| Completion boundaries | Missing required tasks or evidence can block a team run even when a report exists. | [teams/orchestrator.py:336](/Users/rick/Documents/Project/Nerya/agent/nerya/teams/orchestrator.py:336), lines 336–356 |
| Scheduled review | Strategy tuning has its own schedule, separate from trading. The runner checks that tuning is enabled and builds context from run evidence. | [strategies/scheduler_bridge.py:14](/Users/rick/Documents/Project/Nerya/agent/nerya/strategies/scheduler_bridge.py:14), lines 14–42; [strategies/evolution.py:284](/Users/rick/Documents/Project/Nerya/agent/nerya/strategies/evolution.py:284), lines 284–308 |
| Review output | Write a review record; accepted recommendations can create a tuning proposal in `pending_review`. A dry run does not create that proposal. | [strategies/evolution.py:505](/Users/rick/Documents/Project/Nerya/agent/nerya/strategies/evolution.py:505), lines 505–550; [strategies/evolution.py:773](/Users/rick/Documents/Project/Nerya/agent/nerya/strategies/evolution.py:773), lines 773–798 |

These sources establish implemented workflows and authoring instructions. They do not establish that a particular model produced a correct strategy, a schedule is enabled, or a review improves returns.

## Autonomous review and proposal boundaries

- Strategy tuning must be enabled. Review may hold or skip; do not promise a change after each run. The minimum-evidence branch can return `hold`: [strategies/evolution.py:310](/Users/rick/Documents/Project/Nerya/agent/nerya/strategies/evolution.py:310), lines 310–325.
- Workspace-wide Dream reflection is a separate schedule. Its payload sets `tuning: false` and `trading: false`; initialization leaves it disabled: [periodic_reflection.py:57](/Users/rick/Documents/Project/Nerya/agent/nerya/evolution/periodic_reflection.py:57), lines 57–88. Enabling Dream alone is not evidence that every strategy will tune itself.
- Applying a proposal requires state `approved`, protected-scope checks and applicable validation gates: [promotion.py:186](/Users/rick/Documents/Project/Nerya/agent/nerya/evolution/promotion.py:186), lines 186–205. Strategy tuning proposals do not belong to the auto-apply kind allowlist.
- An opt-in auto-apply path exists; saying “nothing ever applies automatically” would also be inaccurate. It defaults to disabled and permits only `prompt_patch` and `core_config_patch`, fixed path patterns, at most four files and 200 changed diff lines, with passed validation. See [auto_apply.py:45](/Users/rick/Documents/Project/Nerya/agent/nerya/evolution/auto_apply.py:45), lines 45–79 and 89–135. The path stamps approval before calling the shared apply function: lines 160–173.
- That path records an observation window and checks failing observations for rollback. This is bounded code behavior, not a promise that every regression is detected: [auto_apply.py:23](/Users/rick/Documents/Project/Nerya/agent/nerya/evolution/auto_apply.py:23), lines 23–25 and 175–204.
- Protected targets include Vault files, account records, risk settings, approval policy, the live switch, kill switch and auto-apply configuration: [patch_proposal.py:20](/Users/rick/Documents/Project/Nerya/agent/nerya/evolution/patch_proposal.py:20), lines 20–47. This protection describes the proposal pathway, not a host-wide sandbox.

Approved copy: “启用复盘计划后，Agent 分析运行记录并提出调整建议 / Enable a review schedule and let the Agent examine run history and propose changes.” Keep strategy-update approval visible. Avoid “fully autonomous strategy upgrades” or “changes go live without approval.”

## Vault facts and limits

### Encryption at rest

The normal encryption path derives a 32-byte key with scrypt (`N=2^14`, `r=8`, `p=1`), uses a random 16-byte salt and 12-byte nonce, and calls AES-GCM. Vault flush seals the serialized values before writing the envelope. Sources: [security/encryption.py:48](/Users/rick/Documents/Project/Nerya/agent/nerya/security/encryption.py:48), lines 48–74; [security/secrets.py:200](/Users/rick/Documents/Project/Nerya/agent/nerya/security/secrets.py:200), lines 200–216.

`cryptography` is a declared installation dependency: [pyproject.toml:16](/Users/rick/Documents/Project/Nerya/agent/pyproject.toml:16). However, the source retains a SHA-256/XOR fallback when that import is unavailable. There is no test-environment guard around the fallback. Therefore “standard installations use AES-GCM and scrypt” is defensible; “the Vault always uses strong encryption” is not. This pass did not inspect the installed crypto backend or any encrypted file.

### Master password and local key

`SecretVault.open` accepts an explicit passphrase or `NERYA_VAULT_PASSPHRASE`. Without either, the local-launch path creates a random workspace key and checks owner-only file access. It also contains legacy-key recovery/migration behavior. Sources: [security/secrets.py:36](/Users/rick/Documents/Project/Nerya/agent/nerya/security/secrets.py:36), lines 36–78 and 114–162.

Do not claim a user-entered master password is mandatory, that only the user can decrypt the Vault, or that all keys live in a hardware enclave. The adjacent local key and ciphertext are not protection against an attacker who can read both. Desktop Keychain behavior is mentioned in source comments but was not independently traced in this pass; it is not used as a public claim.

### References and plaintext

Account intake writes new credential values to the Vault and returns `vault://` references: [trading/account_intake.py:454](/Users/rick/Documents/Project/Nerya/agent/nerya/trading/account_intake.py:454), lines 454–482. Public metadata exposes a reference, preview and fingerprint: [security/secrets.py:91](/Users/rick/Documents/Project/Nerya/agent/nerya/security/secrets.py:91), lines 91–98.

The Vault decrypts values into an in-process cache, and `resolve()` returns plaintext. Its scope check runs when the caller supplies `required_scope`; it is not unconditional: [security/secrets.py:164](/Users/rick/Documents/Project/Nerya/agent/nerya/security/secrets.py:164), lines 164–197 and 256–264. Do not claim plaintext never exists, each use immediately erases the key, or the Vault alone enforces every tool permission.

### Model exposure

The inspected gateway path scans message text and forwards redacted text: [api/routes_gateway.py:2709](/Users/rick/Documents/Project/Nerya/agent/nerya/api/routes_gateway.py:2709), lines 2709–2729. The scanner swaps recognized secret patterns for placeholders, but its own threat model calls detection heuristic and notes possible misses: [security/secret_scanner.py:11](/Users/rick/Documents/Project/Nerya/agent/nerya/security/secret_scanner.py:11), lines 11–38.

Use the narrow account-reference claim. Avoid “the model can never see a secret,” “paste any secret safely,” or an all-chat/all-tool non-disclosure guarantee. This review did not establish coverage of every input, attachment, tool result, log or model adapter.

### Permission and approval gates

Vault storage, tool permissions, order risk checks and proposal approvals are separate controls. The real-money submission path checks the kill switch, runtime enablement, account order capability, strong crypto availability and passphrase-environment presence: [trading/submit.py:219](/Users/rick/Documents/Project/Nerya/agent/nerya/trading/submit.py:219), lines 219–237. It evaluates RiskGate at line 658 and reaches conditional ApprovalGate handling at lines 719–735. Policy-based auto-approval also exists; do not imply a manual click for every order.

Native-tool policy also varies by permission mode. Even YOLO mode retains deny rules while leaving trading invariants to the domain handlers: [tools/permissions.py:37](/Users/rick/Documents/Project/Nerya/agent/nerya/tools/permissions.py:37), lines 37–48. These checks support “execution remains subject to permissions and risk rules.” They do not prove a hardened host, a universal permission boundary for arbitrary code, or protection from all malicious tools. Gate checks must not be credited to encryption alone.

## Secondary market and connector content

Keep the existing four research categories: crypto, prediction markets, futures and A-shares. Their demo examples and IDs are present in [capabilities-data.js:3](/Users/rick/Documents/Project/Nerya/landing-page/capabilities-data.js:3), lines 3–6, and projected into demo strategy rows by [demo-src/fixtures.ts:12](/Users/rick/Documents/Project/Nerya/landing-page/demo-src/fixtures.ts:12), lines 12–14. Category descriptions are research use cases, not a promise of equal broker support or execution availability.

Do not copy old execution disclaimers from that demo dataset as current backend facts. The inspected backend contains a Polymarket order path with explicit restrictions ([connectors/polymarket.py:303](/Users/rick/Documents/Project/Nerya/agent/nerya/connectors/polymarket.py:303)) and an IBKR `place_order` implementation ([connectors/ibkr.py:210](/Users/rick/Documents/Project/Nerya/agent/nerya/connectors/ibkr.py:210)). Their presence does not establish a working account, advertised capability, or verified execution. This pass changes neither the old demo dataset nor connector code.

Natural-language integration requests remain supported as an authoring workflow: inspect existing connectors, map the required API and prepare a reviewable proposal. The adapter instructions prefer existing CCXT/provider routes and require proposal packaging: [adapter/SKILL.md:11](/Users/rick/Documents/Project/Nerya/agent/nerya/skills/builtin/adapter/SKILL.md:11), lines 11–19 and 53–61.

Important distinction: the native provider-proposal handler currently stages a `provider.md` plan and explicitly lists connector implementation as a separate approval step: [tools/native/evolve.py:537](/Users/rick/Documents/Project/Nerya/agent/nerya/tools/native/evolve.py:537), lines 537–604. Do not describe that tool alone as generating, installing and validating a working connector. The public demo also returns an integration plan: [demo-src/content.ts:31](/Users/rick/Documents/Project/Nerya/landing-page/demo-src/content.ts:31), lines 31–34.

## Demo route contract and acceptance

`route` is an internal hash route, not a live-service URL. A consuming page should form `/demo/#${route}`. [demo-src/navigation.tsx:3](/Users/rick/Documents/Project/Nerya/landing-page/demo-src/navigation.tsx:3) reads the hash; [demo-src/entry.tsx:16](/Users/rick/Documents/Project/Nerya/landing-page/demo-src/entry.tsx:16) handles chat sessions and page lookup. The existing `demo/source-manifest.json` lists `agents`, `self-evolution`, `settings` and `strategies`.

| Feature | Route | CTA scope |
| --- | --- | --- |
| Strategy | `/chat/demo-strategy` | Sample strategy conversation |
| Team | `/agents` | Agent library/team surface |
| Evolution | `/self-evolution` | Review and proposal surface |
| Vault | `/settings` | General settings entry |

The Vault CTA says “查看设置 / Explore settings,” not “open the Vault panel.” Current source mounts the dedicated controls only with `forceSection === 'envvault'`: [SettingsWorkspace.tsx:3298](/Users/rick/Documents/Project/Nerya/agent/dashboard/components/SettingsWorkspace.tsx:3298). That dedicated page is `/env-vault`; it is outside the requested four feature routes.

The current demo's `postMessage` route allowlist does not include `/settings`: [demo-src/mock.ts:164](/Users/rick/Documents/Project/Nerya/landing-page/demo-src/mock.ts:164). Use a direct demo hash link for the settings CTA; do not assume an existing iframe message opens it. Changing the host or message handler is outside this pass.

The demo uses isolated in-memory transport: [demo-src/build.mjs:25](/Users/rick/Documents/Project/Nerya/landing-page/demo-src/build.mjs:25), lines 25–28. Demo navigation does not create a real strategy, execute research, change a real Vault or connect an account. No browser or actual-model validation is claimed.

Verified for this data-only pass: strict TypeScript compilation without output; exact feature IDs and three bilingual steps; four market categories; bilingual-field and title-punctuation assertions; internal route/fixture checks; source-link file/line checks; whitespace and conflict-marker checks. These checks use the existing compiler and Node with no dependency installation. Node reported a module-type warning while importing TypeScript; changing package configuration is outside ownership. Rendering, page integration and live-service behavior remain unverified and outside ownership.
