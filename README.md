# agent-eyes (working codename)

Deterministic UI layout verification for AI coding agents: catch overflow,
overlap, and truncation in milliseconds — **no browser, no screenshots**.

Pure TypeScript: Yoga (flexbox) + fontkit (font metrics) + Intl.Segmenter
(line breaking), validated against headless Chromium golden files, the same
oracle method [Pretext](https://github.com/chenglou/pretext) proved for text
layout. Not a pixel-perfect browser — a deterministic bug-catcher for agent
workflows.

See [HANDOFF.md](./HANDOFF.md) for the full plan. **Current status: Phase 1
MVP** — parser, Tailwind resolver, assertion rules, CLI, MCP server, and
Claude Code skill are functional; corpus and polish are ongoing.

## Quickstart

```sh
# CLI — pretty output for humans, --json for agents (exit 1 on violations)
bun run packages/cli/src/cli.ts check src/components/Card.tsx --viewports 320,1440

# Library
import { check } from 'agent-eyes'
const report = await check(componentSource, { viewports: [320, 375, 768, 1440] })

# MCP server (stdio) — exposes the check_layout tool
bun run packages/mcp/src/server.ts

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
A 4-viewport check on a typical component runs in ~30ms, no browser involved.

## Accuracy scoreboard

Engine vs Chromium `getBoundingClientRect`, thresholds: positions ≤1px,
sizes ≤1px (text sizes ≤2px). **62/65 corpus cases within threshold**, the
overwhelming majority at a flat **0.00px delta** (full per-case table in
[accuracy/README.md](./accuracy/README.md)).

- 50 style-object cases exercise the layout engine in isolation: nested
  rows/columns, every justify/align value, wrap variants + align-content,
  percentage widths and flex-basis, shrink, min/max constraints, auto and
  negative margins, absolute/relative positioning, and text — Latin
  wrapping, unbreakable URLs, letter-spacing, emoji (CBDT color-font
  metrics), Bangla complex-script shaping, and a kitchen-sink card.
- 15 Tailwind-input cases (cards, navbars, hero, responsive stat grids,
  forms, badges, sidebar layouts, media objects, alerts, modals,
  breadcrumbs, footers, a Bangla profile) run the **full pipeline** —
  parser → resolver → Yoga — against headless Chromium executing the real,
  vendored Tailwind v4 browser build. **All 15 pass**, including responsive
  `sm:` breakpoint behavior verified at two viewports.

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
- `line-height: normal` is out of scope; style-object corpus text sets
  explicit px line-height. (The Tailwind path is unaffected: preflight's
  `html { line-height: 1.5 }` and the `text-*`/`leading-*` scales give
  every text node a deterministic line-height.)
- ZWJ emoji sequences (👨‍👩‍👧) measure as the sum of their parts — the CBDT
  color-emoji font defeats fontkit's shaper, so we fall back to raw
  cmap+hmtx advances.

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
- Unstyled inline elements (`<strong>`, `<span>` without classes) collapse
  into their parent's text and measure with the parent's font style; a bold
  span inside a paragraph measures at the paragraph's weight.
- Everything measures with the bundled font chain (Inter, Noto Sans
  Bengali, system emoji); `font-mono`/`font-serif` are ignored.

## Repo layout

```
packages/
  core/      # parser, Tailwind resolver, Yoga bridge, fontkit text measure
  rules/     # the `agent-eyes` package: 4 assertion rules + check() API
  oracle/    # Playwright golden-file generator + comparator (dev-dep only)
  cli/       # `agent-eyes check <file>` (pretty + --json)
  mcp/       # stdio MCP server exposing check_layout
  skill/     # Claude Code skill (SKILL.md)
corpora/     # style-object cases + Tailwind-input cases
golden/      # Chromium golden files (committed, regenerated in CI)
accuracy/    # scoreboard output (report.json + README.md)
fonts/       # Inter (4 weights) + Noto Sans Bengali
vendor/      # pinned @tailwindcss/browser build (oracle only)
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
