/**
 * SVG painter: zips the resolved tree, computed boxes, and visual styles
 * into a self-contained SVG. Text is painted as glyph-outline paths using
 * the same HarfBuzz shaping that measured it (breakLines + glyphRuns), so
 * paint agrees with geometry by construction. No browser anywhere.
 *
 * v1 paints: background color, per-side borders + corner radii (as nested
 * filled rounded rects), overflow:hidden clipping, <img> placeholders, and
 * text (color/size/weight, text-align). Documented exclusions: shadows,
 * gradients, opacity, transforms, text-decoration; CBDT emoji are embedded
 * as bitmaps when the face provides them, otherwise skipped.
 */
import type { FontStore } from './fonts';
import { breakLines } from './text';
import type { Box, Style, TreeNode } from './types';
import type { VisualStyle } from './visual';

export interface PaintOptions {
  width: number;
  height?: number;
  /** Canvas color behind everything. Default white (browser default). */
  background?: string;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Rounded-rect path with per-corner radii (clamped to half extents). */
function roundedRectPath(
  x: number, y: number, w: number, h: number,
  tl: number, tr: number, br: number, bl: number,
): string {
  const clamp = (r: number) => Math.max(0, Math.min(r, w / 2, h / 2));
  [tl, tr, br, bl] = [clamp(tl), clamp(tr), clamp(br), clamp(bl)];
  if (tl === 0 && tr === 0 && br === 0 && bl === 0) {
    return `M${r2(x)} ${r2(y)}H${r2(x + w)}V${r2(y + h)}H${r2(x)}Z`;
  }
  return (
    `M${r2(x + tl)} ${r2(y)}` +
    `H${r2(x + w - tr)}` + (tr ? `A${r2(tr)} ${r2(tr)} 0 0 1 ${r2(x + w)} ${r2(y + tr)}` : '') +
    `V${r2(y + h - br)}` + (br ? `A${r2(br)} ${r2(br)} 0 0 1 ${r2(x + w - br)} ${r2(y + h)}` : '') +
    `H${r2(x + bl)}` + (bl ? `A${r2(bl)} ${r2(bl)} 0 0 1 ${r2(x)} ${r2(y + h - bl)}` : '') +
    `V${r2(y + tl)}` + (tl ? `A${r2(tl)} ${r2(tl)} 0 0 1 ${r2(x + tl)} ${r2(y)}` : '') +
    `Z`
  );
}

interface Ctx {
  boxes: Map<string, Box>;
  visuals: Map<string, VisualStyle>;
  fonts: FontStore;
  parts: string[];
  defs: string[];
  clipSeq: number;
}

function borderWidths(s: Style): { t: number; r: number; b: number; l: number } {
  return {
    t: s.borderTopWidth ?? s.borderWidth ?? 0,
    r: s.borderRightWidth ?? s.borderWidth ?? 0,
    b: s.borderBottomWidth ?? s.borderWidth ?? 0,
    l: s.borderLeftWidth ?? s.borderWidth ?? 0,
  };
}

function paintElement(ctx: Ctx, node: TreeNode, box: Box, v: VisualStyle): void {
  const s = node.style ?? {};
  const bw = borderWidths(s);
  const hasBorder = bw.t > 0 || bw.r > 0 || bw.b > 0 || bw.l > 0;
  // <img> without a background class paints nothing — matching Chrome,
  // which renders srcless images as an empty box (style imgs with bg-*)
  const { tl, tr, br, bl } = v.radius;
  const background = v.background;

  if (hasBorder) {
    // outer rect filled border-color; inner rect (inset per side, radii reduced) filled bg
    ctx.parts.push(`<path d="${roundedRectPath(box.x, box.y, box.width, box.height, tl, tr, br, bl)}" fill="${v.borderColor}"/>`);
    const iw = box.width - bw.l - bw.r;
    const ih = box.height - bw.t - bw.b;
    if (iw > 0 && ih > 0) {
      const inner = roundedRectPath(
        box.x + bw.l, box.y + bw.t, iw, ih,
        Math.max(0, tl - Math.max(bw.t, bw.l)), Math.max(0, tr - Math.max(bw.t, bw.r)),
        Math.max(0, br - Math.max(bw.b, bw.r)), Math.max(0, bl - Math.max(bw.b, bw.l)),
      );
      ctx.parts.push(`<path d="${inner}" fill="${background ?? '#ffffff'}"/>`);
    }
  } else if (background !== undefined) {
    ctx.parts.push(`<path d="${roundedRectPath(box.x, box.y, box.width, box.height, tl, tr, br, bl)}" fill="${background}"/>`);
  }
}

function paintText(ctx: Ctx, node: TreeNode, box: Box, v: VisualStyle): void {
  const s = node.style ?? {};
  const text = node.text ?? '';
  // lines lay out inside the content box (border + padding insets)
  const bw = borderWidths(s);
  const cx = box.x + bw.l + (s.paddingLeft ?? s.padding ?? 0);
  const cy = box.y + bw.t + (s.paddingTop ?? s.padding ?? 0);
  const cw = box.width - bw.l - bw.r
    - (s.paddingLeft ?? s.padding ?? 0) - (s.paddingRight ?? s.padding ?? 0);
  if (text.length === 0 || cw <= 0) return;
  const fontSize = s.fontSize ?? 16;
  const lineHeight = s.lineHeight ?? Math.round(fontSize * 1.5);
  const weight = s.fontWeight ?? 400;
  const spacing = s.letterSpacing ?? 0;
  const lines = breakLines(ctx.fonts, text, s, cw);
  const m = ctx.fonts.lineMetrics(fontSize, weight);
  const halfLeading = (lineHeight - (m.ascent + m.descent)) / 2;

  const glyphPaths: string[] = [];
  lines.forEach((line, i) => {
    if (line.text.length === 0) return;
    const lineX =
      v.textAlign === 'center' ? cx + (cw - line.width) / 2
      : v.textAlign === 'right' ? cx + cw - line.width
      : cx;
    const baselineY = cy + i * lineHeight + halfLeading + m.ascent;
    for (const run of ctx.fonts.glyphRuns(line.text, fontSize, weight, spacing)) {
      const scale = run.fontSize / run.upem;
      for (const g of run.glyphs) {
        let glyph: ReturnType<typeof run.font.getGlyph> | null = null;
        let d = '';
        try {
          glyph = run.font.getGlyph(g.glyphId);
          d = glyph?.path?.toSVG() ?? ''; // CBDT/sbix glyphs have no outlines
        } catch {
          d = '';
        }
        if (glyph === null) continue;
        if (d.length > 0) {
          // scale must keep full precision: 14px/2048upem ≈ 0.0068 — rounding
          // it to 2dp inflates every glyph by ~46%
          const sc = scale.toPrecision(6);
          glyphPaths.push(
            `<path d="${d}" transform="translate(${r2(lineX + g.x)} ${r2(baselineY + g.y)}) scale(${sc} -${sc})"/>`,
          );
          continue;
        }
        // CBDT/sbix color glyph (emoji): embed the bitmap when available
        try {
          const img = (glyph as unknown as { getImageForSize?: (size: number) => { data: Uint8Array } | null })
            .getImageForSize?.(fontSize);
          if (img?.data) {
            const b64 = Buffer.from(img.data).toString('base64');
            const adv = (glyph.advanceWidth / run.upem) * run.fontSize;
            glyphPaths.push(
              `<image href="data:image/png;base64,${b64}" x="${r2(lineX + g.x)}" y="${r2(baselineY + g.y - m.ascent)}" width="${r2(adv)}" height="${r2(adv)}"/>`,
            );
          }
        } catch {
          // no outline, no bitmap — skip (documented envelope)
        }
      }
    }
  });
  if (glyphPaths.length > 0) {
    ctx.parts.push(`<g fill="${v.textColor}">${glyphPaths.join('')}</g>`);
  }
}

function walk(ctx: Ctx, node: TreeNode, path: string): void {
  const box = ctx.boxes.get(path);
  const v = ctx.visuals.get(path);
  if (!box || !v) return;
  if (node.style?.display === 'none' || box.width <= 0 || box.height <= 0) return;

  if (node.text !== undefined) {
    // collapsed inline elements keep their box styles on the text leaf —
    // paint the box (bg/border) first, then the lines inside its content box
    paintElement(ctx, node, box, v);
    paintText(ctx, node, box, v);
    return;
  }

  paintElement(ctx, node, box, v);

  const clips = node.style?.overflow !== undefined && node.style.overflow !== 'visible';
  if (clips) {
    const id = `c${ctx.clipSeq++}`;
    ctx.defs.push(
      `<clipPath id="${id}"><path d="${roundedRectPath(box.x, box.y, box.width, box.height, v.radius.tl, v.radius.tr, v.radius.br, v.radius.bl)}"/></clipPath>`,
    );
    ctx.parts.push(`<g clip-path="url(#${id})">`);
  }
  (node.children ?? []).forEach((c, i) => walk(ctx, c, `${path}.${i}`));
  if (clips) ctx.parts.push('</g>');
}

export function paintSVG(
  tree: TreeNode,
  boxes: Box[],
  visuals: Map<string, VisualStyle>,
  fonts: FontStore,
  opts: PaintOptions,
): string {
  const boxMap = new Map(boxes.map((b) => [b.path, b]));
  const root = boxMap.get('r');
  const height = Math.ceil(opts.height ?? Math.max(root?.height ?? 0, 1));
  const ctx: Ctx = { boxes: boxMap, visuals, fonts, parts: [], defs: [], clipSeq: 0 };
  walk(ctx, tree, 'r');
  const defs = ctx.defs.length > 0 ? `<defs>${ctx.defs.join('')}</defs>` : '';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${opts.width} ${height}" width="${opts.width}" height="${height}">` +
    `${defs}<rect width="${opts.width}" height="${height}" fill="${opts.background ?? '#ffffff'}"/>` +
    ctx.parts.join('') +
    `</svg>`
  );
}
