import { Resvg } from '@resvg/resvg-js';
import {
  computeLayout,
  FontStore,
  paintSVG,
  parseSource,
  resolveTree,
  resolveVisualTree,
  type FontFace,
} from '@layoutlint/core';
import { defaultFonts } from './check';

export interface RenderOptions {
  /** Viewport width in px. Default 375. */
  viewport?: number;
  /** Height used for h-screen / vh units. Default 800. */
  viewportHeight?: number;
  /** Font files; defaults to the bundled Inter (+ Bengali, + system emoji if present). */
  fonts?: FontFace[];
  /** 'png' additionally rasterizes the SVG. Default 'svg'. */
  format?: 'svg' | 'png';
  /** PNG raster scale (1 = CSS px). Default 1. */
  scale?: number;
}

export interface RenderResult {
  svg: string;
  png?: Uint8Array;
  /** CSS-px canvas size (PNG dimensions are scaled by `scale`). */
  width: number;
  height: number;
}

/**
 * Deterministic screenshot of a JSX/HTML + Tailwind source: computes the
 * real layout (Yoga + HarfBuzz) and paints it — no browser. The SVG is
 * self-contained (text as glyph outlines).
 */
export async function render(source: string, options: RenderOptions = {}): Promise<RenderResult> {
  const viewport = options.viewport ?? 375;
  const fonts = options.fonts ? new FontStore(options.fonts) : defaultFonts();

  const raw = parseSource(source);
  const { tree } = resolveTree(raw, { viewport, viewportHeight: options.viewportHeight });
  const boxes = computeLayout(tree, viewport, fonts);
  const visuals = resolveVisualTree(raw, { viewport });
  const svg = paintSVG(tree, boxes, visuals, fonts, { width: viewport });

  const height = Math.ceil(Math.max(boxes.find((b) => b.path === 'r')?.height ?? 0, 1));
  const result: RenderResult = { svg, width: viewport, height };

  if (options.format === 'png') {
    const scale = options.scale ?? 1;
    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: viewport * scale } });
    result.png = new Uint8Array(resvg.render().asPng());
  }
  return result;
}
