import { describe, expect, test } from 'bun:test';
import { defaultFonts } from '../src/check';

const store = defaultFonts();

/** Final pen advance of the last run = sum of advances (glyph x is pen-relative). */
function totalAdvance(text: string, fontSize: number, weight: number, spacing = 0): number {
  // re-derive by shaping: last glyph's x + its advance isn't exposed, so
  // measure parity using a sentinel — runs' pen accumulates internally, and
  // glyphRuns of text+text starts the second copy at the total advance.
  const single = store.glyphRuns(text, fontSize, weight, spacing);
  const doubled = store.glyphRuns(text + text, fontSize, weight, spacing);
  if (single.length === 0) return 0;
  // first glyph of the doubled string's second half starts at the total advance
  const firstX = single[0].glyphs[0].x;
  const idx = single.reduce((n, r) => n + r.glyphs.length, 0);
  const all = doubled.flatMap((r) => r.glyphs);
  return all[idx].x - firstX;
}

describe('glyphRuns', () => {
  test('advance parity with measureWidth — Latin', () => {
    for (const s of ['Hello, world', 'layoutlint 2.1']) {
      expect(totalAdvance(s, 16, 400)).toBeCloseTo(store.measureWidth(s, 16, 400), 2);
    }
  });

  test('advance parity with measureWidth — Latin with letter-spacing', () => {
    const s = 'TRACKING WIDE';
    expect(totalAdvance(s, 14, 600, 0.7)).toBeCloseTo(store.measureWidth(s, 14, 600, 0.7), 2);
  });

  test('advance parity with measureWidth — Bangla', () => {
    const s = 'প্রযুক্তি খবর';
    expect(totalAdvance(s, 16, 400)).toBeCloseTo(store.measureWidth(s, 16, 400), 2);
  });

  test('glyphs carry real glyph ids and a usable font', () => {
    const runs = store.glyphRuns('Ag', 16, 400);
    expect(runs.length).toBe(1);
    expect(runs[0].glyphs.length).toBeGreaterThanOrEqual(2);
    const g = runs[0].font.getGlyph(runs[0].glyphs[0].glyphId);
    expect(g.path.toSVG().length).toBeGreaterThan(10);
  });

  test('lineMetrics returns positive ascent/descent around the baseline', () => {
    const m = store.lineMetrics(16, 400);
    expect(m.ascent).toBeGreaterThan(10);
    expect(m.descent).toBeGreaterThan(2);
    expect(m.ascent + m.descent).toBeGreaterThan(16 * 0.9);
  });
});
