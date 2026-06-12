import Yoga from 'yoga-layout';
import type { FontStore } from './fonts';
import { correctRowContainer, fitContentWidth } from './flexfix';
import { measureText } from './text';
import type { Box, Style, TreeNode } from './types';

const num = (v: number | `${number}%` | 'auto' | undefined): number =>
  typeof v === 'number' ? v : 0;

const hPadBorder = (s: Style): number =>
  num(s.paddingLeft ?? s.padding) +
  num(s.paddingRight ?? s.padding) +
  num(s.borderLeftWidth ?? s.borderWidth) +
  num(s.borderRightWidth ?? s.borderWidth);

const FLEX_DIRECTION = {
  row: Yoga.FLEX_DIRECTION_ROW,
  column: Yoga.FLEX_DIRECTION_COLUMN,
  'row-reverse': Yoga.FLEX_DIRECTION_ROW_REVERSE,
  'column-reverse': Yoga.FLEX_DIRECTION_COLUMN_REVERSE,
} as const;

const JUSTIFY = {
  'flex-start': Yoga.JUSTIFY_FLEX_START,
  'flex-end': Yoga.JUSTIFY_FLEX_END,
  center: Yoga.JUSTIFY_CENTER,
  'space-between': Yoga.JUSTIFY_SPACE_BETWEEN,
  'space-around': Yoga.JUSTIFY_SPACE_AROUND,
  'space-evenly': Yoga.JUSTIFY_SPACE_EVENLY,
} as const;

const ALIGN = {
  auto: Yoga.ALIGN_AUTO,
  stretch: Yoga.ALIGN_STRETCH,
  'flex-start': Yoga.ALIGN_FLEX_START,
  'flex-end': Yoga.ALIGN_FLEX_END,
  center: Yoga.ALIGN_CENTER,
  'space-between': Yoga.ALIGN_SPACE_BETWEEN,
  'space-around': Yoga.ALIGN_SPACE_AROUND,
} as const;

const WRAP = {
  nowrap: Yoga.WRAP_NO_WRAP,
  wrap: Yoga.WRAP_WRAP,
  'wrap-reverse': Yoga.WRAP_WRAP_REVERSE,
} as const;

function applyStyle(node: ReturnType<typeof Yoga.Node.create>, s: Style): void {
  if (s.flexDirection) node.setFlexDirection(FLEX_DIRECTION[s.flexDirection]);
  if (s.justifyContent) node.setJustifyContent(JUSTIFY[s.justifyContent]);
  if (s.alignItems) node.setAlignItems(ALIGN[s.alignItems]);
  if (s.alignContent) node.setAlignContent(ALIGN[s.alignContent]);
  if (s.alignSelf) node.setAlignSelf(ALIGN[s.alignSelf]);
  if (s.flexWrap) node.setFlexWrap(WRAP[s.flexWrap]);

  if (s.gap !== undefined) node.setGap(Yoga.GUTTER_ALL, s.gap);
  if (s.rowGap !== undefined) node.setGap(Yoga.GUTTER_ROW, s.rowGap);
  if (s.columnGap !== undefined) node.setGap(Yoga.GUTTER_COLUMN, s.columnGap);

  if (s.flexGrow !== undefined) node.setFlexGrow(s.flexGrow);
  if (s.flexShrink !== undefined) node.setFlexShrink(s.flexShrink);
  if (s.flexBasis !== undefined) node.setFlexBasis(s.flexBasis);

  if (s.width !== undefined) node.setWidth(s.width);
  if (s.height !== undefined) node.setHeight(s.height);
  if (s.minWidth !== undefined) node.setMinWidth(s.minWidth);
  if (s.maxWidth !== undefined) node.setMaxWidth(s.maxWidth);
  if (s.minHeight !== undefined) node.setMinHeight(s.minHeight);
  if (s.maxHeight !== undefined) node.setMaxHeight(s.maxHeight);

  if (s.padding !== undefined) node.setPadding(Yoga.EDGE_ALL, s.padding);
  if (s.paddingTop !== undefined) node.setPadding(Yoga.EDGE_TOP, s.paddingTop);
  if (s.paddingRight !== undefined) node.setPadding(Yoga.EDGE_RIGHT, s.paddingRight);
  if (s.paddingBottom !== undefined) node.setPadding(Yoga.EDGE_BOTTOM, s.paddingBottom);
  if (s.paddingLeft !== undefined) node.setPadding(Yoga.EDGE_LEFT, s.paddingLeft);

  if (s.margin !== undefined) node.setMargin(Yoga.EDGE_ALL, s.margin);
  if (s.marginTop !== undefined) node.setMargin(Yoga.EDGE_TOP, s.marginTop);
  if (s.marginRight !== undefined) node.setMargin(Yoga.EDGE_RIGHT, s.marginRight);
  if (s.marginBottom !== undefined) node.setMargin(Yoga.EDGE_BOTTOM, s.marginBottom);
  if (s.marginLeft !== undefined) node.setMargin(Yoga.EDGE_LEFT, s.marginLeft);

  if (s.borderWidth !== undefined) node.setBorder(Yoga.EDGE_ALL, s.borderWidth);
  if (s.borderTopWidth !== undefined) node.setBorder(Yoga.EDGE_TOP, s.borderTopWidth);
  if (s.borderRightWidth !== undefined) node.setBorder(Yoga.EDGE_RIGHT, s.borderRightWidth);
  if (s.borderBottomWidth !== undefined) node.setBorder(Yoga.EDGE_BOTTOM, s.borderBottomWidth);
  if (s.borderLeftWidth !== undefined) node.setBorder(Yoga.EDGE_LEFT, s.borderLeftWidth);

  if (s.position === 'absolute') node.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE);
  if (s.top !== undefined) node.setPosition(Yoga.EDGE_TOP, s.top);
  if (s.right !== undefined) node.setPosition(Yoga.EDGE_RIGHT, s.right);
  if (s.bottom !== undefined) node.setPosition(Yoga.EDGE_BOTTOM, s.bottom);
  if (s.left !== undefined) node.setPosition(Yoga.EDGE_LEFT, s.left);

  if (s.aspectRatio !== undefined) node.setAspectRatio(s.aspectRatio);
}

/** Result of laying out a subtree as its own root. */
export interface SubtreeResult {
  width: number;
  height: number;
  boxes: Box[];
}

/**
 * Compute the layout of a tree at a given viewport width.
 * Returns absolute-position boxes keyed by tree path (root = "r").
 */
export function computeLayout(tree: TreeNode, viewportWidth: number, fonts: FontStore): Box[] {
  return layoutSubtree(tree, viewportWidth, fonts).boxes;
}

/**
 * Lay out `tree` as a root inside an `availableWidth`-wide containing block
 * (undefined = max-content sizing). This is the full engine pipeline —
 * build Yoga nodes, stretch-then-clamp root max-width, calculateLayout,
 * §9.7 flexfix fixpoint, collect — reusable for grid-item subtrees.
 */
export function layoutSubtree(
  tree: TreeNode,
  availableWidth: number | undefined,
  fonts: FontStore,
): SubtreeResult {
  const config = Yoga.Config.create();
  // Match browser flexbox semantics: row default, flex-shrink:1, etc.
  config.setUseWebDefaults(true);
  // Keep fractional values — Chrome's getBoundingClientRect is fractional too.
  config.setPointScaleFactor(0);

  type YogaNode = ReturnType<typeof Yoga.Node.create>;
  const yogaNodes = new Map<string, YogaNode>();

  const build = (n: TreeNode, path: string): YogaNode | null => {
    const style = n.style ?? {};
    if (style.display === 'none') return null;
    const node = Yoga.Node.create(config);
    yogaNodes.set(path, node);
    applyStyle(node, style);
    if (n.text !== undefined) {
      const text = n.text;
      node.setMeasureFunc((width, widthMode, _height, _heightMode) => {
        const maxWidth =
          widthMode === Yoga.MEASURE_MODE_UNDEFINED ? Infinity : width;
        const m = measureText(fonts, text, style, maxWidth);
        // CSS fit-content: once text wraps, the box fills the available
        // width (lines sit inside it); only single-line text shrink-wraps.
        const outWidth =
          widthMode === Yoga.MEASURE_MODE_EXACTLY
            ? width
            : m.lineCount > 1
              ? maxWidth
              : Math.min(m.width, maxWidth);
        return { width: outWidth, height: m.height };
      });
    } else {
      let slot = 0;
      (n.children ?? []).forEach((child, i) => {
        const childNode = build(child, `${path}.${i}`);
        if (childNode) node.insertChild(childNode, slot++);
      });
    }
    return node;
  };

  const root = build(tree, 'r');
  if (!root)
    return {
      width: 0,
      height: 0,
      boxes: [{ path: 'r', name: tree.name, isText: false, x: 0, y: 0, width: 0, height: 0 }],
    };

  // CSS: a block-level root stretches to the viewport and max-width then
  // clamps; Yoga's top-level AT_MOST measure shrinks it to fit instead. Pin
  // the stretched-then-clamped width. Auto margins absorb leftover space, so
  // they don't reduce the available width (mx-auto centering still works).
  const rootStyle = tree.style ?? {};
  if (
    availableWidth !== undefined &&
    rootStyle.width === undefined &&
    typeof rootStyle.maxWidth === 'number'
  ) {
    const side = (v: number | 'auto' | undefined): number =>
      typeof v === 'number' ? v : v === 'auto' ? 0 : (rootStyle.margin ?? 0);
    const available = availableWidth - side(rootStyle.marginLeft) - side(rootStyle.marginRight);
    root.setWidth(Math.min(rootStyle.maxWidth, available));
  }

  root.calculateLayout(availableWidth, undefined, Yoga.DIRECTION_LTR);

  // §9.7 corrective passes: Yoga resolves flexible lengths in a single pass;
  // CSS iteratively freezes min/max violators and redistributes. Pin the
  // spec-correct widths on conflicted row containers and relayout, repeating
  // so nested containers see their parents' corrected widths.
  // LL_NO_FLEXFIX=1 disables the pass (debugging raw Yoga output).
  // Both corrections are pure functions of (styles, current container width),
  // so re-applying is idempotent — iterate to a fixpoint, letting widths
  // settle top-down across passes. Pins must be reconciled every pass: a
  // child pinned while its container was narrow must be released once the
  // settled container no longer conflicts.
  const flexPinned = new Set<string>();
  for (let pass = 0; pass < 8 && !process.env.LL_NO_FLEXFIX; pass++) {
    let changed = false;
    const pin = (path: string, width: number, alsoFlex: boolean): void => {
      const yn = yogaNodes.get(path);
      if (alsoFlex) flexPinned.add(path);
      if (!yn || Math.abs(yn.getComputedWidth() - width) <= 0.5) return;
      yn.setWidth(width);
      if (alsoFlex) {
        yn.setFlexGrow(0);
        yn.setFlexShrink(0);
      }
      changed = true;
    };
    const unpin = (path: string, child: TreeNode): void => {
      if (!flexPinned.delete(path)) return;
      const yn = yogaNodes.get(path);
      if (!yn) return;
      const cs = child.style ?? {};
      if (cs.width !== undefined) yn.setWidth(cs.width);
      else yn.setWidthAuto();
      // web defaults: grow 0, shrink 1
      yn.setFlexGrow(cs.flexGrow ?? 0);
      yn.setFlexShrink(cs.flexShrink ?? 1);
      changed = true;
    };
    const visit = (n: TreeNode, path: string) => {
      const yn = yogaNodes.get(path);
      if (!yn || n.text !== undefined) return;
      const corr = correctRowContainer(n, yn.getComputedWidth(), fonts);
      if (corr) {
        const targets = new Map(corr.children.map((c) => [c.index, c.width]));
        (n.children ?? []).forEach((c, i) => {
          const childPath = `${path}.${i}`;
          const target = corr.conflict ? targets.get(i) : undefined;
          if (target !== undefined) pin(childPath, target, true);
          else unpin(childPath, c);
        });
      }
      // fit-content cross sizing for non-stretched children of columns
      const contentWidth = yn.getComputedWidth() - hPadBorder(n.style ?? {});
      (n.children ?? []).forEach((c, i) => {
        const target = fitContentWidth(n, c, contentWidth, fonts);
        if (target !== null) pin(`${path}.${i}`, target, false);
      });
      (n.children ?? []).forEach((c, i) => visit(c, `${path}.${i}`));
    };
    visit(tree, 'r');
    if (!changed) break;
    root.calculateLayout(availableWidth, undefined, Yoga.DIRECTION_LTR);
  }

  const boxes: Box[] = [];
  const collect = (n: TreeNode, path: string, parentX: number, parentY: number) => {
    const yn = yogaNodes.get(path);
    if (!yn) {
      // display:none subtree — zero box, matching getBoundingClientRect
      const emit = (m: TreeNode, p: string) => {
        boxes.push({ path: p, name: m.name, isText: m.text !== undefined, x: 0, y: 0, width: 0, height: 0 });
        (m.children ?? []).forEach((c, i) => emit(c, `${p}.${i}`));
      };
      emit(n, path);
      return;
    }
    const x = parentX + yn.getComputedLeft();
    const y = parentY + yn.getComputedTop();
    boxes.push({
      path,
      name: n.name,
      isText: n.text !== undefined,
      x,
      y,
      width: yn.getComputedWidth(),
      height: yn.getComputedHeight(),
    });
    (n.children ?? []).forEach((child, i) => collect(child, `${path}.${i}`, x, y));
  };
  collect(tree, 'r', 0, 0);

  const result: SubtreeResult = {
    width: root.getComputedWidth(),
    height: root.getComputedHeight(),
    boxes,
  };
  root.freeRecursive();
  return result;
}
