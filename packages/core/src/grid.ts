/**
 * Taffy-backed CSS Grid islands.
 *
 * A `display:grid` subtree is laid out by Taffy (the only engine here with a
 * real grid algorithm) while everything around and inside it stays Yoga:
 * each grid item is measured/laid out by recursing into the regular engine
 * (`layoutSubtree`, injected to avoid a runtime import cycle). Spike-verified
 * binding facts live in test/taffy-spike.test.ts — notably: percentages are
 * raw FRACTIONS ('0.25%' = CSS 25%), rounding must be disabled, and
 * getLayout returns item border-box rects.
 */
import { readFileSync } from 'node:fs';
import {
  AlignContent,
  AlignItems,
  AlignSelf,
  Display,
  GridAutoFlow,
  initSync,
  JustifyContent,
  Style as TaffyStyle,
  TaffyTree,
  type GridPlacement as TaffyGridPlacement,
  type MeasureFunction,
  type TrackSizingFunction,
} from 'taffy-layout';
import type { FontStore } from './fonts';
import type { SubtreeResult } from './layout';
import { measureText } from './text';
import type { Box, GridPlacement, GridTrack, Style, TreeNode } from './types';

// Lazy, synchronous WASM init on the first grid encounter — flex-only checks
// never pay the ~500KB Taffy compile. (loadTaffy() is async; computeLayout is
// sync, so read + initSync the module ourselves.)
let taffyReady = false;
function ensureTaffy(): void {
  if (taffyReady) return;
  const js = import.meta.resolve('taffy-layout/wasm');
  initSync({ module: readFileSync(new URL('./taffy_wasm_bg.wasm', js)) });
  taffyReady = true;
}

/** Injected to break the layout.ts ↔ grid.ts runtime cycle (type-only above). */
export type SubtreeLayoutFn = (
  tree: TreeNode,
  availableWidth: number | undefined,
  fonts: FontStore,
) => SubtreeResult;

const num = (v: number | `${number}%` | 'auto' | undefined): number =>
  typeof v === 'number' ? v : 0;

const hPadBorder = (s: Style): number =>
  num(s.paddingLeft ?? s.padding) +
  num(s.paddingRight ?? s.padding) +
  num(s.borderLeftWidth ?? s.borderWidth) +
  num(s.borderRightWidth ?? s.borderWidth);

// ---- Style → Taffy conversion ----------------------------------------------

/** Taffy percentages are fractions of 1, not of 100 (spike finding #1). */
const frac = (v: number | `${number}%`): number | `${number}%` =>
  typeof v === 'string' ? (`${parseFloat(v) / 100}%` as `${number}%`) : v;

const fracOrAuto = (
  v: number | `${number}%` | 'auto' | undefined,
): number | `${number}%` | 'auto' => (v === undefined || v === 'auto' ? 'auto' : frac(v));

type TrackMin = TrackSizingFunction['min'];
type TrackMax = TrackSizingFunction['max'];

const toTrackMin = (v: GridTrack & {}): TrackMin =>
  typeof v === 'number' ? v : v === 'auto' || v === 'min-content' || v === 'max-content' ? v : (frac(v as `${number}%`) as TrackMin);

function toTrack(t: GridTrack): TrackSizingFunction {
  if (typeof t === 'number') return { min: t, max: t };
  if (typeof t === 'string') {
    if (t === 'auto' || t === 'min-content' || t === 'max-content') return { min: t, max: t };
    if (t.endsWith('fr')) return { min: 'auto', max: t as TrackMax }; // 1fr ≡ minmax(auto,1fr)
    const f = frac(t as `${number}%`);
    return { min: f as TrackMin, max: f as TrackMax };
  }
  const min: TrackMin =
    typeof t.min === 'number' || t.min === 'auto' || t.min === 'min-content' || t.min === 'max-content'
      ? t.min
      : (frac(t.min) as TrackMin);
  const max: TrackMax =
    typeof t.max === 'number' || t.max === 'auto' || t.max === 'min-content' || t.max === 'max-content'
      ? t.max
      : t.max.endsWith('fr')
        ? (t.max as TrackMax)
        : (frac(t.max as `${number}%`) as TrackMax);
  return { min, max };
}

const ALIGN_ITEMS: Record<NonNullable<Style['alignItems']>, AlignItems> = {
  stretch: AlignItems.Stretch,
  'flex-start': AlignItems.FlexStart,
  'flex-end': AlignItems.FlexEnd,
  center: AlignItems.Center,
};

const JUSTIFY_ITEMS: Record<NonNullable<Style['justifyItems']>, AlignItems> = {
  start: AlignItems.Start,
  end: AlignItems.End,
  center: AlignItems.Center,
  stretch: AlignItems.Stretch,
};

const ALIGN_SELF: Record<Exclude<NonNullable<Style['alignSelf']>, 'auto'>, AlignSelf> = {
  stretch: AlignSelf.Stretch,
  'flex-start': AlignSelf.FlexStart,
  'flex-end': AlignSelf.FlexEnd,
  center: AlignSelf.Center,
};

const JUSTIFY_SELF: Record<Exclude<NonNullable<Style['justifySelf']>, 'auto'>, AlignSelf> = {
  start: AlignSelf.Start,
  end: AlignSelf.End,
  center: AlignSelf.Center,
  stretch: AlignSelf.Stretch,
};

const JUSTIFY_CONTENT: Record<NonNullable<Style['justifyContent']>, JustifyContent> = {
  'flex-start': JustifyContent.FlexStart,
  'flex-end': JustifyContent.FlexEnd,
  center: JustifyContent.Center,
  'space-between': JustifyContent.SpaceBetween,
  'space-around': JustifyContent.SpaceAround,
  'space-evenly': JustifyContent.SpaceEvenly,
};

const ALIGN_CONTENT: Record<NonNullable<Style['alignContent']>, AlignContent> = {
  stretch: AlignContent.Stretch,
  'flex-start': AlignContent.FlexStart,
  'flex-end': AlignContent.FlexEnd,
  center: AlignContent.Center,
  'space-between': AlignContent.SpaceBetween,
  'space-around': AlignContent.SpaceAround,
};

const AUTO_FLOW: Record<NonNullable<Style['gridAutoFlow']>, GridAutoFlow> = {
  row: GridAutoFlow.Row,
  column: GridAutoFlow.Column,
  'row dense': GridAutoFlow.RowDense,
  'column dense': GridAutoFlow.ColumnDense,
};

const toPlacement = (p: GridPlacement | undefined): { start: TaffyGridPlacement; end: TaffyGridPlacement } => {
  if (!p) return { start: 'auto', end: 'auto' };
  let start: TaffyGridPlacement = p.start ?? 'auto';
  let end: TaffyGridPlacement = p.end ?? 'auto';
  if (p.span !== undefined) {
    // span attaches to whichever side has no explicit line (CSS shorthand)
    if (p.start === undefined && p.end !== undefined) start = { span: p.span };
    else end = { span: p.span };
    if (p.start === undefined && p.end === undefined) start = 'auto';
  }
  return { start, end };
};

/** Container style — content box only; Yoga owns size/padding/border/margin. */
function toContainerStyle(s: Style): InstanceType<typeof TaffyStyle> {
  const t = new TaffyStyle();
  t.display = Display.Grid;
  if (s.gridTemplateColumns) t.gridTemplateColumns = s.gridTemplateColumns.map(toTrack);
  if (s.gridTemplateRows) t.gridTemplateRows = s.gridTemplateRows.map(toTrack);
  if (s.gridAutoColumns) t.gridAutoColumns = [toTrack(s.gridAutoColumns)];
  if (s.gridAutoRows) t.gridAutoRows = [toTrack(s.gridAutoRows)];
  if (s.gridAutoFlow) t.gridAutoFlow = AUTO_FLOW[s.gridAutoFlow];
  t.gap = { width: frac(s.columnGap ?? s.gap ?? 0), height: frac(s.rowGap ?? s.gap ?? 0) };
  if (s.alignItems) t.alignItems = ALIGN_ITEMS[s.alignItems];
  if (s.justifyItems) t.justifyItems = JUSTIFY_ITEMS[s.justifyItems];
  if (s.alignContent) t.alignContent = ALIGN_CONTENT[s.alignContent];
  if (s.justifyContent) t.justifyContent = JUSTIFY_CONTENT[s.justifyContent];
  return t;
}

/** Item style — placement, explicit sizing and margins; interior is measured. */
function toItemStyle(s: Style): InstanceType<typeof TaffyStyle> {
  const t = new TaffyStyle();
  const col = toPlacement(s.gridColumn);
  const row = toPlacement(s.gridRow);
  t.gridColumn = col;
  t.gridRow = row;
  t.size = { width: fracOrAuto(s.width), height: fracOrAuto(s.height) };
  t.minSize = { width: fracOrAuto(s.minWidth), height: fracOrAuto(s.minHeight) };
  t.maxSize = { width: fracOrAuto(s.maxWidth), height: fracOrAuto(s.maxHeight) };
  // unset margins are 0, NOT 'auto' — auto margins absorb free space and
  // defeat the default stretch (items would center at content size)
  const mg = (v: number | 'auto' | undefined): number | 'auto' => (v === undefined ? 0 : v);
  t.margin = {
    left: mg(s.marginLeft ?? s.margin) as never,
    right: mg(s.marginRight ?? s.margin) as never,
    top: mg(s.marginTop ?? s.margin) as never,
    bottom: mg(s.marginBottom ?? s.margin) as never,
  };
  if (s.alignSelf && s.alignSelf !== 'auto') t.alignSelf = ALIGN_SELF[s.alignSelf];
  if (s.justifySelf && s.justifySelf !== 'auto') t.justifySelf = JUSTIFY_SELF[s.justifySelf];
  if (s.aspectRatio !== undefined) t.aspectRatio = s.aspectRatio;
  if (s.position === 'absolute') {
    t.position = 1; // Position.Absolute
    t.inset = {
      left: fracOrAuto(s.left) as never,
      right: fracOrAuto(s.right) as never,
      top: fracOrAuto(s.top) as never,
      bottom: fracOrAuto(s.bottom) as never,
    };
  }
  return t;
}

// ---- min-content estimation for Yoga subtrees -------------------------------

/**
 * Min-content inline size of a subtree. Yoga can't answer this directly
 * (its AT_MOST mode is fit-content), so estimate per CSS rules: text =
 * longest segment; nowrap rows sum; columns/wrap take the max. Documented
 * envelope: percent widths count as auto, aspect-ratio ignored.
 */
function minContentWidth(n: TreeNode, fonts: FontStore): number {
  const s = n.style ?? {};
  if (s.display === 'none') return 0;
  if (typeof s.width === 'number') return clampMin(s.width, s);
  if (n.text !== undefined) {
    if (s.whiteSpace === 'nowrap') return measureText(fonts, n.text, s, Infinity).width;
    return measureText(fonts, n.text, s, 1).width; // every break taken → longest segment
  }
  const pad = hPadBorder(s);
  const kids = n.children ?? [];
  const inner =
    s.flexDirection === 'row' || s.flexDirection === 'row-reverse'
      ? s.flexWrap === 'wrap' || s.flexWrap === 'wrap-reverse'
        ? Math.max(0, ...kids.map((c) => minContentWidth(c, fonts)))
        : kids.reduce((sum, c) => sum + minContentWidth(c, fonts), 0) +
          (s.columnGap ?? s.gap ?? 0) * Math.max(0, kids.filter((c) => c.style?.display !== 'none').length - 1)
      : Math.max(0, ...kids.map((c) => minContentWidth(c, fonts)));
  return clampMin(inner + pad, s);
}

function clampMin(w: number, s: Style): number {
  if (typeof s.minWidth === 'number') w = Math.max(w, s.minWidth);
  if (typeof s.maxWidth === 'number') w = Math.min(w, s.maxWidth);
  return w;
}

// ---- the island --------------------------------------------------------------

/**
 * Lay out a `display:grid` container's CONTENT as a Taffy island.
 *
 * @param container  tree node with style.display === 'grid'
 * @param widthConstraint   content-box width (undefined = max-content sizing)
 * @param heightConstraint  content-box height (undefined = max-content) —
 *                          definite at collect time so auto rows stretch and
 *                          align-content distributes like Chrome.
 * @param path  tree path of the container ('r.2'); item boxes get `${path}.${i}…`
 *
 * Returns the island's content size plus boxes for every descendant,
 * positioned relative to the container's content origin.
 */
export function layoutGridIsland(
  container: TreeNode,
  widthConstraint: number | undefined,
  heightConstraint: number | undefined,
  fonts: FontStore,
  path: string,
  layoutSubtree: SubtreeLayoutFn,
): SubtreeResult {
  ensureTaffy();
  const style = container.style ?? {};
  const children = container.children ?? [];
  const tree = new TaffyTree();
  tree.disableRounding();

  const live: { child: TreeNode; index: number; node: bigint }[] = [];
  const hidden: number[] = [];
  const nodes: bigint[] = [];
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.style?.display === 'none') {
      hidden.push(i);
      continue;
    }
    const node = tree.newLeafWithContext(toItemStyle(child.style ?? {}), { index: i });
    live.push({ child, index: i, node });
    nodes.push(node);
  }

  const containerStyle = toContainerStyle(style);
  containerStyle.size = {
    width: widthConstraint ?? 'auto',
    height: heightConstraint ?? 'auto',
  };
  const root = tree.newWithChildren(containerStyle, nodes);

  // Per-item measurement cache: taffy re-asks across track-sizing phases.
  const cache = new Map<string, { width: number; height: number }>();
  const measureItem = (child: TreeNode, index: number, widthKind: number | 'min-content' | 'max-content'): { width: number; height: number } => {
    const key = `${index}|${widthKind}`;
    let r = cache.get(key);
    if (r) return r;
    const cs = child.style ?? {};
    if (child.text !== undefined) {
      // mirror layout.ts text semantics (fit-content shrink-wrap)
      const maxWidth =
        widthKind === 'max-content' ? Infinity : widthKind === 'min-content' ? 1 : widthKind;
      const m = measureText(fonts, child.text, cs, maxWidth);
      const width =
        typeof maxWidth === 'number' && Number.isFinite(maxWidth) && m.lineCount > 1
          ? maxWidth
          : Math.min(m.width, typeof maxWidth === 'number' ? maxWidth : Infinity);
      r = { width, height: m.height };
    } else if (widthKind === 'max-content') {
      const sub = layoutSubtree(child, undefined, fonts);
      r = { width: sub.width, height: sub.height };
    } else if (widthKind === 'min-content') {
      const w = minContentWidth(child, fonts);
      const sub = layoutSubtree(child, w, fonts);
      r = { width: w, height: sub.height };
    } else {
      const sub = layoutSubtree(child, widthKind, fonts);
      r = { width: sub.width, height: sub.height };
    }
    cache.set(key, r);
    return r;
  };

  const measure: MeasureFunction = (known, avail, _node, ctx) => {
    const index = (ctx as { index: number } | undefined)?.index;
    if (index === undefined) return { width: known.width ?? 0, height: known.height ?? 0 };
    const child = children[index];
    const widthKind: number | 'min-content' | 'max-content' =
      known.width !== undefined ? known.width : avail.width;
    const m = measureItem(child, index, widthKind);
    return { width: known.width ?? m.width, height: known.height ?? m.height };
  };

  tree.computeLayoutWithMeasure(
    root,
    {
      width: widthConstraint ?? 'max-content',
      height: heightConstraint ?? 'max-content',
    },
    measure,
  );

  const rootLayout = tree.getLayout(root);
  const boxes: Box[] = [];

  for (const { child, index, node } of live) {
    const l = tree.getLayout(node);
    const rect = { x: l.x, y: l.y, width: l.width, height: l.height };
    if (child.text !== undefined) {
      boxes.push({ path: `${path}.${index}`, name: child.name, isText: true, ...rect });
      continue;
    }
    // Final interior layout at the item's settled size. Patch the definite
    // height in so stretched items distribute it (flex-1 fills a row-span-2
    // cell); width flows through availableWidth as usual.
    const patched: TreeNode = {
      ...child,
      style: { ...child.style, height: rect.height },
    };
    const inner = layoutSubtree(patched, rect.width, fonts);
    for (const b of inner.boxes) {
      const rel = b.path.slice(1); // 'r' → '', 'r.0' → '.0'
      boxes.push({
        ...b,
        path: `${path}.${index}${rel}`,
        x: rect.x + b.x,
        y: rect.y + b.y,
      });
    }
    // the item's own box must be taffy's rect, not the subtree's view of it
    const own = boxes.find((b) => b.path === `${path}.${index}`);
    if (own) {
      own.x = rect.x;
      own.y = rect.y;
      own.width = rect.width;
      own.height = rect.height;
    }
  }

  // display:none children: zero boxes for the whole hidden subtree
  for (const index of hidden) {
    const emit = (m: TreeNode, p: string): void => {
      boxes.push({ path: p, name: m.name, isText: m.text !== undefined, x: 0, y: 0, width: 0, height: 0 });
      (m.children ?? []).forEach((c, i) => emit(c, `${p}.${i}`));
    };
    emit(children[index], `${path}.${index}`);
  }

  const result: SubtreeResult = {
    width: rootLayout.width,
    height: rootLayout.height,
    boxes,
  };
  tree.free();
  return result;
}
