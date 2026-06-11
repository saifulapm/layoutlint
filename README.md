# agent-eyes (working codename)

Deterministic UI layout verification for AI coding agents: catch overflow,
overlap, and truncation in milliseconds — **no browser, no screenshots**.

Pure TypeScript: Yoga (flexbox) + fontkit (font metrics) + Intl.Segmenter
(line breaking), validated against headless Chromium golden files, the same
oracle method [Pretext](https://github.com/chenglou/pretext) proved for text
layout. Not a pixel-perfect browser — a deterministic bug-catcher for agent
workflows.

See [HANDOFF.md](./HANDOFF.md) for the full plan. **Current status: Phase 0
spike** — proving Yoga + fontkit can match Chrome within threshold on a
corpus of real layout patterns, before any parser or assertion API exists.

## Phase 0 accuracy scoreboard

Engine vs Chromium 145 `getBoundingClientRect`, thresholds: positions ≤1px,
sizes ≤1px (text sizes ≤2px). First 10 of 50 corpus cases:

| case | viewport | nodes | max Δpos | max Δsize | result |
| --- | --- | --- | --- | --- | --- |
| row-fixed-gap | 320 | 4 | 0.00 | 0.00 | PASS |
| column-padding-margin | 375 | 6 | 0.00 | 0.00 | PASS |
| nested-flex-grow | 768 | 7 | 0.00 | 0.00 | PASS |
| wrapping-text | 320 | 3 | 0.00 | 0.00 | PASS |
| fixed-vs-auto-row | 375 | 6 | 0.00 | 0.00 | PASS |
| min-max-constraints | 768 | 4 | 139.33 | 139.33 | **FAIL** |
| long-unbroken-string | 320 | 2 | 0.00 | 0.00 | PASS |
| emoji-text | 375 | 2 | 0.00 | 0.00 | PASS |
| bangla-text | 320 | 2 | 0.00 | 0.00 | PASS |
| space-between-wrap | 375 | 6 | 0.00 | 0.00 | PASS |

**9/10 within threshold.** All text cases — Latin wrapping, unbreakable long
strings, emoji (color-font metrics), and Bangla (complex-script shaping) —
match Chrome at **0.00px delta**.

### Known gaps (root-caused)

- **Yoga min/max flex resolution ≠ CSS spec.** Yoga clamps each item's flex
  base size by `min-width` *before* distributing free space, in one pass.
  CSS (and Chrome) iteratively freeze min/max violators and *redistribute*
  the recovered space ([§9.7](https://www.w3.org/TR/css-flexbox-1/#resolve-flexible-lengths)).
  For `min-max-constraints` Chrome resolves 262/180/262, Yoga 401/151/151.
  This is Yoga's algorithm, not a config issue (`UseWebDefaults` is already
  on). Candidate fixes for Phase 1: post-process with our own iterative
  resolution pass, or route min/max-constrained flex rows through Taffy.
- `line-height: normal` is out of scope; corpus text sets explicit px
  line-height (CSS default-line-height parity is a Pretext-sized problem of
  its own).
- ZWJ emoji sequences (👨‍👩‍👧) measure as the sum of their parts — the CBDT
  color-emoji font defeats fontkit's shaper, so we fall back to raw
  cmap+hmtx advances.

## Repo layout

```
packages/
  core/      # Yoga bridge + fontkit text measurement (the engine)
  oracle/    # Playwright golden-file generator + comparator
  rules/     # (Phase 1) assertion rules + agent-shaped reporter
  cli/ mcp/ skill/   # (Phase 1) distribution
corpora/     # test cases (hardcoded style-object trees in Phase 0)
golden/      # Chromium golden files (committed, regenerated in CI)
accuracy/    # scoreboard output (report.json + README.md)
fonts/       # Inter + Noto Sans Bengali (explicit fonts only in v0)
```

## Dev loop

```sh
bun install
npx playwright install chromium   # oracle only — never a runtime dep
bun run oracle      # regenerate golden files from headless Chromium
bun run accuracy    # engine vs golden, prints the scoreboard
```

The harness is the dev loop: a failing case prints per-node px deltas;
point an agent at it ("engine says w=401.3, Chrome says w=262, here's the
tree — find why") and grind until green.

## Notes for reproducibility

- The oracle embeds Inter and Noto Sans Bengali as `@font-face` data URIs;
  emoji deliberately fall through to the system **Noto Color Emoji**, which
  the engine loads from `/usr/share/fonts` when present. Golden files are
  tied to the pinned Chromium (see `chromium` field in each golden JSON).
- Every element renders as `display:flex; box-sizing:border-box` (Yoga
  semantics); text leaves render as `display:block`.
