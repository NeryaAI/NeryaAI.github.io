# Landing and embedded Agent

The landing uses `index.html`, `landing.css`, `landing.js`, `landing-data.js`, and `landing-motion.js`.
The product area embeds `demo/index.html`: an actual build of the sibling Nerya dashboard, not an independently designed substitute.

## Local preview

From the landing repository:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Serve over HTTP rather than opening the HTML via `file://`, because the embedded app uses ES modules.
The generated static files can be hosted together without a Node server.

## Rebuild the source-backed frontend

```sh
npm install
npm run build:demo
npm run check
```

`demo-src/build.mjs` reads `../agent/dashboard` by default; `NERYA_DASHBOARD_SOURCE` can select another checkout. It requires that dashboard's dependencies. It never edits the source dashboard.

The build retains the real shell, routes, Agent home/chat/input, member conversations, workspaces, files, workflow canvas, node editors and settings components. Build adapters provide hash navigation, relative branding paths, local UI state, and generic provider labels. `demo/source-manifest.json` records input hashes and build adaptations.

## Scenario data and safety

- `demo-src/content.ts`: authored research, strategy and review narratives.
- `demo-src/fixtures.ts`: graph data, paper portfolio, schedules, tasks and memory contracts.
- `demo-src/mock.ts`: isolated storage, deterministic chat activity and in-memory API responses.
- The frame does not read real auth storage and has no passthrough network client.
- CSP uses `connect-src 'none'`. Unknown runtime mutations fail closed.
- Changes inside the embedded app reset on reload. They do not mutate the real dashboard, runtime or account.
- Synthetic financial records remain paper-mode records; the landing footer identifies the experience as simulated.

## Media

Two new illustrations were generated through ChatGPT in Ego Browser with four supplied-site screenshots and Nerya character art uploaded before generation. Provider/model selection, original and display-file hashes, prompts, and exact slots are recorded in `assets/generated/provenance.json`.

Role portraits use six local PNGs from the Lorelei artwork distributed through DiceBear (CC0 1.0). `agent-avatars.js` shares role mapping across the landing and the embedded app. `demo-src/avatar-adapter.mjs` adds portraits during the static build without editing dashboard source. See `assets/agent-avatars/NOTICE.md` and `provenance.json` for attribution and hashes.

The landing supports persisted light/dark themes and synchronizes the choice into the embedded Agent. `capabilities-data.js` owns four market templates and the guarded evolution/adapter-plan state models. Browser-only controls never enable an external connection.

## Acceptance

`tools/check-landing.cjs` checks source provenance, resources, anchor targets, safety and excluded branding. `tools/check-demo.mjs` checks populated strategy graphs and state transitions. `tools/qa-real-agent.mjs` runs the actual UI in an explicitly selected Ego task space; adjust its task/page handles for a new session instead of creating arbitrary browser contexts.

Evidence and machine-readable checks are in `docs/redesign-evidence-20260921/`. Older first-pass screenshots and failed probes remain as historical evidence, not final acceptance.

Current additional checks: `tools/check-capabilities.cjs`, `tools/check-avatars.cjs`, `tools/qa-capabilities.mjs` (9 groups), and `tools/qa-avatars-copy.mjs` (7 groups). The default Chinese landing copy was reduced by 24.4% using Hardik Pandya's Stop Slop guidance; safety qualifications were retained.
