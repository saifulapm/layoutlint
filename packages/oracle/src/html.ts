import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CorpusCase, Style, TreeNode } from '@agent-eyes/core';

export const FONTS_DIR = join(import.meta.dir, '../../../fonts');

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
${fontFace('AE Sans', 'Inter-Regular.ttf', 400)}
${fontFace('AE Sans', 'Inter-Bold.ttf', 700)}
${fontFace('AE Bengali', 'NotoSansBengali-Regular.ttf', 400)}
html,body{margin:0;padding:0;overflow:hidden;}
body{font-family:'AE Sans','AE Bengali';font-size:16px;}
</style>
</head><body>${renderNode(c.tree, 'r')}</body></html>`;
}
