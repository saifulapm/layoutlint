# layoutlint

Deterministic UI layout checks for JSX/HTML + Tailwind — catch overflow,
overlap, viewport breakage, and text truncation in **milliseconds, with no
browser and no screenshots**.

Built for AI coding agents (and CI): pure TypeScript layout computation —
Yoga (flexbox) + HarfBuzz-WASM text shaping (the same shaper Chrome uses) +
real font metrics — validated against headless-Chromium golden files:
**217/217 corpus cases within ≤1px**, most at a flat 0.00px. A 4-viewport
check runs in ~8ms.

## CLI

```sh
npx layoutlint check src/components/Card.tsx
npx layoutlint check Card.tsx --viewports 320,1440 --json   # agent-shaped report
```

Exit code `0` = all rules pass at all viewports, `1` = violations, `2` = usage error.

```
Card.tsx
  ✗ 320px — 1 violation(s)
      fits-viewport div.flex.w-96
        right edge at 384px exceeds the 320px viewport by 64px — causes horizontal scroll
        fix: replace fixed widths with max-w-full / w-full, or add flex-wrap so content can reflow
  ✓ 768px
  ✓ 1440px
```

Every violation answers *what, where, by how much, and a plausible fix* —
shaped for an agent (or you) to act on directly.

## Library

```ts
import { check } from 'layoutlint';

const report = await check(componentSource, { viewports: [320, 375, 768, 1440] });
// report.pass, report.viewports[n].violations[…], report.warnings
```

## Render — see the component without a browser

```sh
npx layoutlint render Card.tsx --viewport 375 -o card.png   # or .svg / stdout
```

```ts
import { render } from 'layoutlint';
const { svg, png } = await render(source, { viewport: 375, format: 'png' });
```

Paints the computed layout deterministically — backgrounds, borders + radii,
real Tailwind v4 colors, text as glyph outlines (self-contained SVG), and
`overflow:hidden` clipping. Pixel-diffed against Chromium screenshots in CI
(≤7% gate; residual is glyph antialiasing). Not painted in v1: shadows,
gradients, opacity, transforms.

## MCP server

`layoutlint-mcp` is a stdio MCP server exposing a `check_layout` tool, so
agents can verify layout after every UI edit:

```jsonc
// e.g. Claude Code: .mcp.json
{ "mcpServers": { "layoutlint": { "command": "npx", "args": ["layoutlint-mcp"] } } }
```

Tools: `check_layout` (violations report) and `render_layout` (PNG image of
the component — the agent's eyes).

## Rules

- `no-overflow` — content wider/taller than its box
- `no-overlap` — sibling boxes colliding
- `fits-viewport` — anything crossing the right viewport edge (horizontal scroll)
- `no-text-truncation` — `truncate`/clipped text that loses content

## Scope (v0)

- Flexbox + Tailwind v4 classes (and inline `style` objects). CSS Grid is
  approximated as a column and reported as a warning.
- Static markup: JSX expressions/props are not evaluated.
- Text measures with the bundled Inter (+ Noto Sans Bengali, + system Noto
  Color Emoji when present); pass `fonts` to use your own.
- Not a pixel-perfect browser — a deterministic bug-catcher with a
  threshold-based accuracy promise, verified against Chromium in CI.

Repo, accuracy scoreboard, and methodology:
[github.com/saifulapm/layoutlint](https://github.com/saifulapm/layoutlint)
