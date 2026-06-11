# layoutlint

Deterministic UI layout verification for AI coding agents: catch overflow,
overlap, and truncation in milliseconds — **no browser, no screenshots**.

Pure TypeScript: Yoga (flexbox) + HarfBuzz-WASM (text shaping — the same
shaper Chrome uses) + fontkit (font parsing) + Intl.Segmenter (line
breaking), validated against headless Chromium golden files, the same
oracle method [Pretext](https://github.com/chenglou/pretext) proved for text
layout. Not a pixel-perfect browser — a deterministic bug-catcher for agent
workflows.

See [HANDOFF.md](./HANDOFF.md) for the original plan and
[STATUS.md](./STATUS.md) for current state, dev loop, platform notes, and
next steps. **Current status: Phases 0–1 complete** — engine, parser,
resolver, rules, CLI, MCP server, skill, fuzz corpus, and CI are all
functional and green.

## Quickstart

```sh
# CLI — pretty output for humans, --json for agents (exit 1 on violations)
npx layoutlint check src/components/Card.tsx --viewports 320,1440
# (from this repo: bun run packages/rules/src/cli.ts check …)

# Library
import { check } from 'layoutlint'
const report = await check(componentSource, { viewports: [320, 375, 768, 1440] })

# MCP server (stdio) — exposes the check_layout tool
npx layoutlint-mcp
# (from this repo: bun run packages/rules/src/mcp.ts)

# Claude Code skill
packages/skill/SKILL.md
```

A failing check answers *what, where, by how much, and a plausible fix*:

```json
{
  "rule": "no-overflow",
  "element": "div.flex.items-center > p.text-sm.font-semibold",
  "detail": "text is 323.6px wide but its box is 104px — content overflows by 219.6px",
  "measured": { "width": 323.6 },
  "available": { "width": 104 },
  "suggestion": "text is nowrap — add \"truncate\" (to clip with ellipsis) or remove the nowrap so it can wrap"
}
```

Rules: `no-overflow`, `no-overlap`, `fits-viewport`, `no-text-truncation`.
A 4-viewport check on a typical component runs in ~8ms, no browser involved.

## Accuracy scoreboard

Engine vs Chromium `getBoundingClientRect`, thresholds: positions ≤1px,
sizes ≤1px (text sizes ≤2px). **217/217 corpus cases within threshold** —
the overwhelming majority at a flat **0.00px delta** (full per-case table
in [accuracy/README.md](./accuracy/README.md), regenerated in CI on every
push).

- 56 style-object cases exercise the layout engine in isolation: nested
  rows/columns, every justify/align value, wrap variants + align-content,
  percentage widths and flex-basis, shrink, min/max constraint conflicts,
  auto and negative margins, absolute/relative positioning, and text —
  Latin wrapping, unbreakable URLs, letter-spacing, emoji (CBDT color-font
  metrics), Bangla complex-script shaping, and a kitchen-sink card.
- 41 Tailwind-input cases (cards, navbars, heroes, responsive stat tiles,
  forms, badges, sidebar layouts, media objects, alerts, modals, chat
  bubbles, settings rows, steppers, timelines, KPI dashboards, paginations,
  tabs, toasts, login and error pages, Bangla content, …) run the **full
  pipeline** — parser → resolver → Yoga — against headless Chromium
  executing the real, vendored Tailwind v4 browser build.
- 120 **seeded fuzz cases** ([corpora/generated.ts](./corpora/generated.ts)):
  deterministic pseudo-random trees mixing every supported feature, with
  Latin/Bangla/nowrap text at random sizes and weights. The fuzzer found
  six divergence classes the curated corpus missed; all are fixed. Widening
  the generator is the cheapest way to hunt the next one.

### Engine notes (hard-won parity lessons)

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
- **Known envelope edge:** fit-content sizing *of a wrap container itself*
  (a wrap row inside a row, or in a non-stretch column) is not modeled —
  the fuzzer avoids generating it, and real Tailwind UI almost always
  stretches wrap rows full-width.
- **The oracle must run Chromium with `--font-render-hinting=none`.**
  Headless Linux Chromium otherwise grid-fits every glyph advance to whole
  pixels (FreeType full hinting) — "Dismiss" at 14px measures 49px hinted vs
  51.33px linear — which diverges from fontkit *and* from Chrome on
  macOS/Windows, where subpixel positioning is the norm. With the flag,
  Chrome and fontkit agree to ~0.01px. Found by grinding the
  `card-kitchen-sink` failure; this is the kind of discrepancy the harness
  exists to surface.
- `line-height: normal` is out of scope; style-object corpus text sets
  explicit px line-height. (The Tailwind path is unaffected: preflight's
  `html { line-height: 1.5 }` and the `text-*`/`leading-*` scales give
  every text node a deterministic line-height.)
- Emoji (including ZWJ sequences like 👨‍👩‍👧, which ligate to a single glyph)
  shape correctly through HarfBuzz against the system CBDT color-emoji
  font — a font fontkit's own shaper cannot process at all.

### Phase 1 scope notes (parser + resolver)

- Input is **static** JSX/HTML — expressions, props, and conditionals are
  not evaluated (React component support via react-test-renderer is a
  Phase 2 item).
- `grid` resolves as a flex column with a warning; Taffy-backed grid is the
  planned fix. `order-*`, `line-clamp-*`, `w-fit/min/max`, and `max-w-prose`
  warn and are skipped.
- Non-flex elements lay out as stretch columns: correct for Tailwind's
  zeroed-margin world, but block-flow **margin collapsing** and
  inline-block **shrink-to-fit in block flow** are not modeled — a bare
  `<button>` in a non-flex parent measures full-width. Keep buttons in flex
  rows (as Tailwind components almost always do).
- Inline elements whose classes don't affect geometry (colors, plain
  font-weight) collapse into their parent's text and measure with the
  parent's font style — a bold span inside a paragraph measures at the
  paragraph's weight (≤2px on realistic lines). Spans with geometry classes
  (padding, size, display) and all children of flex containers stay boxes,
  matching CSS blockification.
- Everything measures with the bundled font chain (Inter, Noto Sans
  Bengali, system emoji); `font-mono`/`font-serif` are ignored.

## Repo layout

```
packages/
  core/      # parser, Tailwind resolver, Yoga bridge, fontkit text measure
  rules/     # the published `layoutlint` package: 4 assertion rules,
             #   check() API, CLI (src/cli.ts), MCP server (src/mcp.ts),
             #   bundled fonts (Inter ×4 + Noto Sans Bengali)
  oracle/    # Playwright golden-file generator + comparator (dev-dep only)
  skill/     # Claude Code skill (SKILL.md)
corpora/     # style-object cases + Tailwind-input cases + seeded fuzz corpus
golden/      # Chromium golden files (committed, regenerated in CI)
accuracy/    # scoreboard output (report.json + README.md)
vendor/      # pinned @tailwindcss/browser build (oracle only)
```

## Dev loop

```sh
bun install
npx playwright install chromium   # oracle only — never a runtime dep
bun test            # unit tests for the rules + resolver + check API
bun run oracle      # regenerate golden files from headless Chromium
bun run accuracy    # engine vs golden, prints the scoreboard
bun run packages/oracle/src/debug-case.ts <name>   # tree + per-node deltas
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
