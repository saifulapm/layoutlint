import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseSource, type CorpusCase, type Style, type TreeNode } from '@layoutlint/core';

export const FONTS_DIR = join(import.meta.dir, '../../rules/fonts');
const VENDOR_DIR = join(import.meta.dir, '../../../vendor');

/** Props whose numeric values are unitless in CSS. */
const UNITLESS = new Set(['flexGrow', 'flexShrink', 'fontWeight']);

function toKebab(key: string): string {
  return key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

function styleToCss(style: Style, isText: boolean): string {
  const decls: string[] = [
    'box-sizing:border-box',
    // Yoga semantics: every element is a flex container; text is a leaf block.
    isText ? 'display:block' : 'display:flex',
  ];
  for (const [key, value] of Object.entries(style)) {
    if (value === undefined) continue;
    const px = typeof value === 'number' && !UNITLESS.has(key);
    decls.push(`${toKebab(key)}:${value}${px ? 'px' : ''}`);
  }
  return decls.join(';');
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderNode(n: TreeNode, path: string): string {
  const isText = n.text !== undefined;
  const inner = isText
    ? escapeHtml(n.text!)
    : (n.children ?? []).map((c, i) => renderNode(c, `${path}.${i}`)).join('');
  return `<div data-aeid="${path}" style="${styleToCss(n.style ?? {}, isText)}">${inner}</div>`;
}

function fontFace(family: string, file: string, weight: number): string {
  const b64 = readFileSync(join(FONTS_DIR, file)).toString('base64');
  return `@font-face{font-family:'${family}';src:url(data:font/ttf;base64,${b64});font-weight:${weight};}`;
}

/**
 * Render a corpus case as a standalone HTML document that mirrors what the
 * engine computes: border-box flex divs, explicit fonts, no UA margins.
 * Emoji intentionally fall through to the system Noto Color Emoji — the
 * engine has the same file in its fallback chain.
 */
export function renderCaseHtml(c: CorpusCase): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
${ALL_FONT_FACES()}
html,body{margin:0;padding:0;overflow:hidden;}
body{font-family:'AE Sans','AE Bengali';font-size:16px;}
</style>
</head><body>${renderNode(c.tree, 'r')}</body></html>`;
}

// ---- Tailwind-input cases ---------------------------------------------------

const VOID_TAGS = new Set(['img', 'input', 'br', 'hr', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr']);

/**
 * Re-render the *parsed* tree back to markup with data-aeid path attributes,
 * so the oracle DOM mirrors the engine's tree node-for-node (this holds
 * parsing constant and validates resolver + layout against real Tailwind).
 */
function renderRawNode(n: TreeNode, path: string): string {
  const tag = n.tag ?? 'div';
  const cls = (n.classes ?? []).join(' ');
  const open = `<${tag} data-aeid="${path}"${cls ? ` class="${cls}"` : ''}`;
  if (VOID_TAGS.has(tag)) return `${open}/>`;
  const inner =
    n.text !== undefined
      ? escapeHtml(n.text)
      : (n.children ?? []).map((c, i) => renderRawNode(c, `${path}.${i}`)).join('');
  return `${open}>${inner}</${tag}>`;
}

const ALL_FONT_FACES = () =>
  [
    fontFace('AE Sans', 'Inter-Regular.ttf', 400),
    fontFace('AE Sans', 'Inter-Medium.ttf', 500),
    fontFace('AE Sans', 'Inter-SemiBold.ttf', 600),
    fontFace('AE Sans', 'Inter-Bold.ttf', 700),
    fontFace('AE Bengali', 'NotoSansBengali-Regular.ttf', 400),
  ].join('\n');

/**
 * Render a Tailwind-input case with the real (vendored, pinned) Tailwind v4
 * browser build compiling the classes in-page. A `hidden` probe div signals
 * when compilation has been applied.
 */
export function renderTailwindCaseHtml(html: string): string {
  const tree = parseSource(html);
  const tailwind = readFileSync(join(VENDOR_DIR, 'tailwindcss-browser-4.js'), 'utf8');
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
${ALL_FONT_FACES()}
html, body { margin: 0; padding: 0; overflow: hidden; }
html, body { font-family: 'AE Sans', 'AE Bengali' !important; font-size: 16px; }
</style>
<script>${tailwind}</script>
</head><body>${renderRawNode(tree, 'r')}<div class="hidden" id="tw-probe"></div></body></html>`;
}
