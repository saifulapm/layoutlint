/**
 * Spike: pin down every taffy-layout@2.0.3 API fact the grid-island design
 * relies on (Task 1 of the grid plan), so surprises surface here — not in
 * the engine integration.
 *
 * Verified facts are summarized at the bottom of the file; grid.ts codes
 * against THIS file's observations.
 */
import { describe, expect, test } from 'bun:test';
import {
  type AvailableSpace,
  GridAutoFlow,
  loadTaffy,
  type MeasureFunction,
  type Size,
  Style,
  TaffyTree,
  type TrackSizingFunction,
} from 'taffy-layout';

await loadTaffy();

const track = (min: TrackSizingFunction['min'], max: TrackSizingFunction['max']) => ({ min, max });
const px = (n: number) => track(n, n);

/** Build a grid container with `cols` tracks and children; returns rects. */
function gridLayout(opts: {
  width: number;
  cols: TrackSizingFunction[];
  rows?: TrackSizingFunction[];
  autoRows?: TrackSizingFunction[];
  autoCols?: TrackSizingFunction[];
  flow?: GridAutoFlow;
  gap?: number;
  children: Style[];
  fractional?: boolean;
}) {
  const tree = new TaffyTree();
  if (opts.fractional) tree.disableRounding();
  const container = new Style();
  container.display = 2; // Display.Grid
  container.gridTemplateColumns = opts.cols;
  if (opts.rows) container.gridTemplateRows = opts.rows;
  if (opts.autoRows) container.gridAutoRows = opts.autoRows;
  if (opts.autoCols) container.gridAutoColumns = opts.autoCols;
  if (opts.flow !== undefined) container.gridAutoFlow = opts.flow;
  if (opts.gap !== undefined) container.gap = { width: opts.gap, height: opts.gap };
  container.size = { width: opts.width, height: 'auto' };
  const kids = opts.children.map((s) => tree.newLeaf(s));
  const root = tree.newWithChildren(container, kids);
  tree.computeLayout(root, { width: opts.width, height: 'max-content' });
  const rects = kids.map((k) => {
    const l = tree.getLayout(k);
    return { x: l.x, y: l.y, width: l.width, height: l.height };
  });
  const rootLayout = tree.getLayout(root);
  const rootRect = { width: rootLayout.width, height: rootLayout.height };
  tree.free();
  return { rects, rootRect };
}

const leaf = (style?: Partial<{ width: number; height: number }>): Style => {
  const s = new Style();
  s.size = { width: style?.width ?? 'auto', height: style?.height ?? 50 };
  return s;
};

describe('taffy-layout spike', () => {
  test('fr tracks: [100px, 1fr, 2fr] in 400px → 100/100/200', () => {
    const { rects } = gridLayout({
      width: 400,
      cols: [px(100), track('auto', '1fr'), track('auto', '2fr')],
      children: [leaf(), leaf(), leaf()],
    });
    expect(rects[0]).toMatchObject({ x: 0, width: 100 });
    expect(rects[1]).toMatchObject({ x: 100, width: 100 });
    expect(rects[2]).toMatchObject({ x: 200, width: 200 });
  });

  test('minmax(0,1fr) vs 1fr differ under min-content pressure', () => {
    // 300px container, 2 equal-fr columns, col 1 holds a fixed 250px child.
    // 1fr (= minmax(auto,1fr)): col 1 floors at 250 → 250/50.
    // NOTE (spike finding): getLayout returns ITEM rects, not track rects.
    // A fixed-width item does not stretch to its track; an auto-width item
    // does (align/justify stretch default) — so the auto item's rect IS the
    // track. Read track geometry off auto-width items.
    const oneFr = gridLayout({
      width: 300,
      cols: [track('auto', '1fr'), track('auto', '1fr')],
      children: [leaf({ width: 250 }), leaf()],
    });
    expect(oneFr.rects[0].width).toBe(250);
    expect(oneFr.rects[1].x).toBe(250);
    expect(oneFr.rects[1].width).toBeCloseTo(50, 1);
    // minmax(0,1fr) (what Tailwind grid-cols-N emits): no floor → 150/150,
    // the wide child overflows its track.
    const minmax0 = gridLayout({
      width: 300,
      cols: [track(0, '1fr'), track(0, '1fr')],
      children: [leaf({ width: 250 }), leaf()],
    });
    expect(minmax0.rects[1].x).toBe(150);
    expect(minmax0.rects[1].width).toBe(150);
    expect(minmax0.rects[0].width).toBe(250); // item keeps its size, overflowing the 150px track
  });

  test('span + explicit placement (incl. negative end line)', () => {
    // 3×100px cols, gap 10 → container content 320.
    const mk = (gridColumn: Style['gridColumn']) => {
      const s = leaf();
      s.gridColumn = gridColumn;
      return s;
    };
    const { rects } = gridLayout({
      width: 320,
      cols: [px(100), px(100), px(100)],
      gap: 10,
      children: [
        mk({ start: { span: 2 }, end: 'auto' }), // grid-column: span 2
        mk({ start: 2, end: 4 }), // grid-column: 2 / 4
        mk({ start: 1, end: -1 }), // grid-column: 1 / -1 (full)
      ],
    });
    expect(rects[0]).toMatchObject({ x: 0, y: 0, width: 210 }); // 100+10+100
    expect(rects[1]).toMatchObject({ x: 110, width: 210 });
    expect(rects[2]).toMatchObject({ x: 0, width: 320 });
  });

  test('auto-flow column fills rows top-down, adds implicit columns', () => {
    const { rects } = gridLayout({
      width: 400,
      cols: [px(80)],
      rows: [px(100), px(100)],
      autoCols: [px(80)],
      flow: GridAutoFlow.Column,
      children: [leaf(), leaf(), leaf(), leaf()],
    });
    expect(rects[0]).toMatchObject({ x: 0, y: 0 });
    expect(rects[1]).toMatchObject({ x: 0, y: 100 });
    expect(rects[2]).toMatchObject({ x: 80, y: 0 });
    expect(rects[3]).toMatchObject({ x: 80, y: 100 });
  });

  test('dense backfills holes that sparse flow skips', () => {
    // 3×100 cols; A pinned at col 2 spanning 2 (occupies r1c2-c3);
    // B spans 2 → doesn't fit r1 → r2c1-c2; C (auto 1col):
    // sparse cursor sits past B → r2c3; dense backfills r1c1.
    const children = () => {
      const a = leaf();
      a.gridColumn = { start: 2, end: { span: 2 } };
      const b = leaf();
      b.gridColumn = { start: { span: 2 }, end: 'auto' };
      const c = leaf();
      return [a, b, c];
    };
    const sparse = gridLayout({
      width: 300,
      cols: [px(100), px(100), px(100)],
      autoRows: [px(50)],
      flow: GridAutoFlow.Row,
      children: children(),
    });
    expect(sparse.rects[2]).toMatchObject({ x: 200, y: 50 });
    const dense = gridLayout({
      width: 300,
      cols: [px(100), px(100), px(100)],
      autoRows: [px(50)],
      flow: GridAutoFlow.RowDense,
      children: children(),
    });
    expect(dense.rects[2]).toMatchObject({ x: 0, y: 0 });
  });

  test('percentage values are FRACTIONS (CSS 25% = "0.25%"), resolved against content width', () => {
    // SPIKE FINDING: the binding passes the number raw into Taffy's
    // Percent(f32) fraction — '25%' means scale ×25, NOT 25 percent.
    // The Style→Taffy mapper must divide CSS percentages by 100.
    const { rects } = gridLayout({
      width: 400,
      cols: [track('0.25%', '0.25%'), track('0.75%', '0.75%')],
      gap: 20,
      children: [leaf(), leaf()],
    });
    expect(rects[0].width).toBe(100);
    expect(rects[1].x).toBe(120); // 100 + 20 gap (percentages ignore gap, like CSS)
    expect(rects[1].width).toBe(300);
  });

  test('measure callback: auto track sizes to measured content', () => {
    const tree = new TaffyTree();
    const container = new Style();
    container.display = 2; // Display.Grid
    container.gridTemplateColumns = [track(0, '1fr'), track('auto', 'auto')];
    container.size = { width: 400, height: 'auto' };
    const filler = new Style();
    filler.size = { width: 'auto', height: 50 };
    const measured = new Style();
    measured.size = { width: 'auto', height: 'auto' };
    const a = tree.newLeaf(filler);
    const b = tree.newLeafWithContext(measured, { kind: 'text' });
    const root = tree.newWithChildren(container, [a, b]);

    const calls: Array<{ known: Size<number | undefined>; avail: Size<AvailableSpace> }> = [];
    const measure: MeasureFunction = (known, avail, _node, context) => {
      if (context?.kind !== 'text') return { width: known.width ?? 0, height: known.height ?? 0 };
      calls.push({ known, avail });
      // behave like single-line text: 123px wide, 40px tall, regardless of
      // constraint (clamped to definite available width like our measureFunc)
      const natural = 123;
      const w =
        known.width ??
        (avail.width === 'min-content' || avail.width === 'max-content'
          ? natural
          : Math.min(natural, avail.width));
      return { width: w, height: known.height ?? 40 };
    };
    tree.computeLayoutWithMeasure(root, { width: 400, height: 'max-content' }, measure);

    const lb = tree.getLayout(b);
    expect(lb.width).toBe(123); // auto track took the measured size
    // measured 40 but stretched to the 50px row (align-items stretch default)
    expect(lb.height).toBe(50);
    const la = tree.getLayout(a);
    expect(la.width).toBe(277); // fr track absorbs the rest
    // Document the constraint shapes taffy actually sends (grid.ts relies on
    // min-content/max-content requests reaching the callback):
    expect(calls.length).toBeGreaterThan(0);
    const modes = new Set(calls.map((c) => `${c.avail.width}`));
    // eslint-disable-next-line no-console
    console.log('[spike] measure availableSpace.width values seen:', [...modes]);
    expect([...modes].some((m) => m === 'min-content' || m === 'max-content')).toBe(true);
    tree.free();
  });

  test('fractional output: disableRounding yields sub-pixel track sizes', () => {
    const { rects } = gridLayout({
      width: 400,
      cols: [track(0, '1fr'), track(0, '1fr'), track(0, '1fr')],
      children: [leaf(), leaf(), leaf()],
      fractional: true,
    });
    expect(Math.abs(rects[0].width - 400 / 3)).toBeLessThan(0.01);
    expect(Math.abs(rects[2].x - 800 / 3)).toBeLessThan(0.01);
    // and the default (rounding ON) would have given integers — document:
    const rounded = gridLayout({
      width: 400,
      cols: [track(0, '1fr'), track(0, '1fr'), track(0, '1fr')],
      children: [leaf(), leaf(), leaf()],
    });
    console.log('[spike] default rounding gives widths:', rounded.rects.map((r) => r.width));
  });

  test('perf: 1000-leaf grid (10 cols × 100 rows) computes within budget', () => {
    const tree = new TaffyTree();
    const container = new Style();
    container.display = 2; // Display.Grid
    container.gridTemplateColumns = Array.from({ length: 10 }, () => track(0, '1fr'));
    container.size = { width: 1000, height: 'auto' };
    const kids: bigint[] = [];
    for (let i = 0; i < 1000; i++) {
      const s = new Style();
      s.size = { width: 'auto', height: 20 + (i % 7) };
      kids.push(tree.newLeaf(s));
    }
    const root = tree.newWithChildren(container, kids);
    const t0 = performance.now();
    tree.computeLayout(root, { width: 1000, height: 'max-content' });
    const ms = performance.now() - t0;
    tree.free();
    console.log(`[spike] 1000-leaf grid computeLayout: ${ms.toFixed(1)}ms`);
    // Plan gate: >100ms for 1k nodes = stop and re-decide the binding.
    expect(ms).toBeLessThan(100);
  });
});

/**
 * SPIKE FINDINGS (grid.ts must honor all of these):
 *
 * 1. Percentages are raw fractions: Taffy's Percent(f32) — CSS `25%` must be
 *    emitted as the string '0.25%'. The mapper divides by 100.
 * 2. Rounding is ON by default (integer rects). Call tree.disableRounding()
 *    — goldens are fractional (Chrome getBoundingClientRect).
 * 3. getLayout() returns ITEM rects (x/y/width/height getters on a wasm
 *    wrapper). Fixed-size items don't fill their track; auto-size items
 *    stretch (align/justify-items stretch default), matching CSS.
 * 4. Measure callbacks fire with availableSpace.width ∈ {min-content,
 *    max-content, <definite px>} — all three reach the callback, and
 *    knownDimensions short-circuits stretched axes. One MeasureFunction
 *    serves the whole tree (passed to computeLayoutWithMeasure); dispatch
 *    per node via newLeafWithContext context.
 * 5. Track sizing fns are {min, max} objects; `1fr` ≡ minmax(auto,1fr) is
 *    {min:'auto', max:'1fr'}; Tailwind's minmax(0,1fr) is {min:0, max:'1fr'}.
 *    Placement: gridColumn/gridRow take {start, end} Lines where each side is
 *    'auto' | <line number (negatives ok)> | {span: n}.
 * 6. Display enum: Block=0 is the DEFAULT (not flex) — containers must set
 *    Display.Grid (2) explicitly; item leaves keep Block (irrelevant — they
 *    are measured leaves).
 * 7. Perf: 1000-leaf 10-col grid computes in ~4-7ms under bun (Yoga-class;
 *    the PR #394 boundary-overhead concern does not reproduce here).
 * 8. Cleanup: TaffyTree/Style are wasm objects with .free(); trees must be
 *    freed after use (Style instances are consumed by the tree).
 */
