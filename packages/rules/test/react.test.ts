import { describe, expect, test } from 'bun:test';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { componentToHtml, isComponentModule } from '../src/react';

const ROOT = join(import.meta.dir, '../../..');
const CORPUS = join(ROOT, 'corpora/react');
const FIXTURES = join(import.meta.dir, 'fixtures');

const tmpFilesIn = (dir: string) => readdirSync(dir).filter((f) => f.startsWith('.layoutlint-'));

describe('isComponentModule', () => {
  test('tsx with module syntax → execute', () => {
    expect(isComponentModule('Card.tsx', "import { useState } from 'react';\nexport default function C() {}")).toBe(true);
    expect(isComponentModule('Card.jsx', 'export function C() {}')).toBe(true);
  });
  test('raw fragments and non-jsx files → static', () => {
    expect(isComponentModule('frag.tsx', '<div className="flex p-4">hi</div>')).toBe(false);
    expect(isComponentModule('page.html', "import x from 'y'; <div/>")).toBe(false);
  });
});

describe('componentToHtml', () => {
  test('props round-trip through a real component', async () => {
    const html = await componentToHtml(join(CORPUS, 'pricing-props.tsx'), {
      props: { plans: [{ name: 'UniquePlanName', price: '$7', blurb: 'b' }] },
    });
    expect(html).toContain('UniquePlanName');
    expect(html).toContain('Billed monthly'); // useState initial value rendered
  });

  test('named export selection', async () => {
    const html = await componentToHtml(join(CORPUS, 'named-exports.tsx'), { component: 'Footer' });
    expect(html).toContain('Acme Inc.');
    expect(html).not.toContain('Menu');
  });

  test('ambiguous exports without a pick → error listing exports', async () => {
    await expect(componentToHtml(join(CORPUS, 'named-exports.tsx'))).rejects.toThrow(/cannot determine which component/);
  });

  test('unknown export name → error', async () => {
    await expect(componentToHtml(join(CORPUS, 'named-exports.tsx'), { component: 'Nope' })).rejects.toThrow(/no export named "Nope"/);
  });

  test('memo-wrapped default export renders', async () => {
    const html = await componentToHtml(join(CORPUS, 'memo-card.tsx'));
    expect(html).toContain('Memoized');
  });

  test('null render → actionable error', async () => {
    await expect(componentToHtml(join(FIXTURES, 'empty.tsx'))).rejects.toThrow(/rendered nothing/);
  });

  test('temp bundle cleaned up on success and on throw', async () => {
    await componentToHtml(join(CORPUS, 'multi-file.tsx'));
    expect(tmpFilesIn(CORPUS)).toEqual([]);
    await expect(componentToHtml(join(FIXTURES, 'throws.tsx'))).rejects.toThrow('boom');
    expect(tmpFilesIn(FIXTURES)).toEqual([]);
  });
});
