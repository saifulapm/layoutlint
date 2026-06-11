---
name: layout-check
description: >
  Deterministically verify UI layout (overflow, overlap, viewport fit, text
  truncation) for JSX/HTML + Tailwind components without a browser or
  screenshots. Use after creating or editing any UI component, before
  declaring UI work done, or when asked whether a layout "fits" or "breaks"
  at some screen size.
---

# Layout checking with agent-eyes

agent-eyes computes real flexbox layout (Yoga) with real font metrics
(fontkit) in milliseconds and asserts layout invariants across viewports.
It is validated against headless-Chromium golden files — treat its reports
as ground truth for the supported subset (flexbox + Tailwind; grid is
approximated, see Limits).

## When to run

After **every** edit to a component's structure, classes, or copy:

```sh
bun run packages/cli/src/cli.ts check <file> --json
```

(or `npx agent-eyes check <file> --json` once installed). Default viewports
are 320, 375, 768, 1440 — override with `--viewports 320,1440`.

## Reading the report

`pass: true` → done. Otherwise each violation tells you what, where, by how
much, and a plausible fix:

- `element` / `path` — which node (CSS-ish selector + tree path)
- `detail` — measured vs available px, e.g. `text is 342px wide but its box is 288px`
- `suggestion` — a starting point, not a mandate

## Fixing violations

1. Fix the **root cause**, not the symptom: an overflow at 320px usually
   means a fixed width (`w-64`) that should be fluid (`w-full max-w-64`),
   a missing `flex-wrap`, or a missing `min-w-0` on a flex child that must
   shrink.
2. `no-text-truncation` on a `truncate` element is only a bug if the design
   didn't intend ellipsis at that viewport — judge from context.
3. Re-run the check after each fix until `pass: true` at all viewports.
4. Do not "fix" violations by deleting content or hiding elements unless
   asked.

## Limits (v0)

- Flexbox only; `grid` is approximated as a column and emits a warning.
- Static markup only: JSX expressions/props are not evaluated.
- Text measures with the bundled Inter font unless fonts are configured.
- Yoga resolves competing min/max flex constraints single-pass (CSS does it
  iteratively) — sizes can differ from Chrome when constraints conflict.
- Warnings list classes the resolver could not honor: factor them into your
  confidence, and verify in a real browser if a warned class is load-bearing.
