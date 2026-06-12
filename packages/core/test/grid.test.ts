/**
 * Engine-level grid tests — hand-derived boxes through the public
 * computeLayout API (the corpus validates vs Chromium; these pin fast
 * regressions and cases the corpus doesn't carry).
 */
import { describe, expect, test } from 'bun:test';
import { join } from 'node:path';
import { FontStore } from '../src/fonts';
import { computeLayout } from '../src/layout';
import type { Box, TreeNode } from '../src/types';

const FONTS = join(import.meta.dir, '../../rules/fonts');
const fonts = new FontStore([
  { family: 'AE Sans', path: join(FONTS, 'Inter-Regular.ttf'), weight: 400 },
]);

const FR = { min: 0, max: '1fr' } as const;
const byPath = (boxes: Box[]) => Object.fromEntries(boxes.map((b) => [b.path, b]));

describe('grid islands (engine)', () => {
  test('tracks, gap and padding: 3 cols in 600px', () => {
    const tree: TreeNode = {
      style: { display: 'grid', gridTemplateColumns: [FR, FR, FR], gap: 16, padding: 16 },
      children: [{ style: { height: 40 } }, { style: { height: 40 } }, { style: { height: 40 } }],
    };
    const b = byPath(computeLayout(tree, 600, fonts));
    expect(b['r'].width).toBe(600); // block-level grid root stretches
    expect(b['r.0'].x).toBeCloseTo(16, 1);
    expect(b['r.0'].width).toBeCloseTo((600 - 32 - 32) / 3, 1);
    expect(b['r.1'].x).toBeCloseTo(16 + 536 / 3 + 16, 1);
    expect(b['r.2'].height).toBe(40);
  });

  test('items without height stretch to their row', () => {
    const tree: TreeNode = {
      style: { display: 'grid', gridTemplateColumns: [FR, FR], gridTemplateRows: [60] },
      children: [{ style: {} }, { style: { gridRow: { span: 1 } } }],
    };
    const b = byPath(computeLayout(tree, 400, fonts));
    expect(b['r.0'].height).toBe(60);
    expect(b['r.0'].y).toBe(0); // stretch, not centered (auto-margin regression)
    expect(b['r.1'].height).toBe(60);
  });

  test('grid inside a flex row takes the grown width', () => {
    const tree: TreeNode = {
      style: { flexDirection: 'row', gap: 10 },
      children: [
        { style: { width: 100, height: 50 } },
        {
          style: { display: 'grid', gridTemplateColumns: [FR, FR], gap: 10, flexGrow: 1 },
          children: [{ style: { height: 30 } }, { style: { height: 30 } }],
        },
      ],
    };
    const b = byPath(computeLayout(tree, 510, fonts));
    expect(b['r.1'].x).toBe(110);
    expect(b['r.1'].width).toBe(400);
    expect(b['r.1.0'].x).toBe(110); // absolute coords: container x + island offset
    expect(b['r.1.0'].width).toBeCloseTo(195, 1);
    expect(b['r.1.1'].x).toBeCloseTo(315, 1);
  });

  test('display:none grid child emits zero boxes and takes no cell', () => {
    const tree: TreeNode = {
      style: { display: 'grid', gridTemplateColumns: [FR, FR] },
      children: [
        { style: { height: 40 } },
        { style: { display: 'none' }, children: [{ style: { height: 99 } }] },
        { style: { height: 40 } },
      ],
    };
    const b = byPath(computeLayout(tree, 400, fonts));
    expect(b['r.1']).toMatchObject({ x: 0, y: 0, width: 0, height: 0 });
    expect(b['r.1.0']).toMatchObject({ width: 0, height: 0 });
    // the hidden child is skipped in auto-placement: third child sits in col 2 row 1
    expect(b['r.2'].x).toBe(200);
    expect(b['r.2'].y).toBe(0);
  });

  test('grid item interiors lay out at the stretched size', () => {
    // a flex column with a grow child inside a fixed 100px row must
    // distribute the stretched height, not its natural height
    const tree: TreeNode = {
      style: { display: 'grid', gridTemplateColumns: [FR], gridTemplateRows: [100] },
      children: [
        {
          style: { flexDirection: 'column' },
          children: [{ style: { height: 20 } }, { style: { flexGrow: 1 } }],
        },
      ],
    };
    const b = byPath(computeLayout(tree, 300, fonts));
    expect(b['r.0'].height).toBe(100);
    expect(b['r.0.1'].height).toBe(80); // grow fills the patched height
  });

  test('text directly in a grid cell measures and stretches like Chrome', () => {
    const tree: TreeNode = {
      style: { display: 'grid', gridTemplateColumns: [FR, FR], gap: 8 },
      children: [
        { text: 'a few wrapping words here', style: { fontSize: 14, lineHeight: 20 } },
        { style: { height: 60 } },
      ],
    };
    const b = byPath(computeLayout(tree, 320, fonts));
    expect(b['r.0'].width).toBeCloseTo(156, 1); // stretches to its track
    expect(b['r.0'].height).toBe(60); // stretches to the row (sized by the 60px sibling)
  });
});
