import { describe, expect, test } from 'bun:test';
import { check } from '../src/check';
import { resolveClasses, classAffectsLayout } from '@agent-eyes/core';

describe('check()', () => {
  test('clean component passes at all viewports', async () => {
    const report = await check(`
      <div className="flex flex-col gap-2 p-4">
        <p className="text-sm">Hello there</p>
        <div className="h-10 w-full rounded bg-gray-100"></div>
      </div>`);
    expect(report.pass).toBe(true);
    expect(report.viewports).toHaveLength(4);
    expect(report.warnings).toHaveLength(0);
  });

  test('fixed widths overflowing a small viewport are caught', async () => {
    const report = await check(
      `<div className="flex gap-4 p-4">
        <div className="w-64 h-12 shrink-0"></div>
        <div className="w-64 h-12 shrink-0"></div>
      </div>`,
      { viewports: [320, 1440] },
    );
    expect(report.pass).toBe(false);
    const at320 = report.viewports.find((v) => v.viewport === 320)!;
    const at1440 = report.viewports.find((v) => v.viewport === 1440)!;
    expect(at320.violations.map((v) => v.rule)).toContain('no-overflow');
    expect(at320.violations.map((v) => v.rule)).toContain('fits-viewport');
    expect(at1440.pass).toBe(true);
  });

  test('truncation reports how many px of text are cut', async () => {
    const report = await check(
      `<p className="truncate w-24 text-sm">This sentence is far too long to fit</p>`,
      { viewports: [375] },
    );
    expect(report.pass).toBe(false);
    const v = report.viewports[0].violations.find((x) => x.rule === 'no-text-truncation')!;
    expect(v.measured.width).toBeGreaterThan(96);
    expect(v.available?.width).toBeLessThanOrEqual(96);
    expect(v.suggestion).toBeTruthy();
  });

  test('negative-margin overlap is caught', async () => {
    const report = await check(
      `<div className="flex flex-col p-4">
        <div className="h-16 w-full"></div>
        <div className="h-16 w-full -mt-8"></div>
      </div>`,
      { viewports: [375], rules: ['no-overlap'] },
    );
    expect(report.pass).toBe(false);
    expect(report.viewports[0].violations[0].rule).toBe('no-overlap');
    expect(report.viewports[0].violations[0].detail).toContain('overlaps sibling');
  });

  test('responsive classes change the verdict per viewport', async () => {
    const report = await check(
      `<div className="flex flex-col sm:flex-row gap-2 p-2">
        <div className="h-8 w-40 shrink-0"></div>
        <div className="h-8 w-40 shrink-0"></div>
        <div className="h-8 w-40 shrink-0"></div>
      </div>`,
      { viewports: [320, 1440] },
    );
    const at320 = report.viewports.find((v) => v.viewport === 320)!;
    const at1440 = report.viewports.find((v) => v.viewport === 1440)!;
    expect(at320.pass).toBe(true); // column at mobile
    expect(at1440.pass).toBe(true); // row fits at desktop
  });

  test('grid emits a warning, not a crash', async () => {
    const report = await check(`<div className="grid gap-2 p-2"><p>cell</p></div>`, {
      viewports: [375],
    });
    expect(report.warnings.some((w) => w.includes('grid'))).toBe(true);
  });

  test('min-w-0 + truncate row resolves like the browser (no false overflow)', async () => {
    const report = await check(
      `<div className="flex items-center gap-3 p-4">
        <div className="size-10 shrink-0 rounded-full"></div>
        <p className="flex-1 min-w-0 truncate text-sm">A very long single line of text that truncates</p>
        <span className="shrink-0 text-xs">now</span>
      </div>`,
      { viewports: [320], rules: ['no-overflow', 'fits-viewport'] },
    );
    expect(report.pass).toBe(true);
  });
});

describe('tailwind resolver', () => {
  test('spacing/size scale resolves to px', () => {
    const { style } = resolveClasses(['p-4', 'w-64', 'gap-2', 'mt-1.5'], { viewport: 375 });
    expect(style.padding).toBe(16);
    expect(style.width).toBe(256);
    expect(style.gap).toBe(8);
    expect(style.marginTop).toBe(6);
  });

  test('responsive prefixes apply by viewport, in cascade order', () => {
    const at320 = resolveClasses(['flex-col', 'md:flex-row'], { viewport: 320 });
    const at768 = resolveClasses(['flex-col', 'md:flex-row'], { viewport: 768 });
    expect(at320.style.flexDirection).toBe('column');
    expect(at768.style.flexDirection).toBe('row');
  });

  test('state variants never apply; colors are ignored silently', () => {
    const r = resolveClasses(['hover:w-64', 'bg-blue-500', 'text-red-600', 'border-gray-200'], {
      viewport: 1440,
    });
    expect(r.style.width).toBeUndefined();
    expect(r.warnings).toHaveLength(0);
  });

  test('classAffectsLayout separates geometry from paint', () => {
    expect(classAffectsLayout('px-2.5')).toBe(true);
    expect(classAffectsLayout('text-sm')).toBe(true);
    expect(classAffectsLayout('truncate')).toBe(true);
    expect(classAffectsLayout('text-blue-600')).toBe(false);
    expect(classAffectsLayout('font-medium')).toBe(false);
    expect(classAffectsLayout('rounded-full')).toBe(false);
  });
});
