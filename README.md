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
sizes ≤1px (text sizes ≤2px). **47/50 corpus cases within threshold** —
and 46 of those 47 at a flat **0.00px delta** (full per-case table in
[accuracy/README.md](./accuracy/README.md)).

Coverage: nested rows/columns, every justify/align value, wrap +
wrap-reverse + align-content, percentage widths and flex-basis, shrink,
min/max constraints, auto and negative margins, absolute/relative
positioning, and text — Latin wrapping, unbreakable URLs, letter-spacing,
emoji (CBDT color-font metrics), Bangla complex-script shaping, mixed
Bangla+Latin, padded text nodes, and a kitchen-sink card composing all of it.

The 3 failures:

| case | what diverges |
| --- | --- |
| min-max-constraints | Δ up to 139px — Yoga single-pass min/max resolution |
| min-width-freeze-redistribute | Δ 160px — same root cause |
| text-in-row-shrink | Δ 26px — text flex-basis ≠ max-content in Yoga |

### Known gaps (root-caused)

- **Yoga flexible-length resolution ≠ CSS §9.7.** All three failures are one
  algorithm family. CSS iteratively freezes min/max violators and
  *redistributes* the recovered space
  ([spec](https://www.w3.org/TR/css-flexbox-1/#resolve-flexible-lengths));
  Yoga clamps each item's base size once and distributes in a single pass
  (`min-max-constraints`: Chrome 262/180/262 vs Yoga 401/151/151).
  Relatedly, Yoga doesn't use a text item's max-content width as its flex
  base in rows, so siblings don't shrink when long text competes for space
  (`text-in-row-shrink`). Not a config issue — `UseWebDefaults` is on.
  Candidate Phase 1 fixes: a post-pass iterative resolution of our own, or
  routing constrained rows through Taffy.
- **The oracle must run Chromium with `--font-render-hinting=none`.**
  Headless Linux Chromium otherwise grid-fits every glyph advance to whole
  pixels (FreeType full hinting) — "Dismiss" at 14px measures 49px hinted vs
  51.33px linear — which diverges from fontkit *and* from Chrome on
  macOS/Windows, where subpixel positioning is the norm. With the flag,
  Chrome and fontkit agree to ~0.01px. Found by grinding the
  `card-kitchen-sink` failure; this is the kind of discrepancy the harness
  exists to surface.
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
