import type { CorpusCase, Style, TreeNode } from '@layoutlint/core';

/**
 * Seeded fuzz corpus: deterministic pseudo-random flex trees within the
 * engine's supported envelope. Each case derives entirely from its seed, so
 * nothing but this file defines them; golden files are committed like any
 * other case. Fuzzing is the strongest accuracy tool we have — every
 * generator widening is a cheap way to hunt new divergences.
 */

// mulberry32 — tiny deterministic PRNG
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const WORDS =
  `layout engine viewport flexbox deterministic oracle corpus accuracy threshold golden chromium measure
   wrap overflow shrink grow basis padding margin gap border container sibling violation diagnostic agent
   verify pixel delta render font glyph advance kerning segment break line height width baseline grid`.split(/\s+/);

const BANGLA_WORDS = 'বাংলা ভাষা সফটওয়্যার প্রকৌশলী ঢাকা প্রযুক্তি যাচাই টুল'.split(/\s+/);

const VIEWPORTS = [320, 375, 768, 1440];
const FONT_SIZES: [number, number][] = [[12, 16], [14, 20], [16, 24], [18, 28], [20, 28], [24, 32]];
const WEIGHTS = [400, 500, 600, 700];

interface Ctx {
  r: () => number;
  /** row ancestry depth — used to keep trees sane */
  depth: number;
}

const pick = <T>(r: () => number, arr: T[]): T => arr[Math.floor(r() * arr.length)];
const chance = (r: () => number, p: number): boolean => r() < p;
const int = (r: () => number, min: number, max: number): number =>
  min + Math.floor(r() * (max - min + 1));

function sentence(r: () => number, minWords: number, maxWords: number): string {
  const n = int(r, minWords, maxWords);
  const bank = chance(r, 0.12) ? BANGLA_WORDS : WORDS;
  return Array.from({ length: n }, () => pick(r, bank)).join(' ');
}

function textLeaf(ctx: Ctx): TreeNode {
  const { r } = ctx;
  const [fontSize, lineHeight] = pick(r, FONT_SIZES);
  const style: Style = { fontSize, lineHeight };
  if (chance(r, 0.4)) style.fontWeight = pick(r, WEIGHTS);
  if (chance(r, 0.15)) style.letterSpacing = pick(r, [-0.5, 0.25, 0.5, 1]);
  if (chance(r, 0.12)) {
    style.whiteSpace = 'nowrap';
    style.overflow = 'hidden';
  }
  if (chance(r, 0.2)) style.padding = int(r, 2, 12);
  if (chance(r, 0.25)) style.flexGrow = 1;
  return { style, text: sentence(r, 2, 14) };
}

function boxLeaf(ctx: Ctx): TreeNode {
  const { r } = ctx;
  const style: Style = {};
  if (chance(r, 0.75)) style.width = int(r, 16, 280);
  style.height = int(r, 8, 120);
  if (style.width === undefined || chance(r, 0.25)) style.flexGrow = pick(r, [1, 1, 2]);
  if (chance(r, 0.2)) style.flexShrink = 0;
  if (chance(r, 0.18) && typeof style.width === 'number') {
    if (chance(r, 0.5)) style.minWidth = Math.round(style.width * 0.7);
    else style.maxWidth = Math.round(style.width * 1.4);
  } else if (chance(r, 0.1)) {
    style.minWidth = int(r, 40, 200);
  }
  if (chance(r, 0.12)) style.margin = int(r, -8, 12);
  return { style };
}

function container(ctx: Ctx, allowWrap: boolean): TreeNode {
  const { r } = ctx;
  const isRow = chance(r, 0.55);
  const style: Style = { flexDirection: isRow ? 'row' : 'column' };
  if (chance(r, 0.7)) style.gap = pick(r, [4, 8, 12, 16, 24]);
  if (chance(r, 0.6)) style.padding = pick(r, [4, 8, 12, 16, 24]);
  // fit-content sizing of wrap containers (wrap rows inside rows or
  // non-stretch columns) is out of the v0 envelope — only generate wrap
  // where the container is stretched to a definite width, like real UI
  if (allowWrap && isRow && chance(r, 0.25)) style.flexWrap = 'wrap';
  if (chance(r, 0.4)) {
    style.justifyContent = pick(r, [
      'flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly',
    ]);
  }
  if (chance(r, 0.4)) {
    style.alignItems = pick(r, ['stretch', 'flex-start', 'flex-end', 'center']);
  }
  if (chance(r, 0.2)) style.flexGrow = 1;
  if (isRow && chance(r, 0.15)) style.minWidth = 0;

  const childCount = int(r, 2, 4);
  const children: TreeNode[] = [];
  const childStretched =
    !isRow && (style.alignItems === undefined || style.alignItems === 'stretch');
  for (let i = 0; i < childCount; i++) {
    const roll = r();
    if (ctx.depth < 3 && roll < 0.3) {
      children.push(container({ r, depth: ctx.depth + 1 }, childStretched));
    } else if (roll < 0.62) {
      children.push(boxLeaf(ctx));
    } else {
      children.push(textLeaf(ctx));
    }
  }

  // occasional absolutely-positioned badge
  if (chance(r, 0.12)) {
    style.position = 'relative';
    children.push({
      style: {
        position: 'absolute',
        top: int(r, 0, 12),
        right: int(r, 0, 12),
        width: int(r, 16, 48),
        height: int(r, 16, 48),
      },
    });
  }

  return { style, children };
}

export function generateCase(seed: number): CorpusCase {
  const r = rng(seed * 2654435761);
  const viewport = pick(r, VIEWPORTS);
  const root = container({ r, depth: 0 }, true);
  // roots are full-width columns most of the time, like real pages
  if (chance(r, 0.7)) {
    root.style!.flexDirection = 'column';
    delete root.style!.flexWrap; // column wrap is out of the v0 envelope
  }
  delete root.style!.flexGrow;
  return { name: `gen-${String(seed).padStart(3, '0')}`, viewport, tree: root };
}

export const GENERATED_COUNT = 200;

export const generatedCases: CorpusCase[] = Array.from({ length: GENERATED_COUNT }, (_, i) =>
  generateCase(i + 1),
);
