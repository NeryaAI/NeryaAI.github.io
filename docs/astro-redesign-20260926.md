# Astro + product-film pass

## Task lock

- Workspace: `/Users/rick/Documents/Project/Nerya/landing-page`, branch `main`.
- Goal: Astro-built landing with source-backed Agent frame followed by four animated demonstrations: strategy, team, evolution, Vault.
- Evidence: production build, built-route/resource checks, media frame verification, browser desktop/mobile, both themes and languages, reduced motion and frame navigation.
- Out of scope: agent backend/source writes, real models/accounts/orders, commit/push/deploy, unrelated existing changes.
- Existing root HTML and prior evidence remain intact as migration inputs; the new app lives in `src/`.

## Parallel ownership

- Main: reference review, Astro page/components/styles/controller and browser integration.
- Erdos: Astro tooling/configuration, static asset preparation, build checks and README run instructions.
- Copernicus: four original animated product walkthroughs and reproducible renderer.
- Hooke: current capability/security audit and concise bilingual feature data.

## Visual direction

The visitor is exploring a strategy workspace on a laptop in ordinary daylight, then inspecting a product film closely. Start with the existing light neutral/lilac identity and support a deliberate dark theme. Use generous product-film canvases and compact captions instead of instructional card grids. Preserve the cat and portraits; keep typography clean and conversational rather than the old italic display treatment.

## Status

Implemented Astro 7.3.5 static rendering with `src/pages/index.astro`, reusable native workspace and product-film components, bilingual feature data and a small client controller. No React hydration was added to the parent landing. The original React Agent bundle stays isolated in its frame and is copied byte-for-byte.

Reference page successfully opened in Ego; Jina extraction did not load its content. Oasis uses large looping `/core/feat_1.mp4` and `/core/feat_2.mp4` product scenes alongside concise copy. The new landing adopts the media-led rhythm, not its branding or source assets. Existing newer icon changes and static subpages are preserved.

Four authored 960×640 demonstrations each run for 9 seconds: strategy composition/workflow, parallel member research/shared evidence, session review/candidate diff, and encrypted local credential/reference/runtime handoff. Each ships as an actual GIF, a smaller H.264 MP4 and a populated WebP still. The generator is deterministic; source/provenance and media verification are recorded in `assets/product-demos/`.

Playback is viewport-aware, stops when hidden, supports individual/global pause, replay and three seekable stages. Reduced-motion users see stills until explicitly choosing to play. GIF playback is an optional inline format; no JavaScript falls back to a GIF or a still according to the reduced-motion preference.

Final local acceptance: Astro build; 106 output files and 169 local references; four distinct films; source-backed native app and deny-network CSP; deterministic fixtures; focused strict TypeScript; whitespace checks. `tools/qa-astro.mjs` passed ten browser groups covering playback/seeking, GIF embedding, offscreen suspension, reduced motion, four feature routes, four market workflows, draft handoff, locale/theme persistence, 320/390/768 widths and setup/keyboard behavior. Captures and `checks.json` live in `docs/astro-evidence-20260926/`.

The independent review found and verified three additional regressions: GIF fallback seeking, unrelated controls resetting GIF time, and background focus while the workspace is expanded. All three are fixed and passed focused browser tests in `tools/qa-astro-regressions.mjs`; see `regressions.json`.

Browser QA also exposed direct native `history.replaceState` calls escaping the static demo's hash route on the memory/review page. A narrow normalization shim was added to both `demo-src/theme.js` and `demo/theme.js`. The real bundled `app.js` and sibling Agent source were not changed or rebuilt. `tools/check-demo-routing.cjs` verifies hash/query preservation, duplicate suppression and origin boundaries. The source route package remains a public, isolated demonstration, not an authenticated runtime.

Main body contrast checks measured 5.52:1 (light), 5.05:1 (mint section), 8.79:1 (dark) and 7.66:1 (dark lilac). Media manifests verify 90 frames/9 seconds, real frame changes, GIF loop metadata, H.264 fast-start and byte budgets. These are focused checks, not a claim of a full accessibility/security audit.

No commit, push or deployment occurred. Preview remains running at port 4173. Existing user edits and staged asset-backup deletions were preserved.

## Runtime

Use `npm run dev` for Astro development or `npm run build && npm run preview` for the static result at `http://127.0.0.1:4173`. This pass does not use the former Python server. Publish `dist/` at the domain root after separate authorization; root legacy `index.html` is retained as a migration input and is not the new entry point. No automatic backend/demo source rebuild, Git commit, push or deployment is performed.
