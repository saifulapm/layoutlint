import { measureText, type Box, type FontStore, type Style, type TreeNode } from '@layoutlint/core';
import type { RuleName, Violation } from './types';

const TOL = 0.5;

interface IndexedNode {
  path: string;
  node: TreeNode;
  box: Box;
  parent?: IndexedNode;
  children: IndexedNode[];
  selector: string;
  element: string;
}

export interface RuleContext {
  viewport: number;
  fonts: FontStore;
  nodes: IndexedNode[];
  root: IndexedNode;
}

function shortSelector(n: TreeNode): string {
  const tag = n.tag ?? 'div';
  const classes = (n.classes ?? []).slice(0, 2).map((c) => `.${c}`).join('');
  return `${tag}${classes}`;
}

export function buildIndex(tree: TreeNode, boxes: Box[], viewport: number, fonts: FontStore): RuleContext {
  const byPath = new Map(boxes.map((b) => [b.path, b]));
  const nodes: IndexedNode[] = [];
  const walk = (n: TreeNode, path: string, parent?: IndexedNode): IndexedNode => {
    const selector = shortSelector(n);
    const chain: string[] = [];
    let p: IndexedNode | undefined = parent;
    while (p && chain.length < 2) { chain.unshift(p.selector); p = p.parent; }
    const idx: IndexedNode = {
      path, node: n, box: byPath.get(path)!, parent, children: [], selector,
      element: [...chain, selector].join(' > '),
    };
    nodes.push(idx);
    (n.children ?? []).forEach((c, i) => idx.children.push(walk(c, `${path}.${i}`, idx)));
    return idx;
  };
  const root = walk(tree, 'r');
  return { viewport, fonts, nodes, root };
}

const style = (n: IndexedNode): Style => n.node.style ?? {};
const px = (v: number) => Math.round(v * 10) / 10;
const isHiddenBox = (n: IndexedNode) => n.box.width === 0 && n.box.height === 0;
const isAbsolute = (n: IndexedNode) => style(n).position === 'absolute';
const num = (v: number | `${number}%` | 'auto' | undefined) => (typeof v === 'number' ? v : 0);

/** Border-box → content box (subtract padding and border). */
function contentBox(n: IndexedNode) {
  const s = style(n);
  const left = num(s.paddingLeft ?? s.padding) + num(s.borderLeftWidth ?? s.borderWidth);
  const right = num(s.paddingRight ?? s.padding) + num(s.borderRightWidth ?? s.borderWidth);
  const top = num(s.paddingTop ?? s.padding) + num(s.borderTopWidth ?? s.borderWidth);
  const bottom = num(s.paddingBottom ?? s.padding) + num(s.borderBottomWidth ?? s.borderWidth);
  return {
    x: n.box.x + left,
    y: n.box.y + top,
    width: n.box.width - left - right,
    height: n.box.height - top - bottom,
  };
}

const scrolls = (n: IndexedNode) => {
  const o = style(n).overflow;
  return o === 'hidden' || o === 'auto' || o === 'scroll';
};

function noOverflow(ctx: RuleContext): Violation[] {
  const out: Violation[] = [];
  for (const n of ctx.nodes) {
    if (n.node.text !== undefined) {
      // text content wider than its own box (unbreakable word, or nowrap without truncate)
      const s = style(n);
      const content = contentBox(n);
      if (content.width <= 0) continue;
      const m = measureText(ctx.fonts, n.node.text, s, s.whiteSpace === 'nowrap' ? Infinity : content.width);
      const clipped = s.overflow === 'hidden';
      if (m.width > content.width + TOL && !clipped) {
        out.push({
          rule: 'no-overflow',
          element: n.element,
          path: n.path,
          detail: `text is ${px(m.width)}px wide but its box is ${px(content.width)}px — content overflows by ${px(m.width - content.width)}px`,
          measured: { width: px(m.width) },
          available: { width: px(content.width) },
          suggestion:
            s.whiteSpace === 'nowrap'
              ? 'text is nowrap — add "truncate" (to clip with ellipsis) or remove the nowrap so it can wrap'
              : 'an unbreakable word/URL exceeds the container — add "break-words", "truncate", or widen the container',
        });
      }
      continue;
    }
    if (scrolls(n)) continue;
    const content = contentBox(n);
    for (const child of n.children) {
      if (isAbsolute(child) || isHiddenBox(child)) continue;
      const b = child.box;
      const overRight = b.x + b.width - (content.x + content.width);
      const overBottom = b.y + b.height - (content.y + content.height);
      const overLeft = content.x - b.x;
      const overTop = content.y - b.y;
      const worst = Math.max(overRight, overBottom, overLeft, overTop);
      if (worst <= TOL) continue;
      const dir =
        worst === overRight ? 'right' : worst === overBottom ? 'bottom' : worst === overLeft ? 'left' : 'top';
      const s = style(child);
      const hasNegativeMargin = [s.margin, s.marginTop, s.marginRight, s.marginBottom, s.marginLeft].some(
        (v) => typeof v === 'number' && v < 0,
      );
      const horizontal = dir === 'right' || dir === 'left';
      const childSize = horizontal ? b.width : b.height;
      const avail = horizontal ? content.width : content.height;
      const detail =
        childSize > avail + TOL
          ? `child ${horizontal ? 'width' : 'height'} ${px(childSize)}px exceeds container content ${horizontal ? 'width' : 'height'} ${px(avail)}px — overflows ${dir} edge by ${px(worst)}px`
          : `child is pushed ${px(worst)}px past the container's ${dir} content edge (preceding siblings already fill it)`;
      out.push({
        rule: 'no-overflow',
        element: child.element,
        path: child.path,
        detail,
        measured: { width: px(b.width), height: px(b.height) },
        available: { width: px(content.width), height: px(content.height) },
        suggestion: hasNegativeMargin
          ? 'child has a negative margin — if the bleed is intentional, add overflow-hidden to the container'
          : 'reduce fixed sizes, add flex-wrap to the container, or let the child shrink (min-w-0 / shrink)',
      });
    }
  }
  return out;
}

function noOverlap(ctx: RuleContext): Violation[] {
  const out: Violation[] = [];
  for (const n of ctx.nodes) {
    const flow = n.children.filter((c) => !isAbsolute(c) && !isHiddenBox(c));
    for (let i = 0; i < flow.length; i++) {
      for (let j = i + 1; j < flow.length; j++) {
        const a = flow[i].box;
        const b = flow[j].box;
        const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
        const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
        if (w > TOL && h > TOL) {
          out.push({
            rule: 'no-overlap',
            element: flow[j].element,
            path: flow[j].path,
            detail: `overlaps sibling ${flow[i].element} by ${px(w)}×${px(h)}px`,
            measured: { overlapWidth: px(w), overlapHeight: px(h) },
            suggestion:
              'siblings should not overlap — check negative margins and relative offsets, or use gap/padding for spacing',
          });
        }
      }
    }
  }
  return out;
}

function fitsViewport(ctx: RuleContext): Violation[] {
  const out: Violation[] = [];
  for (const n of ctx.nodes) {
    const over = n.box.x + n.box.width - ctx.viewport;
    if (over <= TOL) continue;
    // report boundary-crossing nodes only, not every descendant of one
    if (n.parent && n.parent.box.x + n.parent.box.width - ctx.viewport > TOL) continue;
    if (n.parent && scrolls(n.parent)) continue;
    out.push({
      rule: 'fits-viewport',
      element: n.element,
      path: n.path,
      detail: `right edge at ${px(n.box.x + n.box.width)}px exceeds the ${ctx.viewport}px viewport by ${px(over)}px — causes horizontal scroll`,
      measured: { rightEdge: px(n.box.x + n.box.width), width: px(n.box.width) },
      available: { viewport: ctx.viewport },
      suggestion: 'replace fixed widths with max-w-full / w-full, or add flex-wrap so content can reflow',
    });
  }
  return out;
}

function noTextTruncation(ctx: RuleContext): Violation[] {
  const out: Violation[] = [];
  for (const n of ctx.nodes) {
    if (n.node.text === undefined || isHiddenBox(n)) continue;
    const s = style(n);
    const content = contentBox(n);
    if (s.whiteSpace === 'nowrap' && s.overflow === 'hidden') {
      const natural = measureText(ctx.fonts, n.node.text, s, Infinity);
      if (natural.width > content.width + TOL) {
        out.push({
          rule: 'no-text-truncation',
          element: n.element,
          path: n.path,
          detail: `truncated: full text needs ${px(natural.width)}px but only ${px(content.width)}px is available — ${px(natural.width - content.width)}px of text is cut`,
          measured: { width: px(natural.width) },
          available: { width: px(content.width) },
          suggestion:
            'widen the container, shorten the text, or confirm the ellipsis is acceptable at this viewport',
        });
      }
    }
    // vertical clipping by an overflow-hidden ancestor
    for (let p = n.parent; p; p = p.parent) {
      if (style(p).overflow !== 'hidden') continue;
      const pc = contentBox(p);
      const cut = n.box.y + n.box.height - (pc.y + pc.height);
      if (cut > TOL) {
        out.push({
          rule: 'no-text-truncation',
          element: n.element,
          path: n.path,
          detail: `text extends ${px(cut)}px below overflow-hidden ancestor ${p.element} — last line(s) are clipped`,
          measured: { bottomEdge: px(n.box.y + n.box.height) },
          available: { bottomEdge: px(pc.y + pc.height) },
          suggestion: 'increase the clipped ancestor height, shorten the text, or use line-clamp deliberately',
        });
        break;
      }
    }
  }
  return out;
}

export const RULES: Record<RuleName, (ctx: RuleContext) => Violation[]> = {
  'no-overflow': noOverflow,
  'no-overlap': noOverlap,
  'fits-viewport': fitsViewport,
  'no-text-truncation': noTextTruncation,
};
