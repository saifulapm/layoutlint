# Focus Memory — layoutlint

## Principles
- **MUST NOT** make Playwright/Chromium a runtime dependency of the published package — browser stays dev-only (oracle). This is the product's entire premise.
- **MUST** validate every engine capability against Chromium golden files with explicit thresholds, gated in CI ("verified accuracy" is the brand).
- **MUST NOT** change corpus text content or golden-affecting behavior without regenerating goldens in the same commit.
- **PREFER** documenting an envelope edge over chasing pixel-perfection past the thresholds (positions/sizes ≤1px, text ≤2px).
- **MUST** keep the published npm package lean: dev-only assets (vendored emoji font, Tailwind browser build, goldens) never ship in `files`.

## Decisions
| Date | Decision | Why |
|------|----------|-----|
| 2026-06-11 | Name: `layoutlint` (was agent-eyes) | agent-eyes squatted on npm by active adjacent product |
| 2026-06-11 | Single npm package; CLI+MCP bins folded into packages/rules; core bundled | One install gives everything; no npm org needed |
| 2026-06-11 | Goldens made platform-independent (hermetic @font-face incl. vendored NotoColorEmoji) | macOS dev loop; proven ≤0.03px vs Linux set |
| 2026-06-12 | render v1: SVG always + PNG via @resvg/resvg-js dependency | User choice; PNG is the agent/vision use case |
| 2026-06-12 | render validated by pixel-diff vs Chromium screenshots, gated in CI | User choice; extends the accuracy brand to paint |
| 2026-06-12 | render v1 paints: backgrounds, borders+radius, text glyphs/color, img placeholders. No shadows/gradients/opacity/transforms | User choice; honest subset |

## Project Context
- Monorepo (bun workspaces): packages/core (engine, private), packages/rules (published `layoutlint`), packages/oracle (dev-only Playwright golden gen + compare), packages/skill.
- Accuracy state: 297/297 corpus cases within threshold (56 style-object, 41 Tailwind, 200 fuzz).
- READ README "Engine notes" before touching layout code — hard-won parity lessons live there.
- Launch blockers (manual, user): GitHub repo rename (remote=saifulapm/OpenEye-), npm publish, domain.

## Open Items
- Publish steps (user-manual, above).
- Fuzz generator is mined out at 200 cases — widening it is the next divergence-hunting lever.
