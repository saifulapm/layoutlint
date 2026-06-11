import { describe, expect, test } from 'bun:test';
import { PALETTE, parseSource, resolveVisualTree } from '@layoutlint/core';

const at = (html: string, viewport = 375) => resolveVisualTree(parseSource(html), { viewport });

describe('resolveVisualTree', () => {
  test('bg color resolves to the Chrome-extracted palette', () => {
    const v = at('<div className="bg-blue-600"><span>x</span></div>');
    expect(v.get('r')!.background).toBe(PALETTE['blue-600']);
  });

  test('text color inherits down to the text leaf', () => {
    const v = at('<div className="text-white"><p><span>hello</span></p></div>');
    expect(v.get('r')!.textColor).toBe('#ffffff');
    for (const [, s] of v) expect(s.textColor).toBe('#ffffff');
  });

  test('alpha suffix becomes 8-digit hex', () => {
    const v = at('<div className="bg-black/50">x</div>');
    expect(v.get('r')!.background).toBe('#00000080');
  });

  test('rounded scale: 2xl = 16 all corners; t-lg = top corners only', () => {
    const v = at('<div className="rounded-2xl"><div className="rounded-t-lg">x</div></div>');
    expect(v.get('r')!.radius).toEqual({ tl: 16, tr: 16, br: 16, bl: 16 });
    expect(v.get('r.0')!.radius).toEqual({ tl: 8, tr: 8, br: 0, bl: 0 });
  });

  test('responsive prefix activates by viewport', () => {
    const html = '<div className="bg-blue-600 md:bg-red-500">x</div>';
    expect(at(html, 375).get('r')!.background).toBe(PALETTE['blue-600']);
    expect(at(html, 768).get('r')!.background).toBe(PALETTE['red-500']);
  });

  test('border color defaults to currentColor (inherited text color)', () => {
    const v = at('<div className="text-emerald-700"><div className="border">x</div></div>');
    expect(v.get('r.0')!.borderColor).toBe(PALETTE['emerald-700']);
    const w = at('<div className="border-gray-200 text-black">x</div>');
    expect(w.get('r')!.borderColor).toBe(PALETTE['gray-200']);
  });

  test('text-center inherits; text size classes do not disturb color', () => {
    const v = at('<div className="text-center text-sm text-gray-500"><p>one</p><p>two</p></div>');
    expect(v.get('r')!.textAlign).toBe('center');
    expect(v.get('r')!.textColor).toBe(PALETTE['gray-500']);
    expect(v.get('r.0')!.textAlign).toBe('center');
    expect(v.get('r.1')!.textColor).toBe(PALETTE['gray-500']);
  });

  test('img nodes are flagged', () => {
    const v = at('<div><img className="h-12 w-12" /></div>');
    expect(v.get('r.0')!.isImg).toBe(true);
  });
});
