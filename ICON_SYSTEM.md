# Nerya Outline

Agent and public website share one functional icon family, inspired by the supplied lightweight, rounded reference. Product logos, third-party brand marks, role avatars, price charts and workflow connector lines are not functional icons and keep their own identity.

## Drawing rules

Use a 24 × 24 coordinate system, open counters, rounded line caps and joins. Default stroke is 1.5 units; 16 px and smaller use 1.75 units for optical legibility. Navigation uses 18 px; secondary controls usually use 16 px. Inherit currentColor from the control. Do not make selected icons solid or add gradients, shadows or coloured badges just for decoration.

Keep icon-only controls keyboard accessible and give the button an accessible name and a tooltip where useful. Decorative SVGs are hidden from assistive technology and do not intercept pointer events. Standalone meaningful icons can use the React title property.

## Source and usage

Canonical geometry: `../agent/dashboard/components/icon-paths.json`.

Agent: import the existing named icon, or `Icon` with a typed `name` from `components/icons.tsx`. All previous public named exports remain available. Do not add isolated functional SVGs or Unicode substitutes.

Website: `NeryaIcons.svg(name, size)` creates a decorative SVG; `NeryaIcons.set(element, name, size)` updates a dedicated icon slot. Static slots may use `data-icon`. `NeryaIcons.render(root)` upgrades old bilingual decorative glyphs only in explicit UI containers, never code, inputs, brand marks or body copy. New dynamic UI should call svg or set directly. Language changes run the compatibility upgrade explicitly; no mutation observer or polling is used.

## Build and verification

```sh
npm run sync:icons
npm run build:demo
npm run check:icons
npm run check
```

`icon-paths.js` is a generated static asset and must ship with the website. Visitors do not need the Agent repository, an icon font, a network service or an additional dependency. `sync-icons.mjs --check` detects drift from the canonical geometry. `check-icons.mjs` renders the actual React components and validates the website renderer, optical sizes, navigation mappings and accessibility.

Review small sizes, baseline alignment, light/dark themes, language changes, disabled states and mobile controls on rendered pages before accepting further changes.
