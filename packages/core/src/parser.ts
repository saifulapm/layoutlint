import { parseDocument } from 'htmlparser2';
import { Element, Text, type AnyNode } from 'domhandler';
import type { TreeNode } from './types';

/**
 * Tags treated as inline text content: an element whose children are only
 * text and inline elements becomes a single text leaf with the element's own
 * style. Known v0 gap: per-span style changes (e.g. a bold <strong> inside a
 * <p>) are measured with the parent's style.
 */
const INLINE_TAGS = new Set([
  'span', 'strong', 'em', 'b', 'i', 'a', 'code', 'small', 'abbr', 'u', 's', 'sub', 'sup', 'mark',
]);

function isWhitespaceText(n: AnyNode): boolean {
  return n instanceof Text && /^\s*$/.test(n.data);
}

function isInlineSubtree(n: AnyNode): boolean {
  if (n instanceof Text) return true;
  if (n instanceof Element) {
    // a classed inline element is its own box (flex item / styled badge) —
    // only unstyled inline markup collapses into the parent's text
    return INLINE_TAGS.has(n.name) && classList(n).length === 0 && n.children.every(isInlineSubtree);
  }
  return true; // comments etc. don't break inline-ness
}

function textContent(n: AnyNode): string {
  if (n instanceof Text) return n.data;
  if (n instanceof Element) return n.children.map(textContent).join('');
  return '';
}

function classList(el: Element): string[] {
  const raw = el.attribs.class ?? el.attribs.classname ?? '';
  return raw.split(/\s+/).filter(Boolean);
}

function convert(el: Element): TreeNode {
  const node: TreeNode = { tag: el.name, classes: classList(el) };
  const meaningful = el.children.filter((c) => !isWhitespaceText(c));

  if (meaningful.length > 0 && meaningful.every(isInlineSubtree)) {
    // collapse whitespace the way `white-space: normal` does
    const text = el.children.map(textContent).join('').replace(/\s+/g, ' ').trim();
    if (text.length > 0) {
      node.text = text;
      return node;
    }
  }

  node.children = [];
  for (const child of meaningful) {
    if (child instanceof Element) {
      node.children.push(convert(child));
    } else if (child instanceof Text) {
      // bare text mixed with element siblings → anonymous text leaf
      const text = child.data.replace(/\s+/g, ' ').trim();
      if (text.length > 0) node.children.push({ tag: 'span', classes: [], text });
    }
  }
  return node;
}

/**
 * Parse a JSX/HTML fragment into an element tree. v0 scope: static markup —
 * `className` is treated as `class`, self-closing tags are recognized, JSX
 * expressions/props/conditionals are not evaluated.
 */
export function parseSource(source: string): TreeNode {
  const doc = parseDocument(source, { recognizeSelfClosing: true });
  const roots = doc.children.filter((c): c is Element => c instanceof Element);
  if (roots.length === 0) throw new Error('no elements found in source');
  if (roots.length === 1) return convert(roots[0]);
  return { tag: 'div', classes: [], children: roots.map(convert) };
}
