# layoutlint

Your coding agent writes UI it can never see. layoutlint is its eyes:
**layout checks and screenshots in milliseconds — no browser.**

![layoutlint demo: check catches an overflow at 320px, the suggested one-class fix makes it green](demo/demo.gif)

It computes the real layout — same flexbox resolution as CSS, same text
shaper as Chrome, real font metrics — instead of launching a browser. Then
it either **asserts** (overflow, overlap, viewport fit, truncation) or
**paints** what it computed.

Verified, not approximate: **316/316 layout cases match headless Chromium
within 1px** (most at 0.00px), and every render is **pixel-diffed against a
Chromium screenshot**, gated in CI on every push.

## Check

```sh
npx @saifulapm/layoutlint check Card.tsx --viewports 320,375,768,1440
```

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
shaped for an agent to self-correct. `--json` for machines; exit `1` on
violations. Rules: `no-overflow`, `no-overlap`, `fits-viewport`,
`no-text-truncation`. A 4-viewport check runs in ~8ms.

## Render

```sh
npx @saifulapm/layoutlint render Card.tsx --viewport 375 -o card.png   # or .svg
```

![demo card rendered by layoutlint, not a browser](demo/card-375.png)

That image came from the engine, not Chrome: real Tailwind v4 colors
(extracted from Chrome itself), text as glyph outlines from the same shaping
that measured it, borders, radii, clipping. The SVG is self-contained —
renders identically anywhere, no fonts needed.

## React components

A `.tsx`/`.jsx` file with imports/exports is **executed**, not just parsed:
your project's own React renders it (`renderToStaticMarkup`), so hooks,
context, conditional classNames, and multi-file imports all resolve before
the layout check.

```sh
npx @saifulapm/layoutlint check Navbar.tsx --props '{"signedIn":true}'
npx @saifulapm/layoutlint render Sections.tsx --component Footer -o footer.png
```

- needs `react` + `react-dom` installed in *your* project (optional peers —
  layoutlint never ships its own copy, so hooks always work)
- TSX/TS transpile, tsconfig `paths`, CSS / CSS-module / asset imports are
  handled (stylesheets are stubbed — layout comes from Tailwind classes)
- `--component <Name>` picks a named export; the default export otherwise
- out of scope in v1: RSC, suspense/data fetching; effects never run
  (`renderToStaticMarkup` semantics)
- `--no-execute` forces a static parse without running anything

> **Security:** checking a component file executes that file's module graph,
> top-level code included — treat it like running the project's tests. In
> CI, never run it on untrusted code: trigger on `pull_request` from trusted
> branches, never `pull_request_target` against fork code.

19 real React components (forms, context, `useState`, multi-file imports)
sit in the corpus and pass the same Chromium gates as everything else.

## For agents

```jsonc
// MCP (e.g. Claude Code .mcp.json) — check_layout + render_layout tools
{ "mcpServers": { "layoutlint": { "command": "npx", "args": ["-y", "-p", "@saifulapm/layoutlint", "layoutlint-mcp"] } } }
```

```yaml
# GitHub Action — layout-lint changed components on every PR
- uses: saifulapm/layoutlint@v0
```

```ts
// Library
import { check, render } from '@saifulapm/layoutlint';
const report = await check(source, { viewports: [320, 768] });
const { png } = await render(source, { viewport: 375, format: 'png' });
```

## Scope, honestly

Flexbox + Tailwind v4; JSX/HTML fragments or executed React components
(client-rendered, no RSC). CSS Grid approximates as a column
(warned). Shadows/gradients/opacity aren't painted yet. Not a browser
replacement for E2E — a deterministic bug-catcher and renderer for the
edit-check-fix loop, with documented
[envelope edges](docs/engineering.md#scope-notes-parser--resolver).

## How it's validated

A 316-case corpus (hand-written + real Tailwind markup + seeded fuzzing +
executed React components) is
rendered in pinned headless Chromium; the engine must match every
`getBoundingClientRect` within 1px and every screenshot within a documented
pixel-diff budget — on every push. Scoreboards:
[accuracy](accuracy/README.md) · [paint](paint-accuracy/README.md) ·
methodology and parity lessons: [docs/engineering.md](docs/engineering.md).

MIT
