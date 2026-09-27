# Website: Agent / SDK, localized films and research outputs

Updated the existing `landing-page` project, not the Nerya runtime. The local
Astro preview serves `dist` on `http://127.0.0.1:4173`. No account connection,
model invocation, order submission, Git commit/push or public deployment was
performed by this website upgrade.

## Authoring surfaces

- Homepage: `src/pages/index.astro`, `src/components/ResultShowcase.astro`,
  `src/scripts/results.ts`, `src/styles/showcase.css`.
- Canonical documentation: `src/data/manual.mjs` → `tools/render-docs.mjs`
  → `docs.html`. Edit the source, not generated HTML. `docs-v2.js/css` own
  filtering, mobile navigation, code-copy feedback, language and styling.
- Media selection: `ProductFilm.astro` and `src/scripts/site.ts`. Six scenes
  each have `zh-light`, `zh-dark`, `en-light`, `en-dark` recordings. Each variant
  has MP4, GIF and a real-frame WebP poster. Off-screen video is not downloaded
  until needed. Paused GIFs use their matching poster.
- Embedded scrolling: the early `demo-src/theme.js` / `demo/theme.js` hook
  keeps native autofocus and transcript scrolling inside the iframe. It does
  not disable manual page scrolling or intentional navigation to the workspace.

## Documentation contract

Eighteen bilingual sections cover the native Agent, public Python/TypeScript
SDK facades, sessions, cursor/epoch event replay, tools and Skills, collaboration,
chart artifacts, reports, strategies, review, security, HTTP and migration.
Python is in-process; TypeScript is an HTTP client. The manual does not invent
an `AgentSDK` constructor or assume a public npm release. The correct foreground
startup is `nerya run`, not the nonexistent `nerya service start`.

The `/docs.html` URL and historic documentation fragment IDs remain available.
Homepage Skills and SDK-example links now lead to the canonical manual. The
older standalone skills/recipes files are preserved rather than overwritten.

## Evidence and verification

```sh
npm run build
npm run check
npm run check:upgrade
../agent/dashboard/node_modules/.bin/tsc --noEmit --target ES2022 \
  --module ESNext --moduleResolution bundler \
  --lib ES2022,DOM,DOM.Iterable --skipLibCheck \
  src/scripts/site.ts src/scripts/results.ts
```

`check:upgrade` validates 24 captured language/theme variants, 72 published
media files, capture-source hashes, four distinct posters per scene, bilingual
sections, retained fragments and sample-data disclosure. Captures contain 1,292
native screenshots, not painted approximations of the Agent. The isolated demo
uses synthetic fixtures and does not represent live model/account execution.
The older six unsuffixed recordings and their provenance were preserved.

Browser evidence lives in `docs/website-upgrade-evidence/browser-qa.json` with
screenshots. The task-specific Ego harness (`tools/qa-website-upgrade.mjs`) uses
the existing task-owned browser space 27; it is an evidence script for this
session, not a command to attach to an arbitrary future browser task. Re-running
capture/QA in another task requires that task's explicit browser context.

The four homepage output cards and full-report dialog use explicitly labeled
illustrative data. Their numerical values are not live quotes, executed
backtests, investment recommendations or promises of returns.
