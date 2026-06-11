import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseSource, type CorpusCase, type Style, type TreeNode } from '@layoutlint/core';

export const FONTS_DIR = join(import.meta.dir, '../../rules/fonts');
const VENDOR_DIR = join(import.meta.dir, '../../../vendor');
/** Vendored emoji font — embedded in oracle pages AND loaded by the engine
 *  during golden comparison, so goldens are platform-independent. */
export const VENDOR_EMOJI = join(VENDOR_DIR, 'fonts/NotoColorEmoji.ttf');

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

function fontFace(family: string, path: string, weight: number): string {
  const b64 = readFileSync(path).toString('base64');
  return `@font-face{font-family:'${family}';src:url(data:font/ttf;base64,${b64});font-weight:${weight};}`;
}

/**
 * Render a corpus case as a standalone HTML document that mirrors what the
 * engine computes: border-box flex divs, explicit fonts, no UA margins.
 * Every family — including emoji — is an embedded @font-face, so goldens
 * are identical regardless of the host platform's system fonts.
 */
export function renderCaseHtml(c: CorpusCase): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
${FONT_FACES_FOR(JSON.stringify(c.tree))}
html,body{margin:0;padding:0;overflow:hidden;}
body{font-family:'AE Sans','AE Bengali','AE Emoji';font-size:16px;}
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

// Embedding fonts as data URIs makes pages heavy — the emoji font alone is
// ~14MB base64, which slowed/OOM-killed CI Chromium when attached to all
// 297 pages. Cache each encoded face once, and include the Bengali/emoji
// faces only when the case content can actually use them (an unused
// @font-face can never affect layout, so goldens are unchanged).
const faceCache = new Map<string, string>();
const cachedFace = (family: string, path: string, weight: number): string => {
  const key = `${family}|${path}|${weight}`;
  let css = faceCache.get(key);
  if (css === undefined) {
    css = fontFace(family, path, weight);
    faceCache.set(key, css);
  }
  return css;
};

const FONT_FACES_FOR = (content: string) =>
  [
    cachedFace('AE Sans', join(FONTS_DIR, 'Inter-Regular.ttf'), 400),
    cachedFace('AE Sans', join(FONTS_DIR, 'Inter-Medium.ttf'), 500),
    cachedFace('AE Sans', join(FONTS_DIR, 'Inter-SemiBold.ttf'), 600),
    cachedFace('AE Sans', join(FONTS_DIR, 'Inter-Bold.ttf'), 700),
    ...(/\p{Script=Bengali}/u.test(content)
      ? [cachedFace('AE Bengali', join(FONTS_DIR, 'NotoSansBengali-Regular.ttf'), 400)]
      : []),
    ...(/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{27BF}\u{FE0F}\u{20E3}]/u.test(content)
      ? [cachedFace('AE Emoji', VENDOR_EMOJI, 400)]
      : []),
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
${FONT_FACES_FOR(html)}
html, body { margin: 0; padding: 0; overflow: hidden; }
html, body { font-family: 'AE Sans', 'AE Bengali', 'AE Emoji' !important; font-size: 16px; }
</style>
<script>${tailwind}</script>
</head><body>${renderRawNode(tree, 'r')}<div class="hidden" id="tw-probe"></div></body></html>`;
}
