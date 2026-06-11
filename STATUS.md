# STATUS — where this project is and where to pick up

> Companion to [HANDOFF.md](./HANDOFF.md) (the original plan, kept verbatim).
> This file is the living state. Last session: 2026-06-11, pushed to `main`.

## TL;DR

Phases 0 **and** 1 are done and exceeded. The engine matches headless Chromium
on **217/217 corpus cases** (≤1px positions/sizes, ≤2px text sizes), most at
0.00px. The product surface works end-to-end: `check()` library, CLI, MCP
server, Claude Code skill, CI. A 4-viewport check runs in ~8ms with no
browser. What remains is launch work (naming, npm, demo GIF) and Phase 2
(grid via Taffy, React component support, GitHub Action).

## What exists (repo tour)

```
packages/core/        the engine
  src/parser.ts         JSX/HTML → tree (htmlparser2; inline-collapse rules)
  src/tailwind.ts       Tailwind v4 class → style resolver (+ responsive
                        prefixes, inheritance, classAffectsLayout)
  src/fonts.ts          FontStore: HarfBuzz-WASM shaping (Chrome's shaper),
                        fontkit for parsing/coverage, per-codepoint fallback
  src/text.ts           line breaker (Intl.Segmenter; shapes whole lines)
  src/layout.ts         Yoga bridge (web defaults) + corrective fixpoint loop
  src/flexfix.ts        CSS §9.7 resolver, §9.3 wrap lines, §4.5 auto minimums,
                        fit-content cross sizing, intrinsic width approximation
packages/rules/       the product — the published npm package "layoutlint"
  src/check.ts          check(source, {viewports, rules, fonts}) → report
  src/rules.ts          no-overflow, no-overlap, fits-viewport,
                        no-text-truncation — agent-shaped violations
  src/cli.ts            layoutlint check <file> --viewports 320,1440 [--json]
  src/mcp.ts            stdio MCP server, bin: layoutlint-mcp
  fonts/                Inter 400/500/600/700 + Noto Sans Bengali (ships in pkg)
  test/check.test.ts    11 unit tests (bun test)
  package.json          build: bun bundle (core bundled, npm deps external) +
                        dts-bundle-generator → dist/; bins point at dist/
packages/skill/       SKILL.md (Claude Code skill)
packages/oracle/      DEV-ONLY: Playwright golden generator + comparator
  src/generate.ts       renders corpus in Chromium → golden/*.json
  src/compare.ts        engine vs golden → accuracy/ scoreboard, exit 1 on fail
  src/debug-case.ts     bun run …/debug-case.ts <name> → per-node deltas
corpora/cases.ts      56 style-object cases (engine in isolation)
corpora/tailwind-cases.ts  41 real-markup cases (full pipeline vs real
                        vendored Tailwind v4 browser build in the oracle)
corpora/generated.ts  120 seeded fuzz cases (deterministic from seed)
golden/               committed Chromium golden files (regenerated in CI)
accuracy/             scoreboard output (README.md + report.json)
vendor/               pinned @tailwindcss/browser 4.1.16 (oracle only)
.github/workflows/accuracy.yml   typecheck + bun test + regenerate goldens
                        + accuracy gate on every push/PR
```

## Dev loop

```sh
bun install
npx playwright install chromium --with-deps   # oracle only
bun test              # unit tests
bun run oracle        # regenerate golden files (headless Chromium)
bun run accuracy      # scoreboard; exit 1 if any case over threshold
bun run packages/oracle/src/debug-case.ts gen-042   # grind one failure
LL_NO_FLEXFIX=1 bun run packages/oracle/src/compare.ts  # raw Yoga (debugging)
```

The loop that built this: add/widen corpus → `oracle` → `accuracy` → pick a
FAIL → `debug-case.ts` → fix engine or document envelope → green → commit.

## Platform notes

- **Goldens are platform-independent as of 2026-06-11.** The oracle embeds
  every font — including the vendored `vendor/fonts/NotoColorEmoji.ttf`
  (v2.051) — as `@font-face` data URIs, and compare/debug load the same
  files into the engine chain. Verified: regenerating all 217 goldens on
  macOS vs the Linux-generated committed set differed by ≤0.03px in 3
  emoji-bearing gen-* cases, byte-identical rects everywhere else. `bun run
  oracle` + `bun run accuracy` are now trustworthy on any platform with the
  same pinned Playwright Chromium (148.0.7778.96 / playwright 1.60).
- The *product* (`check()` / CLI / MCP) still uses the system emoji font
  when present (`/usr/share/fonts/...`) and skips it otherwise — the 10MB
  font is dev-only vendored and does NOT ship in the npm package.
- `bun test` and the CLI/MCP/check() work on macOS — no browser, no Linux
  dependency.

## What was learned/decided this session (beyond HANDOFF.md)

All engine-parity lessons are documented in README "Engine notes" — read
that section before touching layout code. Headlines: Yoga needs our §9.7 /
fit-content corrective pass (flexfix.ts); shaping must be HarfBuzz, whole
lines, grapheme-cluster letter-spacing; oracle needs the font-hinting flag;
fit-content sizing of wrap containers is the documented envelope edge.

## Next steps, in recommended order

1. **Publish** — naming is DONE (`layoutlint`, decided 2026-06-11; the old
   codename `agent-eyes` is squatted on npm by an active adjacent product).
   Packaging is DONE: single package `layoutlint` (CLI + MCP bins folded in,
   core bundled, fonts shipped, runs under plain Node — CI smoke-tests this).
   Remaining, all manual: rename the GitHub repo (remote is still
   `saifulapm/OpenEye-`; package.json points at `saifulapm/layoutlint`),
   grab the domain, then `cd packages/rules && npm publish` (prepublishOnly
   builds). License set to MIT (LICENSE at root + in package).
2. **Demo GIF** for the README (HANDOFF §8: agent edits component → check
   catches overflow at 320 → fixes → green; no browser window).
3. **Corpus to 300+**: bump `GENERATED_COUNT` in corpora/generated.ts
   (e.g. 200) and/or widen the generator (new features = new divergence
   hunting); grind any new failures with debug-case.ts. Also worth adding:
   scraped/adapted shadcn-style real components to tailwind-cases.ts.
4. **GitHub Action** ("layout lint" — run CLI on changed component files).
5. **Phase 2 engine**: CSS Grid via Taffy WASM (resolver already warns on
   grid classes); React component support via react-test-renderer;
   `line-clamp`; vendored emoji font; `assertTapTargets`/`assertContrast`.
6. Nice-to-haves: `lineHeight: normal` parity; mixed-weight inline span
   measurement (currently parent-style, documented ≤2px error).

## Numbers to brag about (verified, reproducible)

- 217/217 corpus cases within threshold; most 0.00px.
- 41 Tailwind cases verified against the *real* Tailwind v4 build in Chrome.
- ~8ms per 4-viewport `check()` (Bun, warm).
- Bangla + emoji (incl. ZWJ ligation) text measurement matches Chrome.
