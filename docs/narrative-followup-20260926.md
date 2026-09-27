# Centered workspace + authored product stories

This follow-up supersedes the homepage composition and screen-recording
presentation in `website-upgrade-20260926.md`. It keeps the Agent/SDK manual,
the isolated native workspace, and all pre-existing user files and recordings.
Only the existing `landing-page` project was edited. The product runtime was
read to generate component excerpts; no product source file was modified.

## Homepage

- The upper-right result card was removed from the hero. Result tabs and the
  five-part research report remain in a dedicated section farther down.
- Workspace now belongs to the hero, centered behind the slogan. On eligible
  desktops it starts at 34 degrees with a vertical lift, then follows native
  page scrolling over most of a viewport until upright. No automatic scroll,
  wheel hijack, or timed jump was added.
- Input freezes the target through the native click, then settles the workspace
  for editing. Expanded mode removes the perspective containing block, keeps
  its viewport-fixed bounds, and supports Escape. Mobile, coarse pointers,
  reduced motion and no-JavaScript layouts use the ordinary upright layout.
- The decorative scanning layer has its own paint/overflow containment so it
  cannot create an intermittent horizontal scrollbar.

## Six authored stories

`ProductStory.astro`, `narrative.css` and `stories.ts` implement strategy,
team research, review/diff, Vault references, market context and connector
authoring. These are animated HTML/SVG compositions, not full-page recordings.
All visible story labels follow the homepage language and colors follow the
theme. Each has three seekable chapters, pause and replay; offscreen/hidden
scenes stop advancing. Reduced motion presents readable still compositions.

`NativePart.astro` embeds static excerpts rendered from the actual product
`SummaryCards` and `ResearchAssetCard` components, with clearly synthetic
fixtures. `tools/render-native-parts.mjs` uses React server rendering: effects,
event handlers, hydration and API calls do not run. The excerpts are inert;
the working interactive product surface remains the isolated Workspace.
Both locale snapshots have distinct SVG identifiers. Their source hashes are
recorded in `src/data/native-parts.provenance.json`.

The saved component snapshots are build inputs. A normal website build does
not regenerate them or require the product repository. Refresh deliberately
with `npm run snapshot:parts` when the source components change.

## Verification

```sh
npm run build
npm run check
npm run check:upgrade
../agent/dashboard/node_modules/.bin/tsc --noEmit --target ES2022 \
  --module ESNext --moduleResolution bundler \
  --lib ES2022,DOM,DOM.Iterable --skipLibCheck \
  src/scripts/site.ts src/scripts/results.ts src/scripts/stories.ts \
  src/scripts/workspace-reveal.ts
```

`tools/qa-narrative.mjs` is the task-specific browser acceptance harness for
the existing authorized Ego space 27. It checks entry scroll, hero geometry,
scroll-linked pose, expansion, all six scene timelines, theme/locale changes,
retained report interaction, 768/390/320 px layouts and reduced motion.
Incremental results and screenshots live in `docs/narrative-evidence/`.
Its fixed browser context is not a generic command for unrelated tasks.

Old recording assets and their provenance remain intact for prior uses, but
the homepage contains no video and requests none of those recordings. The
existing preview on `127.0.0.1:4173` serves the rebuilt `dist/`. No commit,
push, public deployment, model request, account binding or order was made.
