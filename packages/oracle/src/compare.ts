/**
 * Accuracy comparator: engine boxes vs Chromium golden rects, per-node px
 * deltas, pass/fail per the Phase 0 thresholds.
 *
 * Thresholds: positions ≤1px; sizes ≤1px, except text-node sizes ≤2px
 * (shaping differences are tolerated, line-count differences are not).
 *
 * Usage: bun run packages/oracle/src/compare.ts
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { computeLayout, FontStore, parseSource, resolveTree, type Box, type TreeNode } from '@layoutlint/core';
import { cases } from '../../../corpora/cases';
import { generatedCases } from '../../../corpora/generated';
import { tailwindCases } from '../../../corpora/tailwind-cases';
import { ACCURACY_DIR, GOLDEN_DIR, ORACLE_VIEWPORT_HEIGHT, type GoldenFile } from './golden';
import { FONTS_DIR, VENDOR_EMOJI } from './html';

const POS_THRESHOLD = 1;
const SIZE_THRESHOLD = 1;
const TEXT_SIZE_THRESHOLD = 2;

const fonts = new FontStore([
  { family: 'AE Sans', path: join(FONTS_DIR, 'Inter-Regular.ttf'), weight: 400 },
  { family: 'AE Sans', path: join(FONTS_DIR, 'Inter-Medium.ttf'), weight: 500 },
  { family: 'AE Sans', path: join(FONTS_DIR, 'Inter-SemiBold.ttf'), weight: 600 },
  { family: 'AE Sans', path: join(FONTS_DIR, 'Inter-Bold.ttf'), weight: 700 },
  { family: 'AE Bengali', path: join(FONTS_DIR, 'NotoSansBengali-Regular.ttf'), weight: 400 },
  { family: 'AE Emoji', path: VENDOR_EMOJI, weight: 400 },
]);

interface NodeResult {
  path: string;
  name?: string;
  isText: boolean;
  dx: number;
  dy: number;
  dw: number;
  dh: number;
  pass: boolean;
}

interface CaseResult {
  name: string;
  viewport: number;
  nodes: NodeResult[];
  pass: boolean;
  maxPosDelta: number;
  maxSizeDelta: number;
  worst?: NodeResult;
}

const round = (n: number) => Math.round(n * 100) / 100;
const results: CaseResult[] = [];

const allCases: { name: string; viewport: number; tree: TreeNode }[] = [
  ...cases,
  ...generatedCases,
  ...tailwindCases.map((c) => ({
    name: c.name,
    viewport: c.viewport,
    tree: resolveTree(parseSource(c.html), { viewport: c.viewport, viewportHeight: ORACLE_VIEWPORT_HEIGHT }).tree,
  })),
];

for (const c of allCases) {
  const goldenPath = join(GOLDEN_DIR, `${c.name}.json`);
  if (!existsSync(goldenPath)) {
    console.error(`missing golden file for ${c.name} — run \`bun run oracle\` first`);
    process.exit(1);
  }
  const golden: GoldenFile = JSON.parse(readFileSync(goldenPath, 'utf8'));
  const boxes: Box[] = computeLayout(c.tree, c.viewport, fonts);

  const nodes: NodeResult[] = boxes.map((b) => {
    const g = golden.rects[b.path];
    if (!g) throw new Error(`${c.name}: node ${b.path} missing from golden file`);
    const dx = round(Math.abs(b.x - g.x));
    const dy = round(Math.abs(b.y - g.y));
    const dw = round(Math.abs(b.width - g.width));
    const dh = round(Math.abs(b.height - g.height));
    const sizeThreshold = b.isText ? TEXT_SIZE_THRESHOLD : SIZE_THRESHOLD;
    const pass =
      dx <= POS_THRESHOLD && dy <= POS_THRESHOLD && dw <= sizeThreshold && dh <= sizeThreshold;
    return { path: b.path, name: b.name, isText: b.isText, dx, dy, dw, dh, pass };
  });

  const maxDelta = (n: NodeResult) => Math.max(n.dx, n.dy, n.dw, n.dh);
  const worst = nodes.reduce((a, b) => (maxDelta(b) > maxDelta(a) ? b : a));
  results.push({
    name: c.name,
    viewport: c.viewport,
    nodes,
    pass: nodes.every((n) => n.pass),
    maxPosDelta: round(Math.max(...nodes.map((n) => Math.max(n.dx, n.dy)))),
    maxSizeDelta: round(Math.max(...nodes.map((n) => Math.max(n.dw, n.dh)))),
    worst: maxDelta(worst) > 0 ? worst : undefined,
  });
}

// ---- report ----------------------------------------------------------------

const passCount = results.filter((r) => r.pass).length;
const header = ['case', 'vw', 'nodes', 'max Δpos', 'max Δsize', 'worst node', 'result'];
const rows = results.map((r) => [
  r.name,
  String(r.viewport),
  String(r.nodes.length),
  r.maxPosDelta.toFixed(2),
  r.maxSizeDelta.toFixed(2),
  r.worst ? `${r.worst.name ?? r.worst.path} (Δw ${r.worst.dw}, Δh ${r.worst.dh})` : '—',
  r.pass ? 'PASS' : 'FAIL',
]);

const widths = header.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)));
const fmt = (cells: string[]) => cells.map((c, i) => c.padEnd(widths[i])).join('  ');
console.log(fmt(header));
console.log(widths.map((w) => '-'.repeat(w)).join('  '));
for (const row of rows) console.log(fmt(row));
console.log(`\n${passCount}/${results.length} cases within threshold`);

for (const r of results.filter((x) => !x.pass)) {
  console.log(`\n${r.name} failing nodes:`);
  for (const n of r.nodes.filter((x) => !x.pass)) {
    console.log(
      `  ${n.name ?? n.path}${n.isText ? ' [text]' : ''}: Δx ${n.dx} Δy ${n.dy} Δw ${n.dw} Δh ${n.dh}`,
    );
  }
}

mkdirSync(ACCURACY_DIR, { recursive: true });
writeFileSync(
  join(ACCURACY_DIR, 'report.json'),
  JSON.stringify({ generatedAt: new Date().toISOString(), passCount, total: results.length, results }, null, 2) + '\n',
);

const md = [
  '# Accuracy scoreboard',
  '',
  `Engine (Yoga + fontkit) vs headless Chromium golden files. **${passCount}/${results.length}** cases within threshold (positions ≤${POS_THRESHOLD}px, sizes ≤${SIZE_THRESHOLD}px, text sizes ≤${TEXT_SIZE_THRESHOLD}px).`,
  '',
  `| ${header.join(' | ')} |`,
  `| ${header.map(() => '---').join(' | ')} |`,
  ...rows.map((r) => `| ${r.join(' | ')} |`),
  '',
].join('\n');
writeFileSync(join(ACCURACY_DIR, 'README.md'), md);

process.exit(passCount === results.length ? 0 : 1);
