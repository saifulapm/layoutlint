import { parseDocument } from 'htmlparser2';
import { Element, Text, type AnyNode } from 'domhandler';
import { classAffectsLayout } from './tailwind';
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

/**
 * Metadata content is display:none in every browser and generates no box —
 * skipped entirely. Covers React 19's hoisted resource hints (e.g. the
 * `<link rel="preload">` renderToStaticMarkup emits for img src) and
 * `<style>`/`<script>` text in pasted HTML, which must never be measured.
 */
const METADATA_TAGS = new Set(['base', 'link', 'meta', 'noscript', 'script', 'style', 'template', 'title']);

function isWhitespaceText(n: AnyNode): boolean {
  return n instanceof Text && /^\s*$/.test(n.data);
}

function isInlineSubtree(n: AnyNode): boolean {
  if (n instanceof Text) return true;
  if (n instanceof Element) {
    if (METADATA_TAGS.has(n.name)) return true; // invisible — doesn't break inline-ness
    // an inline element with geometry-affecting classes (padding, size,
    // display…) is its own box (flex item / styled badge); color- and
    // weight-only inline markup collapses into the parent's text
    return (
      INLINE_TAGS.has(n.name) &&
      !classList(n).some(classAffectsLayout) &&
      n.children.every(isInlineSubtree)
    );
  }
  return true; // comments etc. don't break inline-ness
}

function textContent(n: AnyNode): string {
  if (n instanceof Text) return n.data;
  if (n instanceof Element) {
    return METADATA_TAGS.has(n.name) ? '' : n.children.map(textContent).join('');
  }
  return '';
}

function classList(el: Element): string[] {
  const raw = el.attribs.class ?? el.attribs.classname ?? '';
  return raw.split(/\s+/).filter(Boolean);
}

/** Children of a flex/grid container are blockified into items — never inline. */
function isFlexLikeContainer(el: Element): boolean {
  return classList(el).some((c) =>
    ['flex', 'inline-flex', 'grid', 'inline-grid'].includes(c.split(':').pop()!),
  );
}

function convert(el: Element): TreeNode {
  const node: TreeNode = { tag: el.name, classes: classList(el) };
  const meaningful = el.children.filter(
    (c) => !isWhitespaceText(c) && !(c instanceof Element && METADATA_TAGS.has(c.name)),
  );

  if (!isFlexLikeContainer(el) && meaningful.length > 0 && meaningful.every(isInlineSubtree)) {
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
  const roots = doc.children.filter(
    (c): c is Element => c instanceof Element && !METADATA_TAGS.has(c.name),
  );
  if (roots.length === 0) throw new Error('no elements found in source');
  if (roots.length === 1) return convert(roots[0]);
  return { tag: 'div', classes: [], children: roots.map(convert) };
}
