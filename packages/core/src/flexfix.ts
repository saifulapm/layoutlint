import type { FontStore } from './fonts';
import { measureText } from './text';
import type { Style, TreeNode } from './types';

/**
 * CSS Flexbox §9.7 "Resolving Flexible Lengths" — the iterative
 * freeze-and-redistribute algorithm Yoga does not implement (Yoga clamps
 * each item's base once and distributes in a single pass). Applied as a
 * corrective pass over single-line row containers, where the real-world
 * divergence lives: competing min/max constraints and text items whose flex
 * base is their max-content width.
 *
 * Intrinsic widths are computed with the standard recursive approximation
 * (text: longest line / longest word; rows: sum; columns: max). Column
 * main-axis conflicts and multi-line (wrap) containers are out of scope.
 */

const num = (v: number | `${number}%` | 'auto' | undefined): number =>
  typeof v === 'number' ? v : 0;

function hPadBorder(s: Style): number {
  return (
    num(s.paddingLeft ?? s.padding) +
    num(s.paddingRight ?? s.padding) +
    num(s.borderLeftWidth ?? s.borderWidth) +
    num(s.borderRightWidth ?? s.borderWidth)
  );
}

function hMargins(s: Style): number {
  return num(s.marginLeft ?? s.margin) + num(s.marginRight ?? s.margin);
}

function gapOf(s: Style): number {
  return s.columnGap ?? s.gap ?? 0;
}

function clampWidth(s: Style, w: number): number {
  let out = w;
  if (typeof s.maxWidth === 'number') out = Math.min(out, s.maxWidth);
  if (typeof s.minWidth === 'number') out = Math.max(out, s.minWidth);
  return out;
}

const flowChildren = (n: TreeNode): TreeNode[] =>
  (n.children ?? []).filter((c) => {
    const s = c.style ?? {};
    return s.display !== 'none' && s.position !== 'absolute';
  });

/**
 * Intrinsic (border-box) width approximation. `contentOnly` ignores the
 * node's own width and min/max — used for flex base sizes (clamps apply at
 * the hypothetical step, not the base) and for content size suggestions.
 */
function intrinsicWidth(
  n: TreeNode,
  fonts: FontStore,
  mode: 'min' | 'max',
  contentOnly = false,
): number {
  const s = n.style ?? {};
  if (!contentOnly && typeof s.width === 'number') return clampWidth(s, s.width);
  const clamp = (w: number) => (contentOnly ? w : clampWidth(s, w));
  const pb = hPadBorder(s);
  if (n.text !== undefined) {
    // min-content of text = longest unbreakable segment (wrap at width 0)
    const maxWidth = mode === 'max' || s.whiteSpace === 'nowrap' ? Infinity : 0;
    return clamp(measureText(fonts, n.text, s, maxWidth).width + pb);
  }
  const children = flowChildren(n);
  const isRow = s.flexDirection === 'row' || s.flexDirection === 'row-reverse';
  let content = 0;
  if (isRow) {
    content = children.reduce((acc, c) => acc + intrinsicWidth(c, fonts, mode) + hMargins(c.style ?? {}), 0);
    content += gapOf(s) * Math.max(0, children.length - 1);
  } else {
    for (const c of children) {
      content = Math.max(content, intrinsicWidth(c, fonts, mode) + hMargins(c.style ?? {}));
    }
  }
  return clamp(content + pb);
}

/** Max-content (border-box) width approximation. */
export const maxContentWidth = (n: TreeNode, fonts: FontStore): number =>
  intrinsicWidth(n, fonts, 'max');

/** Min-content (border-box) width approximation. */
export const minContentWidth = (n: TreeNode, fonts: FontStore): number =>
  intrinsicWidth(n, fonts, 'min');

export interface FlexItemInput {
  /** flex base size (border-box main size before flexing) */
  base: number;
  min: number;
  max: number;
  grow: number;
  shrink: number;
}

/** §9.7: returns resolved border-box main sizes. */
export function resolveFlexibleLengths(items: FlexItemInput[], available: number): number[] {
  const n = items.length;
  const hypothetical = items.map((it) => Math.min(Math.max(it.base, it.min), it.max));
  const sumHyp = hypothetical.reduce((a, b) => a + b, 0);
  const growing = sumHyp < available;

  const frozen = new Array<boolean>(n).fill(false);
  const size = [...hypothetical];

  // freeze inflexible items
  for (let i = 0; i < n; i++) {
    const it = items[i];
    const factor = growing ? it.grow : it.shrink;
    if (
      factor === 0 ||
      (growing && it.base > hypothetical[i]) ||
      (!growing && it.base < hypothetical[i])
    ) {
      frozen[i] = true;
    }
  }

  for (let guard = 0; guard < n + 1; guard++) {
    const unfrozenIdx = [...Array(n).keys()].filter((i) => !frozen[i]);
    if (unfrozenIdx.length === 0) break;

    // remaining free space (frozen at size, unfrozen at base)
    let free = available;
    for (let i = 0; i < n; i++) free -= frozen[i] ? size[i] : items[i].base;

    // spec: if sum of flex factors < 1, scale free space down
    const factorSum = unfrozenIdx.reduce((a, i) => a + (growing ? items[i].grow : items[i].shrink), 0);
    if (factorSum < 1) free *= factorSum;

    // distribute
    if (free !== 0 && factorSum > 0) {
      if (growing) {
        for (const i of unfrozenIdx) {
          size[i] = items[i].base + (free * items[i].grow) / factorSum;
        }
      } else {
        const scaledSum = unfrozenIdx.reduce((a, i) => a + items[i].shrink * items[i].base, 0);
        for (const i of unfrozenIdx) {
          const ratio = scaledSum > 0 ? (items[i].shrink * items[i].base) / scaledSum : 0;
          size[i] = items[i].base - Math.abs(free) * ratio;
        }
      }
    } else {
      for (const i of unfrozenIdx) size[i] = items[i].base;
    }

    // clamp violations, freeze accordingly
    let totalViolation = 0;
    const violation = new Array<number>(n).fill(0);
    for (const i of unfrozenIdx) {
      const clamped = Math.min(Math.max(size[i], items[i].min), items[i].max);
      violation[i] = clamped - size[i];
      totalViolation += violation[i];
      size[i] = clamped;
    }
    if (totalViolation === 0) {
      for (const i of unfrozenIdx) frozen[i] = true;
    } else if (totalViolation > 0) {
      for (const i of unfrozenIdx) if (violation[i] > 0) frozen[i] = true;
    } else {
      for (const i of unfrozenIdx) if (violation[i] < 0) frozen[i] = true;
    }
  }

  return size;
}

export interface RowCorrection {
  /** §9.7-resolved border-box widths, parallel to in-flow children. */
  children: { child: TreeNode; index: number; width: number }[];
  /**
   * True when this container hits a case Yoga resolves differently:
   * explicit min/max constraints on a child, or overflow-shrink with
   * content-based (max-content) flex bases. Callers should only apply
   * corrections for conflicted containers.
   */
  conflict: boolean;
}

/**
 * Compute §9.7-correct child widths for a single-line row container, given
 * its border-box width. Returns null when the container is out of scope
 * (column, wrap, auto margins on the axis) — Yoga's answer stands.
 */
export function correctRowContainer(
  container: TreeNode,
  containerWidth: number,
  fonts: FontStore,
): RowCorrection | null {
  const s = container.style ?? {};
  const isRow = s.flexDirection === 'row' || s.flexDirection === 'row-reverse';
  if (!isRow || (s.flexWrap ?? 'nowrap') !== 'nowrap') return null;

  const all = container.children ?? [];
  const childIndices: number[] = [];
  all.forEach((c, i) => {
    const cs = c.style ?? {};
    if (cs.display !== 'none' && cs.position !== 'absolute') childIndices.push(i);
  });
  if (childIndices.length === 0) return null;

  let available = containerWidth - hPadBorder(s) - gapOf(s) * (childIndices.length - 1);
  const items: FlexItemInput[] = [];
  let hasExplicitMinMax = false;
  let hasContentBase = false;

  for (const i of childIndices) {
    const c = all[i];
    const cs = c.style ?? {};
    // auto margins interact with free space before justification — out of scope
    if (cs.marginLeft === 'auto' || cs.marginRight === 'auto') return null;
    available -= hMargins(cs);

    // flex base size: unclamped — min/max apply at the hypothetical step
    let base: number;
    const basis = cs.flexBasis;
    if (typeof basis === 'number') base = basis;
    else if (typeof basis === 'string' && basis !== 'auto') {
      base = (parseFloat(basis) / 100) * Math.max(0, containerWidth - hPadBorder(s));
    } else if (typeof cs.width === 'number') base = cs.width;
    else if (typeof cs.width === 'string') {
      base = (parseFloat(cs.width) / 100) * Math.max(0, containerWidth - hPadBorder(s));
    } else {
      base = intrinsicWidth(c, fonts, 'max', true);
      hasContentBase = true;
    }

    // automatic minimum size (§4.5): min(content size suggestion, specified
    // size suggestion), zero when the item is scrollable
    const scrollable = cs.overflow === 'hidden' || cs.overflow === 'auto' || cs.overflow === 'scroll';
    const contentSuggestion = intrinsicWidth(c, fonts, 'min', true);
    const specifiedSuggestion = typeof cs.width === 'number' ? cs.width : Infinity;
    const autoMin = scrollable ? 0 : Math.min(contentSuggestion, specifiedSuggestion);
    const min = typeof cs.minWidth === 'number' ? cs.minWidth : autoMin;
    const max = typeof cs.maxWidth === 'number' ? cs.maxWidth : Infinity;
    if (typeof cs.minWidth === 'number' || typeof cs.maxWidth === 'number') hasExplicitMinMax = true;

    items.push({
      base,
      min,
      max,
      grow: cs.flexGrow ?? 0,
      shrink: cs.flexShrink ?? 1,
    });
  }

  const sumHyp = items.reduce((a, it) => a + Math.min(Math.max(it.base, it.min), it.max), 0);
  const shrinking = sumHyp > available;
  const conflict = hasExplicitMinMax || (shrinking && hasContentBase);

  const sizes = resolveFlexibleLengths(items, available);
  return {
    children: childIndices.map((index, k) => ({ child: all[index], index, width: sizes[k] })),
    conflict,
  };
}
