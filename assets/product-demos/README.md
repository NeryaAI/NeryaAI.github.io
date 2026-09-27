# Product walkthrough loops

Four authored product walkthroughs, not recordings of real sessions. All media
use illustrative states. They do not contact an account, model, connector, vault,
or other service. A validation check or authentication completion shown in these
films is not proof of a real operation.

All films and posters are **960 × 640 (3:2)**. Animation is **9 seconds at 10 fps**,
with a populated final hold and a dissolve back to the exact opening frame.
English UI text is shared across locales; bilingual titles and captions live in
`manifest.json`. The four compositions deliberately differ: strategy composer and
graph, parallel member conversations, session/code review, and credential handoff.

## Files

For each of `strategy`, `team`, `evolution`, and `vault`:

- `<name>.mp4`: H.264, yuv420p, fast-start, no audio; preferred inline media.
- `<name>.gif`: actual indefinitely looping animated GIF; optional alternative.
- `<name>-poster.webp`: meaningful populated state at 7.3–7.4 seconds.
- `<name>-storyboard.webp`: four timeline frames, each displayed at 650px wide.

`manifest.json` records actual sizes, dimensions, duration, frame counts, SHA-256
hashes, decoded-frame changes, original asset hashes, toolchain, captions, and
provenance. Size gates use decimal bytes: GIF ≤3,000,000; MP4 ≤500,000.
Three evenly timed chapter controls can seek to **0, 3, and 6 seconds**.

## Reproduce and verify

Run from the landing-page checkout:

```sh
node tools/render-product-demos.mjs --preview
node tools/render-product-demos.mjs
node tools/render-product-demos.mjs --verify
```

The script first looks for existing `@napi-rs/canvas` and `sharp` in the sibling
Agent checkout and this checkout, then Codex's bundled runtime. It installs
nothing and never changes `package.json`. To use another existing runtime, set
`PRODUCT_DEMOS_NODE_MODULES` to its `node_modules` directory. Missing dependencies
are a stop condition: ask the lead before adding anything.

Default fonts are macOS Avenir Next and Menlo. For another host, point
`PRODUCT_DEMOS_SANS` and `PRODUCT_DEMOS_MONO` at the same font files. `FFMPEG` and
`FFPROBE` can override the discovered binary paths. Byte-for-byte reproduction
requires identical fonts, original assets, source, and encoder versions; all are
identified in the manifest. No random seed, current time, or network result enters
the rendering. `--preview` refreshes only posters and storyboards; re-render after
any source change before checking the manifest.

The generator checks text widths in dense fields, exact source loop closure,
frame changes, GIF loop metadata, dimensions, frame count, duration, H.264 pixel
format, MP4 fast-start layout, and byte budgets. It removes only its own temporary
frame directory after rendering. It does not modify site integration files.

## Integration guidance

Use the MP4 by default with `muted loop playsinline`, the matching `poster`, and
explicit pause/replay controls. Use `preload="none"` and start only when near the
viewport. The surrounding section should provide one localized title, one short
sentence, and the disclosure. Show the poster for reduced-motion users and start
animation only on an explicit request. GIFs are downloadable alternatives, not an
automatic reduced-motion fallback. Videos have no audio and do not provide live
product controls. A host page can expose a GIF link or optional toggle.

Suggested disclosure:

> Authored product walkthrough with illustrative states, not a real session recording.
>
> 人工编排的产品演示，使用示例状态，并非真实会话录屏。

## Identity and claim boundaries

Original member portraits from `assets/agent-avatars/*.png` and the mascot from
`assets/nerya-logo.webp` are reused without redrawing their identity. See the
existing avatar `NOTICE.md` and `provenance.json` for original artwork attribution.

Vault claims were checked against the read-only sibling source
`../agent/nerya/security/secrets.py`: encrypted persistence in `_flush`, the
`vault://` reference in `SecretMeta.ref`, and runtime resolution in `resolve`.
No specific encryption algorithm is claimed. The visible locked vault is a
closed/masked depiction, not a claim about a specific runtime lock state API.
The film contains only mask dots and an invented `vault://demo/bybit` reference;
no actual secret is read, generated, embedded, or sent. Connector authentication
is an illustrative outcome, not an actual connection test.

Evolution ends at an **approved candidate**, explicitly leaving the current
version unchanged. Strategy ends at a reviewable package. Neither represents
deployment or execution. No film claims profit, returns, or verified trading
performance.
