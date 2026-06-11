/**
 * Screenshot oracle: renders every Tailwind corpus case (plus the demo Card)
 * in pinned headless Chromium and saves a content-cropped PNG per case to
 * screenshots/. The paint comparator (paint-compare.ts) pixel-diffs the
 * engine's own render against these.
 *
 * Usage: bun run packages/oracle/src/screenshot.ts
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { tailwindCases } from '../../../corpora/tailwind-cases';
import { renderTailwindCaseHtml } from './html';

export const SCREENSHOT_DIR = join(import.meta.dir, '../../../screenshots');

const demoCard = readFileSync(join(import.meta.dir, '../../../demo/Card.tsx'), 'utf8');
const allCases = [
  ...tailwindCases.map((c) => ({ name: c.name, viewport: c.viewport, html: c.html })),
  { name: 'demo-card', viewport: 375, html: demoCard },
];

if (import.meta.main) {
  const browser = await chromium.launch({
    args: ['--font-render-hinting=none', '--force-color-profile=srgb'],
  });
  mkdirSync(SCREENSHOT_DIR, { recursive: true });

  for (const c of allCases) {
    const page = await browser.newPage({
      viewport: { width: c.viewport, height: 2000 },
      deviceScaleFactor: 1,
    });
    await page.setContent(renderTailwindCaseHtml(c.html), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => {
      const probe = document.getElementById('tw-probe');
      return !probe || getComputedStyle(probe).display === 'none';
    });
    const height = await page.evaluate(() => {
      const root = document.querySelector('[data-aeid="r"]')!;
      return Math.ceil(root.getBoundingClientRect().height);
    });
    const png = await page.screenshot({
      clip: { x: 0, y: 0, width: c.viewport, height: Math.max(height, 1) },
    });
    await page.close();
    writeFileSync(join(SCREENSHOT_DIR, `${c.name}.png`), png);
    console.log(`screenshot: ${c.name} (${c.viewport}×${height})`);
  }
  await browser.close();
}

export { allCases as paintCases };
