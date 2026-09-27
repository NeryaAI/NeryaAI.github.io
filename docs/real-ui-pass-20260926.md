# Real-screen films and mascot-role pass

## Active outcome

Replace the authored UI illustrations with recordings from the actual source-backed Agent interface; add recordings for markets and connector authoring; remove Security from navigation; revise the slogan and add scroll-linked workspace perspective. Generate twenty new role portraits through GPT Pro Think with the original mascot and logo uploaded, then use the same role assets in the landing, embedded app and actual Agent dashboard.

## Scope

- `landing-page` main: Astro content, safe demo fixtures, recording and image assets, QA.
- `agent` main: narrow dashboard avatar presentation only; preserve existing dirty edits.
- No backend changes, real model/order/account actions, deployments, commits or restarts.

## Ownership

- Main: GPT Pro Think reference upload/generation, asset verification, integration and final QA.
- Kant: navigation, slogan, six media sections and scroll-uprighting workspace.
- Bohr: real native-page recording and reproducible media provenance.
- Maxwell: stable twenty-role avatar mapping and dashboard/demo integration.

The two approved input references are `assets/nerya-mascot.webp` (purple-haired illustrated character) and `assets/nerya-logo.webp` (pixel-cat insignia). Do not replace these with the prior DiceBear avatars or a textual description when uploading.

## Asset milestone

- GPT Pro Think ran through Ego space23, ChatGPT Latest + Extra high. Both exact reference files were uploaded and verified as loaded removable attachments before the first send.
- The first response produced one portrait, not ten. It is retained as a style exploration, not counted as twenty outputs.
- In the same reference conversation, a follow-up generated an inspected 5×4 atlas with twenty distinct role portraits. `tools/install-mascot-avatars.mjs` performs regular-grid crops and lossless indexed-PNG encoding at 256px; no replacement artwork was painted locally.
- Canonical files: `assets/agent-avatars/{role}.png`. `tools/sync-role-avatars.mjs --check` confirmed byte-identical files in the actual dashboard and embedded demo. All twenty together are 886,103 bytes.
- Original DiceBear files and notices were preserved in `.tmp/legacy-role-avatars-20260926/`; the visible files and current notice now use the generated Nerya cast.
- The successful image run was extracted with code0 and its task tab was cleaned up. Source prompts, upload-reference hashes, atlas hash, crop rectangles and image hashes are retained.

## Compatibility work

The installed GPT Pro Think script had outdated UI selectors. Following its intervention runbook, small compatibility changes were made in `/Users/rick/.skills-manager/skills/gpt-pro-think/search.js` for the observed model-picker button, numeric effort slider, attachment-remove labels, generated-image gallery and user-message marker. Existing unrelated changes in that file were preserved. A prompt had already been accepted despite the old send detector; the caller was stopped without stopping ChatGPT, and the same conversation was resumed for waiting/extraction. The original reference prompt was not resent.

The isolated Demo bootstrap now imports the unchanged real `app.js`, then installs narrowly allowlisted, memory-only Vault and learning-timeline fixtures. Twelve tests cover request boundaries, invalid inputs, aborts and state. Native card IDs containing encoded `?tab=` are normalized before the hash router reads them. No actual vault, account, model or trading runtime is touched.

## Remaining acceptance

All six native recordings are encoded and independently verified: 1280×800, approximately 16–16.5 seconds, MP4 + real GIF + an actual captured poster. The strategy poster was changed to a genuine workflow frame rather than the final editor modal. Each manifest records served-source hashes, actual frame hashes/timestamps, native action refs, request audit, no demo errors and stable source checks.

The source-only reveal test caught native CommandHome's automatic input focus cancelling the initial tilt. The controller now separates that autofocus from keyboard/pointer intent. Native pointer hit geometry stays frozen through the click, typing/tab focus settles it, and explicit workspace handoffs settle via an event. The automated-initial-focus regression and focused strict TypeScript now pass.

## Final local acceptance

- Astro build and `npm run check` pass: 154 published files, 182 local references, six native recordings, 682 genuine captured frames, twenty portraits, fixture boundaries and reveal contracts.
- Ten browser groups pass in `docs/native-evidence-20260926/checks.json`: all six video/GIF players, chapters, pause/replay, reduced motion, source-backed routes, four markets, editable connector draft handoff, both locales/themes, mobile widths and setup/keyboard behavior.
- Three focused regressions pass in `regressions.json`: expanded workspace background isolation/focus restoration, active GIF clock preservation, and playable GIF fallback after a media error.
- The real scroll test records 16° at scroll0, about7° at scroll250 and0° at scroll464. Initial native autofocus does not cancel the reveal. A screenshot-grounded pointer click in the tilted frame opens the intended Agent page, settles upright and displays new256px avatars. See `workspace-checks.json` and the three pose screenshots.
- Ego's structured iframe locator does not compensate for perspective and initially hit the adjacent link. The first-click acceptance therefore uses a point inspected in the actual screenshot. Its native pointer transport also emits a2ms hidden/visible pulse; the unrelated-GIF-handler regression is checked within one visible page epoch, while real hidden-tab pause remains intact. These are documented harness limits, not masked product checks.
- Dashboard `./node_modules/.bin/tsc --noEmit` passes. Eleven avatar contract tests and twelve supplemental-fixture tests pass. User-owned dirty changes remain preserved; the avatar worker's baseline manifest is at `/tmp/nerya-role-avatar-baseline.4zHyix/implementation-manifest.json`.

The preview remains at `http://127.0.0.1:4173`. No commit, push, deployment or existing Agent service restart occurred. Only frontend avatar source/assets changed in the separate Agent repository.

Known retained limits: recordings use the isolated native UI with deterministic data, not real account/model actions; CDP screenshots omit the OS cursor; native labels/fixture text visible in the source UI are retained. The current frozen demo displays its original six role slots with the new portraits, while all twenty files and the new role resolver are available in the website and dashboard source.
