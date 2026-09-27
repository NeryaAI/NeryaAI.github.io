# React website and motion integration

The active website is React + Vite + TypeScript + Tailwind CSS v4. Astro is not
an installed dependency and there is no Astro page or build entrypoint.
Previous source inputs were preserved in `.tmp/react-migration-inputs/`, outside
the public asset allowlist.

## Development

```sh
npm ci
npm run dev

# Production artifact and preview
npm run build
npm run typecheck
npm run check
npm run preview
```

Both servers use `http://127.0.0.1:4173`. Stop the existing preview before
starting a dev server on the same port. Publish `dist/` at the domain root;
none of these commands commits, pushes or deploys a website.

## Ownership

| Area | Entry |
| --- | --- |
| Homepage | `src/App.tsx`, `src/main.tsx` |
| Agent SDK manual | `src/Manual.tsx`, `src/docs.tsx`, `src/data/manual.mjs` |
| Shared React UI | `components/ui/` |
| Scroll container | `components/ui/container-scroll-animation.tsx` |
| Background light paths | `components/ui/background-paths.tsx` |
| GitHub actions | `components/ui/github-button.tsx` |
| Tailwind / shadcn tokens | `src/styles/tailwind.css`, `components.json` |
| Motion styles / pointer sampling | `src/styles/effects.css`, `src/scripts/effects.ts` |
| React prerender | `tools/prerender-react.mjs` |
| Native source excerpts | `src/components/NativePart.tsx`, `src/data/native-parts.json` |

`components/ui` is the root-level reusable component directory, matching the
provided integration brief. `@/components/ui` and `@/lib/utils` resolve through
both TypeScript and Vite. Existing product-specific components stay under
`src/components`. Tailwind scans only the selected component/page sources;
Preflight is intentionally omitted so the existing source-native excerpts and
website reset are not changed by a second reset. No external context provider
is needed for ContainerScroll or the decorative background.

Vite builds four HTML entrypoints. A build-time React render populates their
root elements; clients hydrate those roots. `/docs.html`, `/skills.html` and
`/recipes.html` all render the current React manual with the existing SDK and
artifact anchor IDs. The old static docs generator is a historical tool, not a
build step. Do not run it over the React entry templates.

## Motion behavior

The supplied ContainerScroll API is retained: `titleComponent`, `children`,
typed Header/Card MotionValues. Desktop rotation is 20 degrees to upright,
scale 1.05 to 1, title movement 0 to -100px. A spring smooths scroll updates.
The large demonstration-only top and bottom spacers were not used.

Children contain the actual isolated Mock workspace, not a stock image. The
existing Nerya assets replace the generic sample screenshot; there is no
Next.js Image dependency. Desktop input freezes hit geometry through click and
settles before editing. Mobile/touch and reduced-motion use readable upright
geometry. Expansion removes transform and perspective containing blocks.

Background paths, light washes, orbital lines, restrained particles, scene edge
glows, hover spotlights and a reading-progress line extend the existing violet
identity. Header and story controls share the global pause state. Decorative
loops pause when hidden/offscreen. Pointer work is coalesced into animation
frames. There is no wheel interception, forced arrival scrolling, full-page
screen recording or custom cursor.

## References

- User-supplied ContainerScroll / Aceternity UI reference:
  https://ui.aceternity.com/components/container-scroll-animation
- Background Paths concept: https://21st.dev/@kokonutd/components/background-paths
- Spotlight Card concept: https://21st.dev/@jahed/components/spotlight-card
- Glowing Effect concept: https://21st.dev/@manuarora700/components/glowing-effect

The path geometry and spotlight/edge implementation here are original Nerya
adaptations inspired by those references, not copied gated component sources.

## Boundaries and checks

All homepage Get started / installation calls to action now link directly to
`https://github.com/NeryaAI/Nerya`. Documentation navigation remains separate.

The Mock retains its deny-network CSP and synthetic in-memory transport. The
website never connects an account, invokes a trading model or sends an order.
Numbers in the cards remain illustrative, not actual backtest or live results.

`check:react` covers published file allowlists, prerendering, anchors and demo
preservation. `check:effects` exercises the React server-rendered component API,
directory aliases and direct GitHub links. `typecheck` covers all current React
pages and TypeScript modules. The task-specific browser script
`tools/qa-scroll-effects.mjs` operates only the already-owned task space 29;
use an explicitly authorized browser context when adapting it for another task.
Browser evidence is written to `docs/effects-evidence/` and is not published.
