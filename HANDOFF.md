# HANDOFF — Deterministic UI Layout Verification for AI Coding Agents

> **Working codename:** `agent-eyes` (final name TBD — see Naming section)
> **Owner:** Saiful (Lareys)
> **Date:** 2026-06-11
> **Status:** Greenlit. Start with Phase 0 spike.

-----

## 1. One-line pitch

A pure TypeScript library + Claude Code skill/MCP that lets AI coding agents verify UI layout (“does this text overflow? do these elements overlap? does it fit at 320px?”) **deterministically, in milliseconds, with no browser and no screenshots.**

## 2. Why this exists (context from research)

- AI coding agents are blind. Today’s verification = Playwright + screenshots + vision models: slow, flaky, token-expensive, requires a browser in the sandbox.
- `chenglou/pretext` (46k★, June 2026) just proved the pattern: reimplement one path of a giant engine (browser text layout) as a pure library, using the engine itself as a test oracle so AI can grind edge cases. We apply the same pattern to **layout assertions**.
- Market check (done 2026-06-11):
  - Commercial tools (Shiplight, etc.) = browser-driving agents. Not pure-code.
  - Academic prior art: VizAssert (PLDI 2018) — SMT-based layout verification, never productized. Good for the README’s “prior art” section.
  - **No pure deterministic layout-assertion library exists.** All primitives now exist (Yoga, Taffy, Pretext, fontkit). Nobody has assembled them. Speed matters — Pretext’s audience could build this any month.

## 3. Core strategic decisions (already made — don’t relitigate)

|Decision        |Choice                                                                                                  |Rationale                                                                                                                            |
|----------------|--------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------|
|Input format    |JSX/HTML subset + **Tailwind classes only** in v0                                                       |AI-generated UI is overwhelmingly Tailwind; classes resolve via static lookup, no CSS cascade. Same scoping trick as Vercel’s Satori.|
|Layout engine   |**Yoga** (flexbox) in v0; Taffy (WASM) for grid in v1                                                   |Don’t write a layout engine. Assemble.                                                                                               |
|Text measurement|fontkit font metrics in Node v0; adopt Pretext server-side when it ships                                |Pretext currently needs canvas; fontkit is pure JS, parses TTF/OTF directly.                                                         |
|Promise         |“Deterministically catches the layout bugs agents actually create”                                      |NOT pixel-perfect Chrome parity. Honest + achievable.                                                                                |
|Accuracy method |Chrome (Playwright) golden files as oracle; published accuracy scoreboard like Pretext’s `/accuracy` dir|The harness IS the dev loop. Claude Code grinds discrepancies.                                                                       |
|License / launch|MIT, OSS, npm + CLI + MCP server + Claude Code skill                                                    |Skill is the viral wedge. Demo: agent catches overflow with no browser open.                                                         |
|Product layer   |The **assertion API + agent-shaped diagnostics**, not the engine                                        |Engine parts are commodities; verification UX is the moat.                                                                           |

## 4. Architecture

```
┌─────────────────────────────────────────────┐
│ INPUT: JSX/HTML string + Tailwind classes   │
└──────────────────┬──────────────────────────┘
                   ▼
┌─────────────────────────────────────────────┐
│ 1. PARSER                                   │
│  - parse JSX/HTML → element tree            │
│  - Tailwind class → style object            │
│    (static map; handle responsive prefixes  │
│     sm:/md:/lg: per target viewport)        │
└──────────────────┬──────────────────────────┘
                   ▼
┌─────────────────────────────────────────────┐
│ 2. LAYOUT CORE                              │
│  - Yoga node tree from style objects        │
│  - text nodes → Yoga measure functions      │
│    backed by fontkit metrics + line         │
│    breaking (Intl.Segmenter)                │
│  - compute → box tree {x,y,w,h} per node    │
└──────────────────┬──────────────────────────┘
                   ▼
┌─────────────────────────────────────────────┐
│ 3. ASSERTIONS (the product)                 │
│  assertNoOverflow / assertNoOverlap /       │
│  assertFits / assertNoTextTruncation        │
│  - run across viewports [320,375,768,1440]  │
│  - output: agent-shaped JSON diagnostics    │
└──────────────────┬──────────────────────────┘
                   ▼
┌─────────────────────────────────────────────┐
│ 4. DISTRIBUTION                             │
│  npm lib · CLI (`npx agent-eyes check`)     │
│  MCP server · Claude Code skill             │
└─────────────────────────────────────────────┘
```

## 5. Assertion API draft (v0 surface)

```ts
import { check } from 'agent-eyes'

const report = await check(componentSource, {
  viewports: [320, 375, 768, 1440],
  fonts: { 'Inter': './fonts/Inter.ttf' },   // explicit fonts only in v0
  rules: ['no-overflow', 'no-overlap', 'fits-viewport', 'no-text-truncation'],
})

// report shape — designed for an agent to read and self-correct:
{
  pass: false,
  viewport: 320,
  violations: [{
    rule: 'no-overflow',
    element: 'div.card > h2',            // CSS-path of offending node
    detail: 'text width 342px exceeds container 288px',
    measured: { width: 342 },
    available: { width: 288 },
    suggestion: 'add truncate or reduce text; container has p-4 (32px) padding'
  }]
}
```

Design rule: every violation must answer *what, where, by how much, and a plausible fix* — that’s what makes the agent loop close.

## 6. Phase plan

### Phase 0 — Spike (Week 1–2) ← START HERE

Goal: prove accuracy is reachable. No parser yet.

- [ ] `packages/core`: Yoga (yoga-layout npm) computing a hardcoded style-object tree
- [ ] Text measure function: fontkit width sums + Intl.Segmenter line breaking → height for a given width (load Inter.ttf as the test font)
- [ ] `packages/oracle`: Playwright script that renders the same tree as real HTML in headless Chromium and dumps `getBoundingClientRect` for every node → golden JSON
- [ ] Comparator: engine boxes vs golden boxes, per-node px delta; define pass threshold (suggest: ≤1px on positions, ≤2px on text heights)
- [ ] Corpus v0: 50 handwritten cases — nested flex rows/cols, wrapping text, padding/margin/gap, fixed vs auto sizing, min/max constraints, long unbroken strings, emoji, Bangla text (your edge!)
- [ ] **Exit criteria:** ≥45/50 cases within threshold. If yes → Phase 1. If no → identify whether failures are Yoga config issues or text-measurement issues before deciding anything.

### Phase 1 — MVP (Week 3–6)

- [ ] JSX/HTML parser (suggest: parse with `htmlparser2` or a small JSX transform; avoid full React rendering in v0)
- [ ] Tailwind resolver: static class→style map covering layout-relevant classes (flex, grid stub, w/h, p/m, gap, text-*, font-*, leading-*, truncate, overflow-*, min/max-*) + responsive prefixes
- [ ] 4 assertion rules + multi-viewport runner
- [ ] Agent-shaped JSON reporter (+ pretty CLI output for humans)
- [ ] CLI: `npx agent-eyes check src/components/Card.tsx --viewports 320,1440`
- [ ] MCP server exposing `check_layout` tool
- [ ] Claude Code skill: SKILL.md teaching the agent to run checks after UI edits and fix violations
- [ ] Corpus → 300+ real-world Tailwind components (scrape shadcn/ui examples, Tailwind UI-style patterns, AI-generated components); regenerate golden files in CI
- [ ] Publish accuracy scoreboard in README (Pretext-style)

### Phase 2 — Post-launch

- [ ] CSS Grid via Taffy WASM
- [ ] Adopt Pretext server-side measurement when available (or contribute it)
- [ ] React component support via react-test-renderer (resolve props/conditionals)
- [ ] GitHub Action for CI (“layout lint”)
- [ ] `assertTapTargets` (a11y: 44px minimum), `assertContrast` — accessibility rules expand the audience

## 7. The oracle harness (dev loop — this is the Pretext method)

1. Corpus case = `{ name, html, tailwindClasses, viewport }`
1. `bun run oracle` → Playwright renders each case → golden `{selector: rect}` JSON committed to repo
1. `bun test accuracy` → engine vs golden, prints per-case deltas + overall % within threshold
1. Failures become work items. Point Claude Code at a failing case: “engine says h=96, Chrome says h=120, here’s the tree — find why.” Grind until green.
1. CI re-runs against pinned Chromium version; bump deliberately.

## 8. Launch plan

- Name + npm + domain reserved before any public commit
- README leads with a GIF: Claude Code edits a card component → runs check → catches `no-overflow` at 320px → fixes it → green. **No browser window ever appears.**
- Show HN + tweet thread; reply into Pretext discussions (same audience, complementary tool — frame as “built on the shoulders of Pretext/Yoga”)
- Position VizAssert as academic prior art (credibility, shows the idea is sound and the productization is the new part)
- Anti-goal in README: “not a pixel-perfect browser. A deterministic bug-catcher for agent workflows.”

## 9. Naming candidates (decide before launch)

`agent-eyes` · `lint-layout` · `boxcheck` · `overlook` · `viewfinder` · `sightline` — check npm/domain availability. Should sound like a linter, not a browser.

## 10. Risks & mitigations

- **Someone in Pretext’s orbit ships first** → speed > polish; ship Phase 1 in 6 weeks max; build in public from day one to claim the territory.
- **Accuracy wall (Yoga ≠ Chrome flexbox in edge cases)** → that’s why Phase 0 exists; threshold-based promise, not pixel-perfect; document known gaps openly (Pretext does this and it builds trust).
- **Tailwind-only feels narrow** → it’s the wedge, not the ceiling; say so in README; inline-style input also works trivially since the resolver is bypassed.
- **Font availability in sandboxes** → v0 requires explicit font files; ship Inter as default fallback with a warning.

## 11. Repo skeleton to scaffold first

```
agent-eyes/
├── packages/
│   ├── core/        # parser, tailwind resolver, yoga bridge, text measure
│   ├── rules/       # assertion rules + reporter
│   ├── oracle/      # playwright golden-file generator + comparator
│   ├── cli/
│   ├── mcp/
│   └── skill/       # Claude Code skill (SKILL.md + helpers)
├── corpora/         # test cases (committed)
├── golden/          # chrome golden files (committed, regenerated in CI)
├── accuracy/        # scoreboard output
└── README.md
```

Stack: TypeScript, Bun, yoga-layout, fontkit, htmlparser2, Playwright (dev-dep only — never a runtime dep, that’s the whole point).

## 12. First prompt to give Claude Code

> Read HANDOFF.md. Execute Phase 0. Scaffold the repo skeleton from section 11, then implement packages/core (Yoga + fontkit text measurement on hardcoded trees) and packages/oracle (Playwright golden-file generator + comparator). Write the first 10 corpus cases from section 6 Phase 0, generate golden files, and report the accuracy table. Stop and show me results before expanding the corpus to 50.