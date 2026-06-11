/**
 * Paint comparator: the engine's own render (paintSVG → resvg PNG) vs the
 * Chromium screenshot, per Tailwind corpus case. pixelmatch with per-pixel
 * threshold 0.1 (antialiasing-tolerant); the gate is the percentage of
 * mismatched pixels per case.
 *
 * Usage: bun run packages/oracle/src/paint-compare.ts
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import {
  computeLayout,
  FontStore,
  paintSVG,
  parseSource,
  resolveTree,
  resolveVisualTree,
} from '@layoutlint/core';
import { ORACLE_VIEWPORT_HEIGHT } from './golden';
import { FONTS_DIR, VENDOR_EMOJI } from './html';
import { paintCases, SCREENSHOT_DIR } from './screenshot';

/**
 * Max % of mismatched pixels per case (rationale in paint-accuracy/README).
 * Baselines: macOS worst 3.23%, Linux CI worst 5.71% — both pure glyph-edge
 * antialiasing (resvg vs Skia) on text-dense small canvases, verified by
 * inspecting the diff images. Real paint defects (missing fill, shifted
 * text block) measure far above this.
 */
const PAINT_THRESHOLD_PCT = 7;

/** Documented exclusions: name → reason (printed, never silent). */
const SKIP_PAINT: Record<string, string> = {};

const PAINT_ACCURACY_DIR = join(import.meta.dir, '../../../paint-accuracy');

const fonts = new FontStore([
  { family: 'AE Sans', path: join(FONTS_DIR, 'Inter-Regular.ttf'), weight: 400 },
  { family: 'AE Sans', path: join(FONTS_DIR, 'Inter-Medium.ttf'), weight: 500 },
  { family: 'AE Sans', path: join(FONTS_DIR, 'Inter-SemiBold.ttf'), weight: 600 },
  { family: 'AE Sans', path: join(FONTS_DIR, 'Inter-Bold.ttf'), weight: 700 },
  { family: 'AE Bengali', path: join(FONTS_DIR, 'NotoSansBengali-Regular.ttf'), weight: 400 },
  { family: 'AE Emoji', path: VENDOR_EMOJI, weight: 400 },
]);

interface CaseResult {
  name: string;
  viewport: number;
  width: number;
  height: number;
  diffPct: number;
  pass: boolean;
  skipped?: string;
}

const round = (n: number) => Math.round(n * 100) / 100;
const results: CaseResult[] = [];
mkdirSync(join(PAINT_ACCURACY_DIR, 'diff'), { recursive: true });

for (const c of paintCases) {
  if (SKIP_PAINT[c.name]) {
    results.push({ name: c.name, viewport: c.viewport, width: 0, height: 0, diffPct: 0, pass: true, skipped: SKIP_PAINT[c.name] });
    continue;
  }
  const chrome = PNG.sync.read(readFileSync(join(SCREENSHOT_DIR, `${c.name}.png`)));

  const raw = parseSource(c.html);
  const { tree } = resolveTree(raw, { viewport: c.viewport, viewportHeight: ORACLE_VIEWPORT_HEIGHT });
  const boxes = computeLayout(tree, c.viewport, fonts);
  const visuals = resolveVisualTree(raw, { viewport: c.viewport });
  const svg = paintSVG(tree, boxes, visuals, fonts, { width: c.viewport, height: chrome.height });
  const engine = PNG.sync.read(
    Buffer.from(new Resvg(svg, { fitTo: { mode: 'width', value: c.viewport } }).render().asPng()),
  );

  // identical canvas sizes by construction (engine height pinned to the
  // screenshot's; geometry gate already guarantees root height within 1px)
  const { width, height } = chrome;
  const diff = new PNG({ width, height });
  const mismatched = pixelmatch(engine.data, chrome.data, diff.data, width, height, {
    threshold: 0.1,
  });
  const diffPct = (mismatched / (width * height)) * 100;
  const pass = diffPct <= PAINT_THRESHOLD_PCT;
  if (!pass) {
    writeFileSync(join(PAINT_ACCURACY_DIR, 'diff', `${c.name}.png`), PNG.sync.write(diff));
    writeFileSync(join(PAINT_ACCURACY_DIR, 'diff', `${c.name}.engine.png`), PNG.sync.write(engine));
  }
  results.push({ name: c.name, viewport: c.viewport, width, height, diffPct: round(diffPct), pass });
}

results.sort((a, b) => b.diffPct - a.diffPct);
const failed = results.filter((r) => !r.pass);
const skipped = results.filter((r) => r.skipped);

const pad = (s: string | number, n: number) => String(s).padEnd(n);
const lines = [
  `# Paint accuracy — engine render vs Chromium screenshot`,
  ``,
  `Gate: ≤${PAINT_THRESHOLD_PCT}% mismatched pixels (pixelmatch threshold 0.1, antialiasing-tolerant).`,
  `The residual is rasterizer antialiasing (resvg vs Skia) on glyph edges.`,
  ``,
  `| case | viewport | size | diff % | result |`,
  `|---|---|---|---|---|`,
  ...results.map((r) =>
    `| ${r.name} | ${r.viewport} | ${r.width}×${r.height} | ${r.skipped ? '—' : r.diffPct} | ${r.skipped ? `SKIP (${r.skipped})` : r.pass ? 'PASS' : '**FAIL**'} |`,
  ),
];
writeFileSync(join(PAINT_ACCURACY_DIR, 'README.md'), lines.join('\n') + '\n');
writeFileSync(
  join(PAINT_ACCURACY_DIR, 'report.json'),
  JSON.stringify({ thresholdPct: PAINT_THRESHOLD_PCT, results }, null, 2) + '\n',
);

console.log(pad('case', 36) + pad('view', 6) + pad('diff%', 8) + 'result');
for (const r of results) {
  console.log(
    pad(r.name, 36) + pad(r.viewport, 6) + pad(r.skipped ? '—' : r.diffPct, 8) +
    (r.skipped ? `SKIP (${r.skipped})` : r.pass ? 'PASS' : 'FAIL'),
  );
}
for (const s of skipped) console.log(`note: ${s.name} skipped — ${s.skipped}`);
console.log(`\n${results.length - failed.length}/${results.length} cases ≤ ${PAINT_THRESHOLD_PCT}% diff`);
if (failed.length > 0) process.exit(1);
