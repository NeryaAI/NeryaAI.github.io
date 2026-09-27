# Nerya website · React

The current website uses **React, Vite, TypeScript, Tailwind CSS v4 and
framer-motion**. Astro is no longer part of the active build. The complete
homepage and Agent SDK manual are React pages, prerendered to static HTML and
hydrated in the browser.

```sh
npm ci
npm run dev
# http://127.0.0.1:4173/

npm run build
npm run typecheck
npm run check
npm run preview
```

Edit `src/App.tsx` for the homepage, `src/Manual.tsx` and `src/data/manual.mjs`
for documentation, and `components/ui/` for reusable components. The shared
directory has the shadcn aliases in `components.json`. Publish only `dist/`.
The interactive Mock is isolated; website actions do not reach real accounts.

See [React integration and effects](docs/react-migration-and-effects.md) for
the current file map, behavior, reference components and verification commands.

<details>
<summary>Historical design notes (retired implementations, not current setup instructions)</summary>

<p align="center">
  <img src="assets/nerya-mascot.png" alt="Nerya mascot" width="220" />
</p>

<div align="center">

# NeryaLanding

### The cinematic, WebGL-driven landing page for [Nerya](https://github.com/NeryaAI/Nerya).

Standalone. Static. Deploy anywhere.

[English](README.md) · [简体中文](README.zh-CN.md)

</div>

---

**NeryaLanding** is the launch page for [Nerya](https://github.com/NeryaAI/Nerya),
the local, skill-first investment-research Agent Team runtime. Paper execution is
the default; live execution stays behind Risk Gate and a human Approval Gate.

It used to live inside the Nerya dashboard. As of this release it is its own
project, so the dashboard ships fast and the landing page can iterate on its own
schedule.

Visiting `/` on the dashboard now redirects straight to the operator console.
Visit *this* site when you want to learn what Nerya is.

## What is here

A single static page built with:

- **WebGL2 fragment shader** for the dark-void hero. Violet shell, cyan
  filament, soft violet glow, pointer-reactive, scroll-driven.
- **Loader ritual** with a `/00 → /100` counter and a scrambled wordmark
  reveal.
- **Custom magnetic cursor**, spotlight masks on the mascot posters, and a
  scroll meter.
- **Pinned horizontal scroll** for the three "ritual" panels (Agent Team,
  Scoped Memory, Governed Evolution) on desktop, stacked on mobile.
- **Six original mascot illustrations** of the Nerya character doing different
  jobs (evolving, guarding, authoring, leading the team, reviewing governed
  proposals, leaning on a GitHub star).
- **Current product surfaces** including the Chat Canvas for browser sessions,
  charts, files, structured JSON, and styled web-search results.
- **A docs gallery** that points directly at the parts of the Nerya repo a
  visitor will actually want to read (README, AGENTS, skills/, trading/,
  evolution/, sdk/).
- **A single, loud CTA** at the bottom: star Nerya on GitHub.

Designed under the [`impeccable`](https://github.com/veithly) frontend playbook
(brand register · committed violet · OKLCH everywhere · no SaaS clichés) and
built from the reference inventory in the
[CoolLanding skill](https://github.com/veithly/CoolLanding-Skill). The visual
system is captured in [DESIGN.md](../DESIGN.md) at the project root, shared
with the dashboard.

## Design rules (the short version)

The full spec lives in [DESIGN.md](../DESIGN.md). The short version, for
contributors editing this page:

- **One hue.** Violet (`oklch(... 290)`) is the only brand color. Cyan and
  mint exist only for AI streaming state and positive PnL, respectively. No
  amber, no rose, no orange, no Datadog navy.
- **Two type weights.** Plus Jakarta Sans at 800 for display and 400 for body.
  JetBrains Mono only for operator chrome (`FRAME 2044`, eyebrows, code).
- **One shadow.** A 1px soft ambient. Coloured halos, neon glows, and
  inset-stripe rails are banned.
- **No em dashes in prose.** Use colons, periods, or parentheses.
- **Mascot is narrative.** Each pose explains a feature. Decorative placement
  is forbidden.

## Why a separate project

- **Independent deploy cadence.** The Nerya runtime ships when the kernel is
  ready. The landing page ships when the story is ready.
- **No Next.js coupling.** This is plain HTML / CSS / JS. Any static host
  works (GitHub Pages, Cloudflare Pages, Netlify, S3 + CloudFront, even a
  thumb drive).
- **Cleaner mental model.** The `/` route of the dashboard is now the dashboard,
  not a marketing surface.
- **Skill-first.** The build process is captured by the
  [CoolLanding skill](https://github.com/veithly/CoolLanding-Skill) and the
  reference-analysis doc, so the next iteration can be reproduced.

## Project structure

```text
NeryaLanding/
├── index.html
├── styles.css
├── main.js
├── assets/
│   ├── nerya-logo.png          (brand mark)
│   ├── nerya-mascot.png        (hero portrait)
│   ├── nerya-evolver.png       (01 · evolve loop)
│   ├── nerya-guard.png         (02 · risk-first execution)
│   ├── nerya-author.png        (03 · strategy author)
│   ├── nerya-team.png          (04 · agent team ritual)
│   ├── nerya-rewriter.png      (04 · self-rewriter ritual)
│   └── nerya-star.png          (09 · launch / star CTA)
├── docs/
│   └── reference-analysis.md
├── LICENSE
├── README.md
└── README.zh-CN.md
```

## Run and build with Astro

Use Node.js 22.12.0 or newer (Node 26 is supported by the pinned Astro 7.3.5
engine range), and npm 9.6.5 or newer. The landing entry point is now
`src/pages/index.astro`; root `index.html` remains legacy source and is never
copied to the published site.

```bash
npm ci
npm run dev
```

Open <http://127.0.0.1:4173/>. For a production preview:

```bash
npm run build
npm run check
npm run preview
```

Only `dist/` is the publishable static artifact. It includes `.nojekyll` for
GitHub Pages; these commands do not deploy anything. The site is designed for
hosting at `/` (a root site or custom domain). Repository-subpath hosting is
not supported: the landing and its bundled demo use root-relative URLs.

`dev`, `build`, and `preview` run `prepare:public` first. That task copies an
explicit allowlist of existing files to ignored `public/`, preserving
`docs.html`, `skills.html`, `recipes.html`, icon scripts, and the prebuilt
`demo/` artifact. Add local product films/posters/GIFs to
`assets/product-demos/`; direct media files there map to the same public URL.
Nothing is moved or removed. Do not edit `public/`; unexpected files cause
preparation to stop for inspection rather than being deleted. Private source,
tools, evidence directories, image provenance, and source maps are not copied.

`npm run check:astro` checks an existing build: local links/assets, the eight
main sections, four product films, and byte-preserved public/demo files. It is
static verification, not browser or accessibility testing. `npm run check`
also checks the deterministic demo fixtures. `npm run check:legacy` retains
the old landing assertions and sibling-dashboard icon checks separately; it
is not the Astro acceptance gate. Icon maintenance commands are unchanged.

The demo is deliberately **not** rebuilt during installation, dev, build,
preview, or checks. `npm run build:demo` is an explicit maintenance operation
that requires a compatible sibling Agent checkout; ordinary landing builds
use the checked-in bundle without relying on that checkout.

The six walkthroughs now live in `assets/product-recordings/`. They are viewport
recordings of the actual source-backed Agent interface, including markets and
connector authoring, not the earlier authored UI illustrations. Each has an MP4,
animated GIF and poster from a captured frame. `node tools/record-native-demos.mjs
--verify` checks decoding and hashes with the local ffmpeg/ffprobe toolchain.
Recording itself requires an explicitly authorized Ego task space; see
`docs/native-recordings-20260926.md` before operating the browser.

After Agent UI changes, run `npm run build:demo` and `npm run check:demo-source`
against the current sibling dashboard, then refresh the recordings. The source
check detects stale imported files and new routes; normal standalone site builds
still require no sibling checkout. The current workbench demo implements its
command/session-view protocol locally and never forwards requests to a runtime.

Recordings now use a1280×800 CSS viewport at DPR2, preserving2560×1600 renderer
pixels through raw `Page.captureScreenshot`. Do not use CSS-scale screenshots or
upscale old media. MP4 uses CRF14, GIF uses a full palette without dithering, and
WebP posters preserve lossless samples plus ICC profiles. With retained raw
captures and the local image toolchain, `node tools/check-media-quality.mjs`
verifies poster pixel identity and generates a labelled density comparison.

The landing pauses offscreen/hidden media and provides pause, replay, chapter
seeking and a GIF toggle. The native workspace remains local-only. Its bootstrap
normalizes query navigation into hash routes and adds narrowly scoped in-memory
Vault/timeline fixtures. No real secrets or runtime calls are used.

Twenty mascot-derived portraits replace DiceBear. Uploaded-reference provenance
and exact atlas crop metadata live in `assets/agent-avatars/provenance.json`.
`npm run check` verifies the standalone site's media and portraits without the
sibling dashboard. With that checkout present, `npm run check:avatars` also
verifies shared mapping/component contracts and byte-identical dashboard assets.
`node tools/sync-role-avatars.mjs` copies the canonical portraits without
rebuilding the native bundle or restarting the Agent service.

## Companion projects

- [Nerya](https://github.com/NeryaAI/Nerya): the runtime this page exists for.
- [CoolLanding](https://github.com/veithly/CoolLanding): the open-source
  reference site this design grew from.
- [CoolLanding Skill](https://github.com/veithly/CoolLanding-Skill): the
  reusable Codex skill that turns the research into agent instructions.

If this page helps you ship a better landing page,
[star the runtime](https://github.com/NeryaAI/Nerya) and the skill repo. The
signal is what makes it easier for other operators to find.

## License

PolyForm Noncommercial 1.0.0 (same as Nerya). See [LICENSE](LICENSE) for the
full text and `contact` in the Nerya repo for commercial use.

</details>
