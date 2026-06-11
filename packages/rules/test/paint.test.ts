import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { Parser } from 'htmlparser2';
import {
  computeLayout,
  PALETTE,
  paintSVG,
  parseSource,
  resolveTree,
  resolveVisualTree,
} from '@layoutlint/core';
import { defaultFonts } from '../src/check';

const fonts = defaultFonts();

function paint(source: string, viewport = 375): string {
  const raw = parseSource(source);
  const { tree } = resolveTree(raw, { viewport });
  const boxes = computeLayout(tree, viewport, fonts);
  const visuals = resolveVisualTree(raw, { viewport });
  return paintSVG(tree, boxes, visuals, fonts, { width: viewport });
}

/** Throws on malformed XML-ish structure (unclosed tags). */
function assertParses(svg: string): void {
  let depth = 0;
  let error: string | undefined;
  const p = new Parser({
    onopentag: () => depth++,
    onclosetag: () => depth--,
    onerror: (e) => (error = String(e)),
  }, { xmlMode: true });
  p.write(svg);
  p.end();
  expect(error).toBeUndefined();
  expect(depth).toBe(0);
}

describe('paintSVG', () => {
  test('demo Card paints: canvas, border, text outlines, no clip', () => {
    const svg = paint(readFileSync(new URL('../../../demo/Card.tsx', import.meta.url), 'utf8'));
    assertParses(svg);
    expect(svg).toContain('fill="#ffffff"');
    expect(svg).toContain(`fill="${PALETTE['gray-200']}"`); // card border
    expect(svg).toContain(`fill="${PALETTE['gray-100']}"`); // avatar bg-gray-100
    expect(svg).toMatch(/<g fill="#000000"><path d=/); // text as outlines
    expect(svg).not.toContain('clipPath');
  });

  test('rounded + bg + overflow-hidden produces one clip and the palette fill', () => {
    const svg = paint('<div className="rounded-xl bg-blue-600 overflow-hidden p-4"><p className="text-white">Save</p></div>');
    assertParses(svg);
    expect((svg.match(/<clipPath/g) ?? []).length).toBe(1);
    expect(svg).toContain(`fill="${PALETTE['blue-600']}"`);
    expect(svg).toMatch(/<g fill="#ffffff">/); // white text
    expect(svg).toContain('A12 12'); // xl radius arcs
  });

  test('display:none subtree paints nothing', () => {
    const svg = paint('<div><p className="hidden bg-red-500">gone</p><p>kept</p></div>');
    assertParses(svg);
    expect(svg).not.toContain(PALETTE['red-500']);
  });
});
