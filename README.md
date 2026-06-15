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
the self-evolving, skill-first, trading-native autonomous agent runtime.

It used to live inside the Nerya dashboard. As of this release it is its own
project, so the dashboard ships fast and the landing page can iterate on its own
schedule.

Visiting `/` on the dashboard now redirects straight to the operator console.
Visit *this* site when you want to learn what Nerya is.

## What is here

A single static page built with:

- **WebGL2 fragment shader** for the dark-void hero. Violet shell, cyan
  filament, soft violet glow, pointer-reactive, scroll-driven. No amber, no
  off-brand accent.
- **Loader ritual** with a `/00 → /100` counter and a scrambled wordmark
  reveal.
- **Custom magnetic cursor**, spotlight masks on the mascot posters, and a
  scroll meter.
- **Pinned horizontal scroll** for the three "ritual" panels (Agent Team,
  Typed Memory, Self-Rewriter) on desktop, stacked on mobile.
- **Six original mascot illustrations** of the Nerya character doing different
  jobs (evolving, guarding, authoring, leading the team, rewriting her own
  kernel, leaning on a GitHub star).
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

## Run locally

```bash
python -m http.server 4173 --bind 127.0.0.1
```

Then open <http://127.0.0.1:4173/>.

Any static server works. There is no build step, no bundler, no npm install.

## Deploy

Push the repo, point a static host at the root. Both `index.html` and `assets/`
must be served from the same origin so the WebGL canvas can pick up the textures
and the mascot illustrations can load.

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
