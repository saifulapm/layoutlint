/** Print one case's tree and engine-vs-golden boxes. Usage: bun run debug-case.ts <name> */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { computeLayout, FontStore, parseSource, resolveTree, type TreeNode } from '@agent-eyes/core';
import { cases } from '../../../corpora/cases';
import { generatedCases } from '../../../corpora/generated';
import { tailwindCases } from '../../../corpora/tailwind-cases';
import { GOLDEN_DIR, ORACLE_VIEWPORT_HEIGHT, type GoldenFile } from './golden';
import { FONTS_DIR } from './html';

const SYSTEM_EMOJI = '/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf';
const fonts = new FontStore([
  { family: 'AE Sans', path: join(FONTS_DIR, 'Inter-Regular.ttf'), weight: 400 },
  { family: 'AE Sans', path: join(FONTS_DIR, 'Inter-Medium.ttf'), weight: 500 },
  { family: 'AE Sans', path: join(FONTS_DIR, 'Inter-SemiBold.ttf'), weight: 600 },
  { family: 'AE Sans', path: join(FONTS_DIR, 'Inter-Bold.ttf'), weight: 700 },
  { family: 'AE Bengali', path: join(FONTS_DIR, 'NotoSansBengali-Regular.ttf'), weight: 400 },
  ...(existsSync(SYSTEM_EMOJI) ? [{ family: 'Noto Color Emoji', path: SYSTEM_EMOJI, weight: 400 }] : []),
]);

const name = process.argv[2];
const all: { name: string; viewport: number; tree: TreeNode }[] = [
  ...cases,
  ...generatedCases,
  ...tailwindCases.map((c) => ({
    name: c.name,
    viewport: c.viewport,
    tree: resolveTree(parseSource(c.html), { viewport: c.viewport, viewportHeight: ORACLE_VIEWPORT_HEIGHT }).tree,
  })),
];
const c = all.find((x) => x.name === name);
if (!c) {
  console.error(`no case named ${name}`);
  process.exit(1);
}

const golden: GoldenFile = JSON.parse(readFileSync(join(GOLDEN_DIR, `${c.name}.json`), 'utf8'));
const boxes = computeLayout(c.tree, c.viewport, fonts);
const byPath = new Map(boxes.map((b) => [b.path, b]));

console.log(`${c.name} @ ${c.viewport}px\n`);
const fmtBox = (b: { x: number; y: number; width: number; height: number }) =>
  `${b.x.toFixed(1)},${b.y.toFixed(1)} ${b.width.toFixed(1)}×${b.height.toFixed(1)}`;

const walk = (n: TreeNode, path: string, indent: string) => {
  const b = byPath.get(path)!;
  const g = golden.rects[path];
  const bad =
    Math.abs(b.x - g.x) > 1 || Math.abs(b.y - g.y) > 1 || Math.abs(b.width - g.width) > (n.text ? 2 : 1) || Math.abs(b.height - g.height) > (n.text ? 2 : 1);
  const style = JSON.stringify(n.style ?? {});
  const text = n.text !== undefined ? ` "${n.text.slice(0, 40)}${n.text.length > 40 ? '…' : ''}"` : '';
  console.log(`${indent}${bad ? '✗' : ' '} ${path} ${style}${text}`);
  console.log(`${indent}    engine ${fmtBox(b)}   chrome ${fmtBox(g)}`);
  (n.children ?? []).forEach((ch, i) => walk(ch, `${path}.${i}`, indent + '  '));
};
walk(c.tree, 'r', '');
