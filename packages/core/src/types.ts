/** Length: number = px, string = percentage like '50%'. */
export type Length = number | `${number}%`;

/**
 * Style object — a CSS-like subset that both the Yoga bridge and the
 * oracle's HTML renderer understand. Phase 0 input format (no parser yet).
 */
export interface Style {
  // flex container
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  justifyContent?:
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'space-between'
    | 'space-around'
    | 'space-evenly';
  alignItems?: 'stretch' | 'flex-start' | 'flex-end' | 'center';
  alignContent?:
    | 'stretch'
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'space-between'
    | 'space-around';
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  gap?: number;
  rowGap?: number;
  columnGap?: number;

  // flex item
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: Length | 'auto';
  alignSelf?: 'auto' | 'stretch' | 'flex-start' | 'flex-end' | 'center';

  // sizing
  width?: Length;
  height?: Length;
  minWidth?: Length;
  maxWidth?: Length;
  minHeight?: Length;
  maxHeight?: Length;

  // spacing (px)
  padding?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  margin?: number;
  marginTop?: number | 'auto';
  marginRight?: number | 'auto';
  marginBottom?: number | 'auto';
  marginLeft?: number | 'auto';

  // borders (px — layout-relevant; style/color are not)
  borderWidth?: number;
  borderTopWidth?: number;
  borderRightWidth?: number;
  borderBottomWidth?: number;
  borderLeftWidth?: number;

  // positioning
  position?: 'relative' | 'absolute';
  top?: Length;
  right?: Length;
  bottom?: Length;
  left?: Length;

  /** width / height ratio (Tailwind aspect-*). */
  aspectRatio?: number;

  // display
  /** 'none' removes the node from layout (zero box, children skipped). */
  display?: 'flex' | 'none';
  overflow?: 'visible' | 'hidden' | 'auto' | 'scroll';

  // text (leaf nodes only)
  fontSize?: number;
  /** px. Explicit in v0 — `line-height: normal` parity is out of scope for the spike. */
  lineHeight?: number;
  fontWeight?: number;
  letterSpacing?: number;
  /** 'nowrap' lays the text out as a single line (the `truncate` pattern). */
  whiteSpace?: 'normal' | 'nowrap';
  textOverflow?: 'ellipsis';
}

/** Element tree node. A node with `text` is a leaf; `children` otherwise. */
export interface TreeNode {
  /** Optional human-readable label used in diagnostics. */
  name?: string;
  /** Source element tag (set by the parser), e.g. 'div'. */
  tag?: string;
  /** Source class list (set by the parser) — used for selectors/diagnostics. */
  classes?: string[];
  style?: Style;
  text?: string;
  children?: TreeNode[];
}

/** Computed absolute-position box for one tree node. */
export interface Box {
  /** Stable path id, e.g. "r", "r.0", "r.0.1" — shared with the oracle. */
  path: string;
  name?: string;
  isText: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CorpusCase {
  name: string;
  viewport: number;
  tree: TreeNode;
}
