# Native recordings — 2026-09-26

## Task lock

- Checkout: `/Users/rick/Documents/Project/Nerya/landing-page`, branch `main`; pre-existing dirty files are preserved.
- Target: the already-running preview at `http://127.0.0.1:4173/demo/index.html`.
- Browser: Ego space **20**, managed page **p2**. The pre-existing Agent tab at port 18380 is untouched/unmanaged. Do not finish the space; the lead still needs final QA.
- Owned outputs: `tools/record-native-demos.mjs`, `assets/product-recordings/**`, this document only. Generated temporary evidence is under ignored `.tmp/native-recordings/`.
- Out of scope: actual runtime, accounts, credentials, model requests, deployment, package changes, demo fixture/source changes, previous authored films under `assets/product-demos/`.
- Acceptance: six actual-viewport films, 1280×800, 10–18 seconds, H.264 MP4 + genuine animated GIF + WebP poster, provenance/action/hash manifests; visual QA after the lead confirms the new avatars.

## Status

The lead explicitly confirmed the generated 5×4 atlas (20 distinct roles), canonical 256px PNGs and served avatar replacements. **Strategy is published and verified; all browser capture is now paused at a safe between-takes point for the lead to copy the supplemental bootstrap/fixtures/theme.** Each new take refreshes p2 and independently compares all six served native-avatar SHA-256s with the canonical source PNGs. No new take starts until the lead confirms the served-source update. Old-avatar probes below are historical preparation evidence only and must not be published as final films.

### Published strategy film

- `assets/product-recordings/strategy.mp4`: H.264, 1280×800, 16 seconds, 384 decoded frames.
- `assets/product-recordings/strategy.gif`: genuine GIF89a, 1280×800, 16 seconds, 160 decoded frames.
- `assets/product-recordings/strategy-poster.webp`: genuine screenshot frame `frame-00074.png` at **10.0431 seconds**. Visually checked: whole BTC workflow with the new generated role portraits, no modal. The clip still includes the later reviewer modal.
- `assets/product-recordings/strategy.manifest.json`: 133 original native PNG capture frames, actual source/action hashes, all six new avatar SHA-256s, stable-source check, media hashes and exact poster frame provenance. `--verify --only=strategy` passed.
- Metadata explicitly says: “Actual screen recording of the source-backed Nerya app with deterministic data; no live accounts, model requests or orders. This is not drawn or recreated UI.”
- Existing ffmpeg lacks `libwebp`; the already-installed `cwebp` now converts the genuine poster PNG. No dependency was installed.

### Current pause / exact next step

Browser is **space20 / p2** with no active capture process. It is safe for the lead to copy `demo/{index.html,runtime.js,native-fixtures.js,theme.js}` into existing public/dist. The actual `app.js` stays fixed. Await the lead's explicit served-ready signal, then inspect corrected market routing and native Vault fixtures; record the remaining `team`, `evolution`, `markets`, `integrations`, and `vault` films. Markets must not run against the known legacy query parsing.

The first new-avatar team take (`.tmp/native-recordings/team-record-uX2Jze`) was **rejected**, not published: its last manual wheel motion made it 18.6447 seconds. That extra wheel motion has been removed and the member instruction shortened; retain the native selections/typing/continuation on the next take.

Verified probes so far (all raw PNGs only, old avatars):

- Team: `.tmp/native-recordings/team-probe-PpRAEc/capture.json`, **16.0865 s / 41 native PNG frames / 14 distinct states**, including intermediate typed text, native member selection, continuation and wheel input. Source hashes stable; no demo errors. An earlier simpler probe captured 93 frames in 16 s; finer-grained input was retained to expose typing rather than only its end state.
- Strategy: `.tmp/native-recordings/strategy-probe-5VfOPu/capture.json`, **16.0402 s / 110 native PNG frames**, prompt typing, submission, actual workflow selection, and reviewer inspector. Source hashes stable; no demo errors.
- Evolution: `.tmp/native-recordings/evolution-probe-peGgzm/capture.json`, **16.0235 s / 93 frames / 22 distinct states**. Native diff and pending-review disclosure visually checked.
- Four markets: latest `.tmp/native-recordings/markets-probe-pw1wkZ/capture.json`, **16.4662 s / 82 frames**. All four native workflow selections completed, and native heading hover restores title framing after selecting cards below the fold. Expanded actual-resource discovery/hash verification passed. Previous probe `.tmp/native-recordings/markets-probe-dmx9Vo/capture.json` had 107 frames but a clipped title and is not the preferred choreography.
- Connector authoring: `.tmp/native-recordings/integrations-probe-XvQnQa/capture.json`, **16.1095 s / 71 frames / 30 distinct states**. Real typing and native plan response; no live-connection claim.
- PNG dimensions verified with ffprobe: **1280×800**. Mid-typing team screenshot was visually inspected; it is the actual application viewport, not a mockup. The OS cursor itself is not present in standard CDP screenshots; native input, selection, caret and hover/scroll state are captured. Do not claim an OS-cursor recording.
- `node --check`, `--self-test` passed. `--record --only=team` without avatar acknowledgement correctly fails before browser work.
- Recorder preparation initially stalled because `execFile` left stdin open; explicitly ending the Ego child stdin fixed it. No browser/backend switch or runtime restart was needed.

`--probe` records actual DOM interactions to ignored PNG frames and timing/evidence JSON, but deliberately does not encode MP4/GIF/posters. `--record` refuses to start without `--avatars-confirmed`, and additionally verifies that served avatars match source avatar files and that source/asset hashes remain unchanged during the take.

## Choreography

| Film | Native source and actions | Truthful limit |
| --- | --- | --- |
| strategy | `/chat`: type brief → native streamed validation plan → Strategies → BTC workflow → independent reviewer node | Demo plan and seeded inspectable workflow, not a newly deployed strategy |
| team | New research conversation → researcher → reviewer → risk critic → bounded follow-up to one member | Deterministic in-memory team fixtures, no real model requests |
| evolution | New review conversation → real diff, evidence and unchanged-runtime disclosure → gentle scroll | Reviews a candidate; does not approve/apply or claim live evolution |
| vault | `/env-vault`: synthetic reference metadata → native form → save a clearly fake reference | Requires memory-only list/put fixtures; never records a real secret |
| markets | `/strategies`: crypto → prediction → futures → A-share genuine workflow canvases | Four research/strategy surfaces do not imply four live execution integrations |
| integrations | `/chat`: type ExampleX connector/exchange request → native integration plan | Plan, not generated-and-tested production connector; order permission remains off |

Every click resolves a fresh native snapshot ref, recorded with its snapshot filename and hash. Capture uses Ego `Page.screenshot` at a target of 10 Hz, with request/response midpoint timestamps. Encoding repeats real frames according to elapsed time; no synthetic UI, cards, labels, pointer graphics, or transition frames are drawn. Native pointer input, typing, selection and wheel actions are logged. The recorder never claims, closes, hands off, or finishes the browser space.

## Fixture/source issues for the lead

1. **Learning review page crashes:** on `#/self-evolution`, click the native `学习记录` tab. `POST /api/proxy/evolution/timeline` (recorded normalized path `/evolution/timeline`) returns no `config`; the real component reads `envelope.config.periodic_reflection` and throws `Cannot read properties of undefined (reading 'periodic_reflection')`. Existing fixture in `demo-src/fixtures.ts` only returns `ok/timeline/count`. Final evolution choreography uses the real review conversation instead, without pretending this broken review page works. Fix the fixture if a review-board film is required.
2. **Vault has no useful fixtures:** `#/env-vault` calls `POST /security/env/list` and `POST /security/secrets/list`; both currently fall through to generic empty collections. Native contracts require `{ok, env, count}` and `{refs}`. `POST /security/env/put` and `POST /security/secrets/put` are not implemented and are correctly denied by the demo's unknown-write guard. The recorder blocks Vault until synthetic, memory-only list/put fixtures exist. The fallback account fixture also has `profile.credentials: {}` and therefore cannot show a credential reference. Do not fix by reaching the real service. See `agent/dashboard/lib/clientApi.ts:2661` for the actual contracts.
3. **BTC list entry query encoding:** opening the active BTC card yields a strategy id containing `?tab=performance`, encoded into `strategy_id`; downstream links include `btc_trend_guard%3Ftab%3Dperformance`. `demo-src/navigation.tsx` currently splits the entire href rather than separating pathname and query. The workflow happens to display via fallback but this is not correct source routing.
4. **Seeded conversation transcript loading:** after a full reload at `#/chat/demo-research`, the main pane stays `对话加载中…`, even while the member pane renders. New conversations submitted through the composer render correctly; team choreography starts a new one. No browser storage has been cleared.

These issues were only inspected. No fixtures, actual dashboard source, storage, or runtime state were changed by this subtask.

Lead acknowledgement: supplemental in-memory security list/put fixtures and evolution timeline shape are being implemented separately; the lead owns the BTC query correction in the theme bootstrap. Neither fix has yet been claimed as served/verified here. The lead has confirmed the 20-role atlas and six native avatar replacements; five films may use the existing baseline app bundle now. The recorder discovers and hashes actual script/link/resource URLs, including supplemental bootstrap and fixture modules when present, rather than relying only on the original app bundle.

## Commands

```sh
node tools/record-native-demos.mjs --self-test
node tools/record-native-demos.mjs --plan
node tools/record-native-demos.mjs --probe --only=team

# Only after lead confirms new avatar assets and rebuilds the served demo:
node tools/record-native-demos.mjs --record --avatars-confirmed --only=team
# Full run additionally needs the Vault fixtures above:
node tools/record-native-demos.mjs --record --avatars-confirmed
node tools/record-native-demos.mjs --verify
```

Final output names are `{strategy,team,evolution,vault,markets,integrations}.mp4`, `.gif`, `-poster.webp`, and `.manifest.json` under `assets/product-recordings/`. Each manifest contains served source URLs and SHA-256s, original-bundle source-manifest hash, viewport, route/action timing, snapshot/frame hashes, request audit, stable-source check and final-media hashes. Raw frames/snapshots remain in ignored `.tmp/` rather than Git.

## API provenance

Ego APIs were checked against `/Users/rick/.agents/skills/ego-browser/SKILL.md` and its `references/api.md`. The CDP viewport signature was checked against the official ChromeDevTools `json/browser_protocol.json`; screenshot polling avoids depending on experimental screencast event buffering. ffmpeg and ffprobe were already installed under `/opt/homebrew/bin`; no dependency was installed.

## Historical preparation handoff (before final-avatar capture)

- Completed: five 16-second native interaction probes, targeted recorder self-test/syntax check, fresh snapshot targeting, intermediate typing frames, actual viewport QA, source/hash capture, output encoder/verification code and strict final-capture gate.
- Pending: main confirms all 20 generated roles and served six-role replacements; verify supplemental fixtures/bootstrap and corrected BTC routing; rehearse Vault; take final recordings; encode all six MP4/GIF/posters; run media verification and visual QA. Encoder output has not yet been executed or claimed verified.
- Browser retained: **space20 / p2**, last inspected on the A-share strategy canvas. The pre-existing `http://127.0.0.1:18380/skills` tab remains untouched/unmanaged. No `finish`, close, or handoff was called. Space23 was never used.
- Only script and this document were created in the tracked workspace. No final output directory/media was created; existing authored films are unchanged. All test frames are ignored `.tmp/` artifacts.
