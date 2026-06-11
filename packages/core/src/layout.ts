import Yoga from 'yoga-layout';
import type { FontStore } from './fonts';
import { measureText } from './text';
import type { Box, Style, TreeNode } from './types';

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

  if (s.position === 'absolute') node.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE);
  if (s.top !== undefined) node.setPosition(Yoga.EDGE_TOP, s.top);
  if (s.right !== undefined) node.setPosition(Yoga.EDGE_RIGHT, s.right);
  if (s.bottom !== undefined) node.setPosition(Yoga.EDGE_BOTTOM, s.bottom);
  if (s.left !== undefined) node.setPosition(Yoga.EDGE_LEFT, s.left);
}

/**
 * Compute the layout of a tree at a given viewport width.
 * Returns absolute-position boxes keyed by tree path (root = "r").
 */
export function computeLayout(tree: TreeNode, viewportWidth: number, fonts: FontStore): Box[] {
  const config = Yoga.Config.create();
  // Match browser flexbox semantics: row default, flex-shrink:1, etc.
  config.setUseWebDefaults(true);
  // Keep fractional values — Chrome's getBoundingClientRect is fractional too.
  config.setPointScaleFactor(0);

  type YogaNode = ReturnType<typeof Yoga.Node.create>;
  const yogaNodes = new Map<string, YogaNode>();

  const build = (n: TreeNode, path: string): YogaNode => {
    const node = Yoga.Node.create(config);
    yogaNodes.set(path, node);
    const style = n.style ?? {};
    applyStyle(node, style);
    if (n.text !== undefined) {
      const text = n.text;
      node.setMeasureFunc((width, widthMode, _height, _heightMode) => {
        const maxWidth =
          widthMode === Yoga.MEASURE_MODE_UNDEFINED ? Infinity : width;
        const m = measureText(fonts, text, style, maxWidth);
        const outWidth =
          widthMode === Yoga.MEASURE_MODE_EXACTLY ? width : Math.min(m.width, maxWidth);
        return { width: outWidth, height: m.height };
      });
    } else {
      (n.children ?? []).forEach((child, i) => {
        node.insertChild(build(child, `${path}.${i}`), i);
      });
    }
    return node;
  };

  const root = build(tree, 'r');
  root.calculateLayout(viewportWidth, undefined, Yoga.DIRECTION_LTR);

  const boxes: Box[] = [];
  const collect = (n: TreeNode, path: string, parentX: number, parentY: number) => {
    const yn = yogaNodes.get(path)!;
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

  root.freeRecursive();
  return boxes;
}
