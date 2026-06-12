import { describe, expect, test } from 'bun:test';
import type { Style } from '@layoutlint/core';
import { styleToCss } from '../src/html';

describe('styleToCss grid serialization', () => {
  test('flex-only styles serialize byte-identically to the pre-grid form', () => {
    const s: Style = { flexDirection: 'row', gap: 8, width: 200, padding: 12 };
    expect(styleToCss(s, false)).toBe(
      'box-sizing:border-box;display:flex;flex-direction:row;gap:8px;width:200px;padding:12px',
    );
    // explicit display values still flow through the generic loop (cascade)
    expect(styleToCss({ display: 'none' }, false)).toBe(
      'box-sizing:border-box;display:flex;display:none',
    );
    expect(styleToCss({ fontSize: 14, lineHeight: 20 }, true)).toBe(
      'box-sizing:border-box;display:block;font-size:14px;line-height:20px',
    );
  });

  test('display:grid replaces the base flex decl', () => {
    expect(styleToCss({ display: 'grid' }, false)).toBe('box-sizing:border-box;display:grid');
  });

  test('track lists: px, fr, percent, keywords, minmax', () => {
    const s: Style = {
      display: 'grid',
      gridTemplateColumns: [100, '1fr', '25%', 'auto', { min: 0, max: '1fr' }],
      gridTemplateRows: [{ min: 'min-content', max: 'max-content' }, 50],
    };
    expect(styleToCss(s, false)).toBe(
      'box-sizing:border-box;display:grid;' +
        'grid-template-columns:100px 1fr 25% auto minmax(0px,1fr);' +
        'grid-template-rows:minmax(min-content,max-content) 50px',
    );
  });

  test('auto tracks and flow', () => {
    const s: Style = {
      display: 'grid',
      gridAutoFlow: 'column dense',
      gridAutoColumns: { min: 0, max: '1fr' },
      gridAutoRows: 'min-content',
    };
    expect(styleToCss(s, false)).toBe(
      'box-sizing:border-box;display:grid;grid-auto-flow:column dense;' +
        'grid-auto-columns:minmax(0px,1fr);grid-auto-rows:min-content',
    );
  });

  test('placements: span only, start+span, start+end, negative end', () => {
    expect(styleToCss({ gridColumn: { span: 2 } }, false)).toContain('grid-column:auto / span 2');
    expect(styleToCss({ gridColumn: { start: 2, span: 2 } }, false)).toContain(
      'grid-column:2 / span 2',
    );
    expect(styleToCss({ gridColumn: { start: 2, end: 4 } }, false)).toContain('grid-column:2 / 4');
    expect(styleToCss({ gridRow: { start: 1, end: -1 } }, false)).toContain('grid-row:1 / -1');
    // span with explicit end: span goes on the start side
    expect(styleToCss({ gridRow: { span: 2, end: 4 } }, false)).toContain('grid-row:span 2 / 4');
  });

  test('grid item alignment falls through the generic loop', () => {
    expect(styleToCss({ justifySelf: 'center', justifyItems: 'stretch' }, false)).toBe(
      'box-sizing:border-box;display:flex;justify-self:center;justify-items:stretch',
    );
  });
});
