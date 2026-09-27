# Current Agent UI and high-density recording refresh

## Task lock

- Update `landing-page` / main only. Read current `agent/dashboard` / main as the UI source.
- Preserve the Astro shell, mascot role set, themes and scroll reveal. No Agent source edits, real models/accounts/orders, deployment or service restart.
- Acceptance: all bundled source hashes match current files; new workbench protocol works in the isolated demo; six new real-page recordings use native 2× pixels; decoded frames, text crops and actual rendering verified; build/check and focused browser regression pass.

## Initial evidence

The prior bundle was built on 2026-09-23 from 238 source files. 67 recorded files differ from current source. Rebuilding current source produces 293 files and 21 routes, including the new sidebar and conversation workbench. The new UI requires protocol1 conversation commands and session views; the previous fixtures did not implement them.

The previous clips are 1280×800, captured at DPR1. The current browser reports DPR2 and1160CSS pixels for each film, needing2320physical pixels. The source bitmap is enlarged1.8125× at that display density. New recordings must render at DPR2, not upscale existing files. Retain raw PNGs and encode from those originals.

Prior bundle recovery copy: `.tmp/ui-refresh-20260926/demo-before`. Current preview stays on4173. User-owned pre-existing changes and the unrelated live Agent tab remain untouched.

## Implemented

- Rebuilt from all293 current Agent source files and21 page routes. `check:demo-source` verifies every imported source hash and route set against the working copy without modifying it.
- Implemented the current protocol1 command/session-view fixtures instead of hiding the incompatible-runtime notice. Admission is idempotent, work is queued per session, revisions protect controls and explicit stop cancels the in-memory job. Existing scenario replies, history, member views and local-only transport are retained.
- Recorded all six current UI flows again.704 actual PNG frames at2560×1600 came directly from the browser renderer at DPR2. The old helper explicitly used CSS-scale screenshots, reducing them to1280×800; the new recorder asserts physical dimensions on every frame.
- MP4: native2×, H.264 CRF14/slow. GIF: native2×, full256-color palette without spatial dithering. Posters: lossless WebP retaining the original ICC color profile. No upscaling, drawing or AI reconstruction was used in the published media.
- New role-specific assets, including the quant portrait loaded by A-share workflows, are included in pre-capture source checks. Browser targets use non-visual data attributes because raw screenshot CDP calls invalidate transient snapshot refs.

## Acceptance

- `npm run build`, `npm run check`, `npm run check:demo-source`, recorder decode/hash verification and whitespace checks passed.
- Ten browser groups passed against the refreshed bundle and six2560×1600 media files: playback, pause/replay/seek, GIF fallback, offscreen and reduced-motion states, current native routes, four markets, editable draft transfer, locales/themes, mobile and setup keyboard flow.
- All six decoded posters are pixel-identical to their raw captures after color interpretation. `tools/check-media-quality.mjs` retains a same-current-UI comparison: left simulates the old1× sampling path; right is decoded directly from the new GIF. It is labelled as a controlled comparison, not a claimed screenshot of the old UI.
- Evidence: `docs/ui-refresh-evidence-20260926/`. Raw captures and the previous bundle/media remain in ignored `.tmp/` for recovery and local quality checks.

No original Agent source, account, model, trading service, deployment or Git commit was changed. Preview remains on4173. Clips use deterministic local data; the interface itself is bundled from the current Agent source.
