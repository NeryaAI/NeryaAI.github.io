# Reference analysis · NeryaLanding

NeryaLanding is built from a deliberate reading of four reference sites,
distilled through the [CoolLanding skill](https://github.com/veithly/CoolLanding-Skill)
and the [`impeccable`](https://github.com/veithly) frontend design playbook.
The goal is to make the first viewport feel like an operator console at 1AM,
not a SaaS landing page.

## Reference sites

- **[Sidewave](https://sidewave.it/#origin)** — black void, one luminous
  central object, WebGL2 origin signal, ASCII / mono status copy. Takeaway:
  silence is expensive. Let one object carry the drama.
- **[Active Theory](https://activetheory.net/)** — sparse DOM, WebGL2 stage,
  ticker glyphs, cinematic darkness. Takeaway: combine a strong central mark
  with ambient code noise.
- **[Blit Studio](https://blit.studio/)** — white editorial field, huge
  cropped wordmark, custom cursor, image / text collisions. Takeaway: white
  space can be as extreme as black space when scale and placement are brave.
- **[Remote Rituals](https://remote-rituals.framer.website/)** — saturated
  toy-like world, chunky lettering, pinned horizontal scenes. Takeaway:
  handcrafted specificity beats generic polish.

## Pattern inventory

| Layer | Source |  Nerya adaptation |
|---|---|---|
| **Black-void hero** | Sidewave + Active Theory | WebGL2 shader, violet shell + cyan filament + amber heat. |
| **Loader ritual** | Sidewave | `/00 → /100` counter, line filler, scrambled wordmark. |
| **ASCII cloud** | Active Theory | drifting mono noise behind the hero orbit. |
| **Custom cursor** | Blit Studio | `mix-blend-mode: difference` dot + `cursor-label` chip. |
| **Editorial paper section** | Blit Studio | "Skills compose. Strategies learn." — large cropped type, mascot poster with offset shadow. |
| **Pinned horizontal scroll** | Remote Rituals | three ritual panels (Team / Memory / Self-rewriter). |
| **Toy-like memory card** | Remote Rituals | the `memory.ledger` card on the cyan panel. |

## Art direction (impeccable register: brand · committed)

A solo trader closes their day job, sits at a 27" monitor at 1AM with the
lights off, and watches their Nerya agent rewrite itself live. They want to
feel like they're operating a living machine, not browsing a SaaS page.

That scene sentence forces:

- Dark default, not "dark because tools look cool dark".
- One saturated color carrying 40% of the surface (Nerya violet `oklch(0.62
  0.24 295)`).
- Operator-level UI cues: status strip, frame counter, version chip.
- Living motion in the canvas, not a static gradient blob.
- One editorial paper break, so the dark isn't monotone.

## Hard-banned patterns (impeccable shared laws)

The page deliberately avoids:

- `#000` / `#fff` — every neutral is tinted toward the brand hue in OKLCH.
- Gradient text via `background-clip: text`.
- Side-stripe accent borders (`border-left: 4px solid …`).
- Identical card grids in every section. Each section earns its own
  affordance.
- Hero-metric SaaS template (big number + small label + supporting stats).
- Em dashes (`—`, `--`). Replaced with commas, colons, periods.

## Mascot strategy

Nerya is the character that makes the runtime relatable. Six poses, all
generated in the same anime-cyber violet style:

| Asset | Pose | Section |
|---|---|---|
| `assets/nerya-mascot.png` | smiling 3/4 portrait (existing brand asset) | hero orbit |
| `assets/nerya-evolver.png` | fist up, v1.1 → v1.3 ghosts ascending | 01 · evolve |
| `assets/nerya-guard.png` | hexagonal shield with policy / approval / limit runes | 02 · guard |
| `assets/nerya-author.png` | strategy editor + brain orb | 03 · authors |
| `assets/nerya-team.png` | four Nerya as Lead / Analyst / Risk / Memory | 04 · ritual one |
| `assets/nerya-rewriter.png` | writing into her own brain notebook | 04 · ritual three |
| `assets/nerya-star.png` | thumbs up on a glowing star | 09 · launch |

## Verification

- `python -m http.server 4173 --bind 127.0.0.1` from the project root.
- Desktop screenshot (1440px+) and mobile screenshot (390px) captured under
  `docs/screenshots/`.
- Console check, image-load check, canvas-nonblank check, scroll-no-overflow
  check.
