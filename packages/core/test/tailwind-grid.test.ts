import { describe, expect, test } from 'bun:test';
import { classAffectsLayout, resolveClasses } from '../src/tailwind';

const OPTS = { viewport: 1024, viewportHeight: 800 };
const resolve = (...classes: string[]) => resolveClasses(classes, OPTS);

const FR = { min: 0, max: '1fr' };

describe('tailwind grid class resolution', () => {
  test('grid resolves without warning; inline-grid warns but resolves', () => {
    const g = resolve('grid');
    expect(g.style.display).toBe('grid');
    expect(g.warnings).toEqual([]);
    const ig = resolve('inline-grid');
    expect(ig.style.display).toBe('grid');
    expect(ig.warnings).toHaveLength(1);
  });

  test('grid-cols-N / grid-rows-N emit repeat(N, minmax(0,1fr))', () => {
    const r = resolve('grid-cols-3', 'grid-rows-2');
    expect(r.style.gridTemplateColumns).toEqual([FR, FR, FR]);
    expect(r.style.gridTemplateRows).toEqual([FR, FR]);
    expect(r.warnings).toEqual([]);
  });

  test('grid-cols-none clears the template', () => {
    const r = resolve('grid-cols-3', 'grid-cols-none');
    expect(r.style.gridTemplateColumns).toBeUndefined();
  });

  test('spans and explicit lines merge into one placement', () => {
    expect(resolve('col-span-2').style.gridColumn).toEqual({ span: 2 });
    expect(resolve('col-span-full').style.gridColumn).toEqual({ start: 1, end: -1 });
    expect(resolve('row-span-3').style.gridRow).toEqual({ span: 3 });
    expect(resolve('col-start-2', 'col-span-2').style.gridColumn).toEqual({ start: 2, span: 2 });
    expect(resolve('col-start-2', 'col-end-4').style.gridColumn).toEqual({ start: 2, end: 4 });
    expect(resolve('row-start-1', 'row-end--1').style.gridRow).toEqual({ start: 1, end: -1 });
    expect(resolve('col-start-auto').style.gridColumn).toEqual({ start: 'auto' });
  });

  test('grid-flow-* variants', () => {
    expect(resolve('grid-flow-row').style.gridAutoFlow).toBe('row');
    expect(resolve('grid-flow-col').style.gridAutoFlow).toBe('column');
    expect(resolve('grid-flow-dense').style.gridAutoFlow).toBe('row dense');
    expect(resolve('grid-flow-row-dense').style.gridAutoFlow).toBe('row dense');
    expect(resolve('grid-flow-col-dense').style.gridAutoFlow).toBe('column dense');
  });

  test('auto-cols-* / auto-rows-*', () => {
    expect(resolve('auto-cols-auto').style.gridAutoColumns).toBe('auto');
    expect(resolve('auto-cols-min').style.gridAutoColumns).toBe('min-content');
    expect(resolve('auto-cols-max').style.gridAutoColumns).toBe('max-content');
    expect(resolve('auto-cols-fr').style.gridAutoColumns).toEqual(FR);
    expect(resolve('auto-rows-fr').style.gridAutoRows).toEqual(FR);
    expect(resolve('auto-rows-min').style.gridAutoRows).toBe('min-content');
  });

  test('justify-items / justify-self', () => {
    expect(resolve('justify-items-center').style.justifyItems).toBe('center');
    expect(resolve('justify-items-stretch').style.justifyItems).toBe('stretch');
    expect(resolve('justify-self-end').style.justifySelf).toBe('end');
    expect(resolve('justify-self-auto').style.justifySelf).toBe('auto');
  });

  test('place-* shorthands expand to both axes', () => {
    const items = resolve('place-items-center').style;
    expect(items.alignItems).toBe('center');
    expect(items.justifyItems).toBe('center');
    const start = resolve('place-items-start').style;
    expect(start.alignItems).toBe('flex-start');
    expect(start.justifyItems).toBe('start');
    const content = resolve('place-content-between').style;
    expect(content.alignContent).toBe('space-between');
    expect(content.justifyContent).toBe('space-between');
    const self = resolve('place-self-end').style;
    expect(self.alignSelf).toBe('flex-end');
    expect(self.justifySelf).toBe('end');
    // evenly: cross axis approximated, warned
    const evenly = resolve('place-content-evenly');
    expect(evenly.style.justifyContent).toBe('space-evenly');
    expect(evenly.style.alignContent).toBe('space-around');
    expect(evenly.warnings).toHaveLength(1);
  });

  test('out-of-scope grid classes warn explicitly', () => {
    expect(resolve('grid-cols-[200px_1fr]').warnings[0]).toContain('arbitrary grid track lists');
    expect(resolve('grid-cols-subgrid').warnings[0]).toContain('subgrid');
    expect(resolve('grid-rows-subgrid').warnings[0]).toContain('subgrid');
  });

  test('grid classes affect layout (parser keeps them as boxes)', () => {
    for (const cls of ['grid', 'grid-cols-2', 'col-span-2', 'row-start-1', 'justify-self-center', 'auto-rows-min', 'grid-flow-col']) {
      expect(classAffectsLayout(cls)).toBe(true);
    }
  });

  test('responsive grid classes follow the breakpoint cascade', () => {
    const at375 = resolveClasses(['grid', 'grid-cols-1', 'md:grid-cols-3'], { viewport: 375 });
    expect(at375.style.gridTemplateColumns).toEqual([FR]);
    const at1024 = resolveClasses(['grid', 'grid-cols-1', 'md:grid-cols-3'], { viewport: 1024 });
    expect(at1024.style.gridTemplateColumns).toEqual([FR, FR, FR]);
  });
});
