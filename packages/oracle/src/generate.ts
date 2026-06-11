/**
 * Golden-file generator: renders every corpus case as real HTML in headless
 * Chromium and dumps getBoundingClientRect for every node into golden/.
 *
 * Usage: bun run packages/oracle/src/generate.ts
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { cases } from '../../../corpora/cases';
import { generatedCases } from '../../../corpora/generated';
import { tailwindCases } from '../../../corpora/tailwind-cases';
import { renderCaseHtml, renderTailwindCaseHtml } from './html';
import { GOLDEN_DIR, ORACLE_VIEWPORT_HEIGHT, type GoldenFile, type GoldenRect } from './golden';

const round = (n: number) => Math.round(n * 100) / 100;

// Without this flag, headless Linux Chromium grid-fits glyph advances to
// whole pixels (FreeType full hinting), diverging from both fontkit's linear
// metrics and from Chrome on macOS/Windows, which use subpixel positioning.
const LAUNCH_ARGS = ['--font-render-hinting=none'];

// Chromium's memory grows across hundreds of setContent pages and has
// OOM-killed CI runners mid-run — relaunch every N cases to bound it.
const RELAUNCH_EVERY = 50;

let browser = await chromium.launch({ args: LAUNCH_ARGS });
const version = browser.version();
let pagesServed = 0;
mkdirSync(GOLDEN_DIR, { recursive: true });

const allCases = [
  ...cases.map((c) => ({ name: c.name, viewport: c.viewport, html: renderCaseHtml(c) })),
  ...generatedCases.map((c) => ({ name: c.name, viewport: c.viewport, html: renderCaseHtml(c) })),
  ...tailwindCases.map((c) => ({ name: c.name, viewport: c.viewport, html: renderTailwindCaseHtml(c.html) })),
];

for (const c of allCases) {
  if (pagesServed > 0 && pagesServed % RELAUNCH_EVERY === 0) {
    await browser.close();
    browser = await chromium.launch({ args: LAUNCH_ARGS });
  }
  pagesServed++;
  const page = await browser.newPage({
    viewport: { width: c.viewport, height: ORACLE_VIEWPORT_HEIGHT },
    deviceScaleFactor: 1,
  });
  await page.setContent(c.html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  // Tailwind browser-build compilation has applied once the probe is display:none
  await page.waitForFunction(() => {
    const probe = document.getElementById('tw-probe');
    return !probe || getComputedStyle(probe).display === 'none';
  });
  const rects = await page.evaluate(() => {
    const out: Record<string, { x: number; y: number; width: number; height: number }> = {};
    for (const el of document.querySelectorAll('[data-aeid]')) {
      const r = el.getBoundingClientRect();
      out[(el as HTMLElement).dataset.aeid!] = {
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
      };
    }
    return out;
  });
  await page.close();

  for (const r of Object.values(rects)) {
    r.x = round(r.x);
    r.y = round(r.y);
    r.width = round(r.width);
    r.height = round(r.height);
  }

  const golden: GoldenFile = {
    name: c.name,
    viewport: c.viewport,
    chromium: version,
    generatedAt: new Date().toISOString(),
    rects: rects as Record<string, GoldenRect>,
  };
  writeFileSync(join(GOLDEN_DIR, `${c.name}.json`), JSON.stringify(golden, null, 2) + '\n');
  console.log(`golden: ${c.name} (${Object.keys(rects).length} nodes)`);
}

await browser.close();
