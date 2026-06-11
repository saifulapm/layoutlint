import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeLayout, FontStore, parseSource, resolveTree } from '@layoutlint/core';
import { buildIndex, RULES } from './rules';
import { ALL_RULES, type CheckOptions, type CheckReport, type ViewportResult } from './types';

export const DEFAULT_VIEWPORTS = [320, 375, 768, 1440];

const SYSTEM_EMOJI = '/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf';
// works from src/ (dev) and dist/ (published) — fonts/ sits at the package root
const FONTS_DIR = join(dirname(fileURLToPath(import.meta.url)), '../fonts');

let defaultStore: FontStore | undefined;

/** Bundled Inter (4 weights) + Noto Sans Bengali + system color emoji when present. */
export function defaultFonts(): FontStore {
  defaultStore ??= new FontStore([
    { family: 'AE Sans', path: join(FONTS_DIR, 'Inter-Regular.ttf'), weight: 400 },
    { family: 'AE Sans', path: join(FONTS_DIR, 'Inter-Medium.ttf'), weight: 500 },
    { family: 'AE Sans', path: join(FONTS_DIR, 'Inter-SemiBold.ttf'), weight: 600 },
    { family: 'AE Sans', path: join(FONTS_DIR, 'Inter-Bold.ttf'), weight: 700 },
    { family: 'AE Bengali', path: join(FONTS_DIR, 'NotoSansBengali-Regular.ttf'), weight: 400 },
    ...(existsSync(SYSTEM_EMOJI) ? [{ family: 'Noto Color Emoji', path: SYSTEM_EMOJI, weight: 400 }] : []),
  ]);
  return defaultStore;
}

/**
 * Check a JSX/HTML + Tailwind source for layout violations across viewports.
 * Pure computation — no browser, no screenshots.
 */
export async function check(source: string, options: CheckOptions = {}): Promise<CheckReport> {
  const viewports = options.viewports ?? DEFAULT_VIEWPORTS;
  const ruleNames = options.rules ?? ALL_RULES;
  const fonts = options.fonts ? new FontStore(options.fonts) : defaultFonts();

  const raw = parseSource(source);
  const warnings = new Set<string>();
  const results: ViewportResult[] = [];

  for (const viewport of viewports) {
    const { tree, warnings: w } = resolveTree(raw, { viewport, viewportHeight: options.viewportHeight });
    for (const warning of w) warnings.add(warning);
    const boxes = computeLayout(tree, viewport, fonts);
    const ctx = buildIndex(tree, boxes, viewport, fonts);
    const violations = ruleNames.flatMap((name) => RULES[name](ctx));
    results.push({ viewport, pass: violations.length === 0, violations });
  }

  return {
    pass: results.every((r) => r.pass),
    viewports: results,
    warnings: [...warnings],
  };
}
