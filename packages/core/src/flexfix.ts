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
  // undefined = web default = row (the engine runs Yoga with web defaults)
  const isRow = s.flexDirection !== 'column' && s.flexDirection !== 'column-reverse';
  // a wrap row can break between items: its min-content is its largest item
  const sums = isRow && !(mode === 'min' && (s.flexWrap === 'wrap' || s.flexWrap === 'wrap-reverse'));
  let content = 0;
  if (sums) {
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
  /** horizontal padding+border — the spec weights shrink by the *inner* base */
  padBorder: number;
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
        const inner = (i: number) => Math.max(0, items[i].base - items[i].padBorder);
        const scaledSum = unfrozenIdx.reduce((a, i) => a + items[i].shrink * inner(i), 0);
        for (const i of unfrozenIdx) {
          const ratio = scaledSum > 0 ? (items[i].shrink * inner(i)) / scaledSum : 0;
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

/**
 * CSS fit-content width for a non-stretched auto-width child in column flow:
 * clamp(min-content, available, max-content). Yoga neither clamps an
 * overflowing fit-content child to the available width (wrappable content)
 * nor lets unbreakable content keep its min-content width past it. Returns
 * the target width, or null when fit-content sizing doesn't apply.
 */
export function fitContentWidth(
  parent: TreeNode,
  child: TreeNode,
  parentContentWidth: number,
  fonts: FontStore,
): number | null {
  const ps = parent.style ?? {};
  const cs = child.style ?? {};
  const isColumn = ps.flexDirection === 'column' || ps.flexDirection === 'column-reverse';
  if (!isColumn) return null;
  if (cs.display === 'none' || cs.position === 'absolute') return null;
  if (cs.width !== undefined) return null;
  const align = cs.alignSelf && cs.alignSelf !== 'auto' ? cs.alignSelf : (ps.alignItems ?? 'stretch');
  if (align === 'stretch') return null;
  if (cs.marginLeft === 'auto' || cs.marginRight === 'auto') return null;

  const available = parentContentWidth - hMargins(cs);
  const target = Math.max(
    intrinsicWidth(child, fonts, 'min'),
    Math.min(available, intrinsicWidth(child, fonts, 'max')),
  );
  return clampWidth(cs, target);
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
 * Compute §9.7-correct child widths for a row container, given its
 * border-box width. Wrap containers get §9.3 line collection (greedy over
 * hypothetical outer sizes) and per-line resolution. Returns null when the
 * container is out of scope (column, auto margins) — Yoga's answer stands.
 */
export function correctRowContainer(
  container: TreeNode,
  containerWidth: number,
  fonts: FontStore,
): RowCorrection | null {
  const s = container.style ?? {};
  const isRow = s.flexDirection !== 'column' && s.flexDirection !== 'column-reverse';
  if (!isRow) return null;
  const wrap = (s.flexWrap ?? 'nowrap') !== 'nowrap';

  const all = container.children ?? [];
  const childIndices: number[] = [];
  all.forEach((c, i) => {
    const cs = c.style ?? {};
    if (cs.display !== 'none' && cs.position !== 'absolute') childIndices.push(i);
  });
  if (childIndices.length === 0) return null;

  const contentWidth = Math.max(0, containerWidth - hPadBorder(s));
  const gap = gapOf(s);

  interface Entry extends FlexItemInput {
    index: number;
    margins: number;
    explicitMinMax: boolean;
    contentBase: boolean;
  }
  const entries: Entry[] = [];

  for (const i of childIndices) {
    const c = all[i];
    const cs = c.style ?? {};
    // auto margins interact with free space before justification — out of scope
    if (cs.marginLeft === 'auto' || cs.marginRight === 'auto') return null;

    // flex base size: unclamped — min/max apply at the hypothetical step
    let base: number;
    let contentBase = false;
    const basis = cs.flexBasis;
    if (typeof basis === 'number') base = basis;
    else if (typeof basis === 'string' && basis !== 'auto') {
      base = (parseFloat(basis) / 100) * contentWidth;
    } else if (typeof cs.width === 'number') base = cs.width;
    else if (typeof cs.width === 'string') {
      base = (parseFloat(cs.width) / 100) * contentWidth;
    } else {
      base = intrinsicWidth(c, fonts, 'max', true);
      contentBase = true;
    }

    // automatic minimum size (§4.5): min(content size suggestion, specified
    // size suggestion), zero when the item is scrollable
    const scrollable = cs.overflow === 'hidden' || cs.overflow === 'auto' || cs.overflow === 'scroll';
    const contentSuggestion = intrinsicWidth(c, fonts, 'min', true);
    const specifiedSuggestion = typeof cs.width === 'number' ? cs.width : Infinity;
    const autoMin = scrollable ? 0 : Math.min(contentSuggestion, specifiedSuggestion);
    const min = typeof cs.minWidth === 'number' ? cs.minWidth : autoMin;
    const max = typeof cs.maxWidth === 'number' ? cs.maxWidth : Infinity;

    entries.push({
      index: i,
      base,
      padBorder: hPadBorder(cs),
      min,
      max,
      grow: cs.flexGrow ?? 0,
      shrink: cs.flexShrink ?? 1,
      margins: hMargins(cs),
      explicitMinMax: typeof cs.minWidth === 'number' || typeof cs.maxWidth === 'number',
      contentBase,
    });
  }

  // collect flex lines (§9.3): greedy over hypothetical outer sizes
  const lines: Entry[][] = [];
  if (!wrap) {
    lines.push(entries);
  } else {
    let line: Entry[] = [];
    let lineWidth = 0;
    for (const e of entries) {
      const outer = Math.min(Math.max(e.base, e.min), e.max) + e.margins;
      const withGap = lineWidth + (line.length > 0 ? gap : 0) + outer;
      if (line.length > 0 && withGap > contentWidth + 0.01) {
        lines.push(line);
        line = [e];
        lineWidth = outer;
      } else {
        line.push(e);
        lineWidth = withGap;
      }
    }
    if (line.length > 0) lines.push(line);
  }

  const children: RowCorrection['children'] = [];
  let conflict = false;
  for (const line of lines) {
    const available =
      contentWidth - gap * (line.length - 1) - line.reduce((a, e) => a + e.margins, 0);
    const sumHyp = line.reduce((a, e) => a + Math.min(Math.max(e.base, e.min), e.max), 0);
    const shrinking = sumHyp > available;
    const lineConflict =
      line.some((e) => e.explicitMinMax) || (shrinking && line.some((e) => e.contentBase));
    if (!lineConflict) continue;
    conflict = true;
    const sizes = resolveFlexibleLengths(line, available);
    line.forEach((e, k) => children.push({ child: all[e.index], index: e.index, width: sizes[k] }));
  }

  return { children, conflict };
}
