# Engineering notes

How layoutlint matches Chromium without being a browser — the architecture,
the validation harness, and the hard-won parity lessons. Companion to the
[README](../README.md).

## Architecture

```
packages/
  core/      # parser, Tailwind resolver, visual resolver, Yoga bridge,
             # HarfBuzz text measurement, SVG painter
  rules/     # the published `layoutlint` package: 4 assertion rules,
             # check() + render() APIs, CLI, MCP server, bundled fonts
  oracle/    # DEV-ONLY: Playwright golden/screenshot generators + comparators
  skill/     # Claude Code skill (SKILL.md)
corpora/     # style-object cases + Tailwind cases + seeded fuzz corpus
golden/      # Chromium getBoundingClientRect goldens (committed, regen in CI)
screenshots/ # Chromium screenshots for the paint gate (committed, regen in CI)
accuracy/, paint-accuracy/   # scoreboards (regenerated in CI)
vendor/      # pinned @tailwindcss/browser build + NotoColorEmoji (oracle only)
```

The stack: Yoga (flexbox) + HarfBuzz-WASM (text shaping — the same shaper
Chrome uses) + fontkit (font parsing/outlines) + Intl.Segmenter (line
breaking), validated against headless Chromium golden files — the oracle
method [Pretext](https://github.com/chenglou/pretext) proved for text layout.

## Dev loop

```sh
bun install
npx playwright install chromium   # oracle only — never a runtime dep
bun test                # unit tests (rules, resolvers, painter, glyphs)
bun run oracle          # regenerate layout goldens from headless Chromium
bun run accuracy        # engine vs goldens → scoreboard, exit 1 on fail
bun run paint-oracle    # regenerate Chromium screenshots
bun run paint-accuracy  # engine render vs screenshots → pixel-diff gate
bun run packages/oracle/src/debug-case.ts <name>   # per-node px deltas
```

The harness is the dev loop: a failing case prints per-node deltas; point an
agent at it ("engine says w=401.3, Chrome says w=262, here's the tree — find
why") and grind until green. Goldens are platform-independent: every font —
including the vendored Noto Color Emoji — is embedded as an `@font-face`
data URI (per page, only when the case content needs it), so macOS and Linux
regenerate identical rects (verified ≤0.03px).

## The corpus (297 layout cases, 42 paint cases)

- **56 style-object cases** exercise the engine in isolation: nested
  rows/columns, every justify/align value, wrap variants + align-content,
  percentage widths and flex-basis, shrink, min/max constraint conflicts,
  auto and negative margins, absolute/relative positioning, and text —
  Latin wrapping, unbreakable URLs, letter-spacing, emoji (CBDT color-font
  metrics), Bangla complex-script shaping.
- **41 Tailwind cases** (cards, navbars, heroes, forms, modals, chat
  bubbles, dashboards, Bangla content, …) run the full pipeline — parser →
  resolver → Yoga — against headless Chromium executing the real, vendored
  Tailwind v4 browser build. These 41 (+ the demo card) are also the paint
  corpus, pixel-diffed against Chromium screenshots.
- **200 seeded fuzz cases** ([corpora/generated.ts](../corpora/generated.ts)):
  deterministic pseudo-random trees mixing every supported feature. The
  fuzzer found six divergence classes the curated corpus missed; all fixed.
  Widening the generator is the cheapest way to hunt the next one.

## Engine notes (hard-won parity lessons)

- **Yoga's flexible-length resolution ≠ CSS §9.7, corrected by our own
  pass.** CSS iteratively freezes min/max violators and *redistributes*
  recovered space
  ([spec](https://www.w3.org/TR/css-flexbox-1/#resolve-flexible-lengths));
  Yoga clamps each item's base once and distributes in a single pass.
  `packages/core/src/flexfix.ts` implements the spec algorithm — unclamped
  flex bases, max-content bases for text items, §4.5 automatic minimums
  (`min(content suggestion, specified width)`, zero for scrollable boxes —
  the `min-w-0`/`truncate` semantics), inner-base shrink weighting, and
  §9.3 line collection so wrap rows resolve per line with min-content
  floors. Corrections are applied as width pins over Yoga's tree and
  iterated to a fixpoint (with unpinning when a settled container no longer
  conflicts).
- **Yoga has no fit-content cross sizing.** A non-stretched auto-width child
  of a column must size to `clamp(min-content, available, max-content)`:
  Yoga neither clamps wrappable content to the available width nor lets
  nowrap text keep its min-content width past it. Same corrective pass.
- **Text must be shaped like the browser shapes it.** Shaping runs through
  HarfBuzz-WASM (Chrome's shaper) — fontkit's own shaper is ~4px/word off
  on some Bengali conjuncts (e.g. প্রযুক্তি). Lines are shaped whole, not as
  summed words (kerning and contextual alternates cross word boundaries:
  Inter shapes "2.1" differently standalone than mid-string), and
  letter-spacing applies per grapheme cluster, not per codepoint (combining
  marks add no spacing). Font fallback walks the family list per codepoint —
  including for spaces, which take the first font, not the surrounding run's.
- **The oracle must run Chromium with `--font-render-hinting=none`.**
  Headless Linux Chromium otherwise grid-fits every glyph advance to whole
  pixels (FreeType full hinting) — "Dismiss" at 14px measures 49px hinted vs
  51.33px linear — which diverges from HarfBuzz linear metrics *and* from
  Chrome on macOS/Windows, where subpixel positioning is the norm. With the
  flag, Chrome and the engine agree to ~0.01px.
- **Paint matches geometry by construction.** The painter reuses the exact
  line breaker (`breakLines`) and HarfBuzz shaping (`glyphRuns`) that
  measured the text, emitting glyph outlines (fontkit paths), so the SVG is
  self-contained and cannot disagree with the computed boxes. Tailwind v4's
  oklch colors are not converted mathematically — a dev script reads the
  exact sRGB bytes Chrome paints (canvas `getImageData` against the vendored
  Tailwind build) into a committed table.
- **Known envelope edges:** fit-content sizing *of a wrap container itself*
  is not modeled (real Tailwind UI almost always stretches wrap rows
  full-width); `line-height: normal` is out of scope (the Tailwind path is
  unaffected — preflight and the `text-*`/`leading-*` scales pin every
  line-height); emoji ZWJ sequences ligate correctly through HarfBuzz
  against the CBDT color font.

## Scope notes (parser + resolver)

- Input is **static** JSX/HTML — expressions, props, and conditionals are
  not evaluated (React component support via react-test-renderer is
  planned).
- `grid` resolves as a flex column with a warning; Taffy-backed grid is the
  planned fix. `order-*`, `line-clamp-*`, `w-fit/min/max`, and `max-w-prose`
  warn and are skipped.
- Non-flex elements lay out as stretch columns: correct for Tailwind's
  zeroed-margin world, but block-flow **margin collapsing** and
  inline-block **shrink-to-fit in block flow** are not modeled — a bare
  `<button>` in a non-flex parent measures full-width. Keep buttons in flex
  rows (as Tailwind components almost always do).
- Inline elements whose classes don't affect geometry (colors, plain
  font-weight) collapse into their parent's text and measure — and paint —
  with the parent's style (≤2px on realistic lines for weight; inner-span
  colors fall back to the parent's color). Spans with geometry classes and
  all children of flex containers stay boxes, matching CSS blockification.
- Everything measures with the bundled font chain (Inter, Noto Sans
  Bengali, + system color emoji at runtime); `font-mono`/`font-serif` are
  ignored.
- Every element renders as `display:flex; box-sizing:border-box` (Yoga
  semantics); text leaves render as `display:block`.

## Paint validation

Every Tailwind corpus case + the demo card is rendered by the engine
(SVG → resvg PNG) and compared to a pinned-Chromium screenshot with
`pixelmatch` (per-pixel threshold 0.1). Gate: ≤7% mismatched pixels per
case — baselines: Linux CI worst 5.71%, macOS worst 3.23%, median ~0.9%,
all of it glyph-edge antialiasing between rasterizers (resvg vs Skia),
verified by inspecting diff images. A real paint defect (missing fill,
shifted text block) measures far above the gate. Scoreboard:
[paint-accuracy/README.md](../paint-accuracy/README.md).
