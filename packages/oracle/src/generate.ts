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
import { renderCaseHtml } from './html';
import { GOLDEN_DIR, type GoldenFile, type GoldenRect } from './golden';

const round = (n: number) => Math.round(n * 100) / 100;

// Without this flag, headless Linux Chromium grid-fits glyph advances to
// whole pixels (FreeType full hinting), diverging from both fontkit's linear
// metrics and from Chrome on macOS/Windows, which use subpixel positioning.
const browser = await chromium.launch({ args: ['--font-render-hinting=none'] });
const version = browser.version();
mkdirSync(GOLDEN_DIR, { recursive: true });

for (const c of cases) {
  const page = await browser.newPage({
    viewport: { width: c.viewport, height: 2000 },
    deviceScaleFactor: 1,
  });
  await page.setContent(renderCaseHtml(c), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
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
