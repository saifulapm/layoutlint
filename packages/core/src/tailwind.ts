import type { Length, Style, TreeNode } from './types';

/**
 * Static Tailwind (v4 default theme) class → style resolver for the
 * layout-relevant subset. No CSS cascade: classes resolve via lookup, with
 * responsive prefixes applied per target viewport (the Satori scoping trick).
 */

export interface ResolveOptions {
  viewport: number;
  /** Used to resolve h-screen / vh units. Default 800. */
  viewportHeight?: number;
}

export interface ResolveResult {
  tree: TreeNode;
  warnings: string[];
}

const BREAKPOINTS: Record<string, number> = { sm: 640, md: 768, lg: 1024, xl: 1280, '2xl': 1536 };

const REM = 16;
const SPACING = 0.25 * REM; // Tailwind v4 --spacing

/** text-SIZE → [font-size, line-height] px (v4 default theme). */
const TEXT_SIZES: Record<string, [number, number]> = {
  xs: [12, 16], sm: [14, 20], base: [16, 24], lg: [18, 28], xl: [20, 28],
  '2xl': [24, 32], '3xl': [30, 36], '4xl': [36, 40], '5xl': [48, 48],
  '6xl': [60, 60], '7xl': [72, 72], '8xl': [96, 96], '9xl': [128, 128],
};

const FONT_WEIGHTS: Record<string, number> = {
  thin: 100, extralight: 200, light: 300, normal: 400, medium: 500,
  semibold: 600, bold: 700, extrabold: 800, black: 900,
};

/** unitless multipliers; leading-N is N*spacing px */
const LEADINGS: Record<string, number> = {
  none: 1, tight: 1.25, snug: 1.375, normal: 1.5, relaxed: 1.625, loose: 2,
};

/** em values */
const TRACKINGS: Record<string, number> = {
  tighter: -0.05, tight: -0.025, normal: 0, wide: 0.025, wider: 0.05, widest: 0.1,
};

const MAX_WIDTHS: Record<string, number> = {
  '3xs': 256, '2xs': 288, xs: 320, sm: 384, md: 448, lg: 512, xl: 576,
  '2xl': 672, '3xl': 768, '4xl': 896, '5xl': 1024, '6xl': 1152, '7xl': 1280,
};

/** Classes that are real Tailwind but never affect box layout — ignored silently. */
const IGNORABLE = [
  /^(bg|from|via|to|fill|stroke|accent|caret|divide|ring|outline|shadow|decoration|placeholder)-/,
  /^(rounded|blur|brightness|contrast|drop-shadow|grayscale|saturate|sepia|backdrop)/,
  /^(transition|duration|ease|delay|animate|cursor|select|resize|appearance|pointer-events)/,
  /^(z|order)-/, // z layout-irrelevant; order warned separately below
  /^(italic|not-italic|underline|overline|line-through|no-underline|uppercase|lowercase|capitalize|normal-case|antialiased|subpixel-antialiased)$/,
  /^(text-left|text-center|text-right|text-justify|text-start|text-end)$/, // box rects unchanged
  /^(text-ellipsis|text-clip|break-normal|break-words|align-.*)$/,
  /^(group|peer)(\/.*)?$/,
  /^(font-sans|font-serif|font-mono)$/, // everything measures as the configured font chain
  /^(visible|invisible|collapse)$/, // visibility doesn't change rects
  /^(list|table|isolate|isolation|mix-blend|object|will-change|scroll|snap|touch|whitespace-pre.*)/,
];

/** Tailwind color keywords that collide with size-ish prefixes (text-red-500, border-gray-200). */
const COLOR_RE =
  /^(inherit|current|transparent|black|white|(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(-\d{2,3})?(\/\d+)?)$/;

/** Parse a Tailwind numeric suffix: spacing scale, px, fraction, full, auto, arbitrary. */
function parseSize(
  suffix: string,
  opts: ResolveOptions,
): Length | 'auto' | undefined {
  if (suffix === 'auto') return 'auto';
  if (suffix === 'full') return '100%';
  if (suffix === 'px') return 1;
  if (suffix === 'screen') return undefined; // handled by callers (vw vs vh)
  if (/^\d+(\.\d+)?$/.test(suffix)) return parseFloat(suffix) * SPACING;
  const frac = suffix.match(/^(\d+)\/(\d+)$/);
  if (frac) return `${((parseInt(frac[1]) / parseInt(frac[2])) * 100).toFixed(4)}%` as Length;
  const arb = suffix.match(/^\[(.+)\]$/);
  if (arb) return parseArbitrary(arb[1], opts);
  return undefined;
}

function parseArbitrary(v: string, opts: ResolveOptions): Length | undefined {
  let m = v.match(/^(-?[\d.]+)px$/);
  if (m) return parseFloat(m[1]);
  m = v.match(/^(-?[\d.]+)rem$/);
  if (m) return parseFloat(m[1]) * REM;
  m = v.match(/^(-?[\d.]+)%$/);
  if (m) return `${parseFloat(m[1])}%` as Length;
  m = v.match(/^(-?[\d.]+)vw$/);
  if (m) return (parseFloat(m[1]) / 100) * opts.viewport;
  m = v.match(/^(-?[\d.]+)vh$/);
  if (m) return (parseFloat(m[1]) / 100) * (opts.viewportHeight ?? 800);
  if (v === '0') return 0;
  return undefined;
}

const asPx = (v: Length | 'auto' | undefined): number | undefined =>
  typeof v === 'number' ? v : undefined;

interface ClassResolution {
  style: Style;
  /** text-size pair from text-*: line-height tied to font-size */
  textSize?: [number, number];
  leadingFactor?: number;
  leadingPx?: number;
  trackingEm?: number;
  fontWeight?: number;
  isFlex?: boolean;
  spaceX?: number;
  spaceY?: number;
  warnings: string[];
}

// eslint-disable-next-line complexity
function applyClass(cls: string, r: ClassResolution, opts: ResolveOptions): void {
  const s = r.style;
  const warn = (msg: string): void => {
    r.warnings.push(msg);
  };

  switch (cls) {
    case 'flex': case 'inline-flex': r.isFlex = true; return;
    case 'block': case 'inline-block': case 'flow-root': case 'inline': return;
    case 'hidden': s.display = 'none'; return;
    case 'grid': case 'inline-grid':
      warn(`"${cls}" approximated as a flex column in v0 (Taffy grid support is planned)`);
      s.flexDirection = 'column';
      return;
    case 'flex-row': s.flexDirection = 'row'; return;
    case 'flex-row-reverse': s.flexDirection = 'row-reverse'; return;
    case 'flex-col': s.flexDirection = 'column'; return;
    case 'flex-col-reverse': s.flexDirection = 'column-reverse'; return;
    case 'flex-wrap': s.flexWrap = 'wrap'; return;
    case 'flex-wrap-reverse': s.flexWrap = 'wrap-reverse'; return;
    case 'flex-nowrap': s.flexWrap = 'nowrap'; return;
    case 'flex-1': Object.assign(s, { flexGrow: 1, flexShrink: 1, flexBasis: '0%' }); return;
    case 'flex-auto': Object.assign(s, { flexGrow: 1, flexShrink: 1, flexBasis: 'auto' }); return;
    case 'flex-initial': Object.assign(s, { flexGrow: 0, flexShrink: 1, flexBasis: 'auto' }); return;
    case 'flex-none': Object.assign(s, { flexGrow: 0, flexShrink: 0, flexBasis: 'auto' }); return;
    case 'grow': s.flexGrow = 1; return;
    case 'grow-0': s.flexGrow = 0; return;
    case 'shrink': s.flexShrink = 1; return;
    case 'shrink-0': s.flexShrink = 0; return;
    case 'items-start': s.alignItems = 'flex-start'; return;
    case 'items-end': s.alignItems = 'flex-end'; return;
    case 'items-center': s.alignItems = 'center'; return;
    case 'items-stretch': s.alignItems = 'stretch'; return;
    case 'items-baseline':
      warn('"items-baseline" approximated as flex-start in v0');
      s.alignItems = 'flex-start';
      return;
    case 'justify-start': s.justifyContent = 'flex-start'; return;
    case 'justify-end': s.justifyContent = 'flex-end'; return;
    case 'justify-center': s.justifyContent = 'center'; return;
    case 'justify-between': s.justifyContent = 'space-between'; return;
    case 'justify-around': s.justifyContent = 'space-around'; return;
    case 'justify-evenly': s.justifyContent = 'space-evenly'; return;
    case 'content-start': s.alignContent = 'flex-start'; return;
    case 'content-end': s.alignContent = 'flex-end'; return;
    case 'content-center': s.alignContent = 'center'; return;
    case 'content-between': s.alignContent = 'space-between'; return;
    case 'content-around': s.alignContent = 'space-around'; return;
    case 'content-stretch': s.alignContent = 'stretch'; return;
    case 'self-auto': s.alignSelf = 'auto'; return;
    case 'self-start': s.alignSelf = 'flex-start'; return;
    case 'self-end': s.alignSelf = 'flex-end'; return;
    case 'self-center': s.alignSelf = 'center'; return;
    case 'self-stretch': s.alignSelf = 'stretch'; return;
    case 'relative': s.position = 'relative'; return;
    case 'absolute': s.position = 'absolute'; return;
    case 'static': return;
    case 'fixed':
      warn('"fixed" approximated as absolute within the checked tree in v0');
      s.position = 'absolute';
      return;
    case 'sticky':
      warn('"sticky" treated as relative (non-scrolled state) in v0');
      s.position = 'relative';
      return;
    case 'truncate':
      Object.assign(s, { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' });
      return;
    case 'text-wrap': case 'whitespace-normal': s.whiteSpace = 'normal'; return;
    case 'text-nowrap': case 'whitespace-nowrap': s.whiteSpace = 'nowrap'; return;
    case 'overflow-visible': s.overflow = 'visible'; return;
    case 'overflow-hidden': case 'overflow-clip': s.overflow = 'hidden'; return;
    case 'overflow-auto': s.overflow = 'auto'; return;
    case 'overflow-scroll': s.overflow = 'scroll'; return;
    case 'aspect-square': s.aspectRatio = 1; return;
    case 'aspect-video': s.aspectRatio = 16 / 9; return;
    case 'aspect-auto': return;
    case 'border': s.borderWidth = 1; return;
    case 'container':
      warn('"container" is not supported in v0 — set an explicit max-w-*');
      return;
    case 'sr-only':
      Object.assign(s, { position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden' });
      return;
    case 'w-screen': s.width = opts.viewport; return;
    case 'h-screen': s.height = opts.viewportHeight ?? 800; return;
    case 'min-h-screen': s.minHeight = opts.viewportHeight ?? 800; return;
    case 'max-h-screen': s.maxHeight = opts.viewportHeight ?? 800; return;
    case 'max-w-none': return;
    case 'basis-auto': s.flexBasis = 'auto'; return;
    case 'basis-full': s.flexBasis = '100%'; return;
  }

  let m: RegExpMatchArray | null;

  // gap
  if ((m = cls.match(/^gap-(.+)$/))) {
    const sub = m[1].match(/^([xy])-(.+)$/);
    const v = asPx(parseSize(sub ? sub[2] : m[1], opts));
    if (v === undefined) return warn(`could not resolve "${cls}"`);
    if (!sub) r.style.gap = v;
    else if (sub[1] === 'x') r.style.columnGap = v;
    else r.style.rowGap = v;
    return;
  }

  // space-x / space-y
  if ((m = cls.match(/^space-([xy])-(.+)$/))) {
    const v = asPx(parseSize(m[2], opts));
    if (v === undefined) return warn(`could not resolve "${cls}"`);
    if (m[1] === 'x') r.spaceX = v;
    else r.spaceY = v;
    return;
  }

  // width / height / size
  if ((m = cls.match(/^(w|h|size)-(.+)$/))) {
    const v = parseSize(m[2], opts);
    if (v === undefined) {
      if (/^(min|max|fit)$/.test(m[2])) return warn(`"${cls}" (content-based sizing) is not supported in v0`);
      return warn(`could not resolve "${cls}"`);
    }
    if (v === 'auto') return;
    if (m[1] === 'w' || m[1] === 'size') s.width = v;
    if (m[1] === 'h' || m[1] === 'size') s.height = v;
    return;
  }

  // min/max width/height
  if ((m = cls.match(/^(min|max)-(w|h)-(.+)$/))) {
    const key = `${m[1]}${m[2] === 'w' ? 'Width' : 'Height'}` as 'minWidth' | 'maxWidth' | 'minHeight' | 'maxHeight';
    let v: Length | 'auto' | undefined;
    if (m[1] === 'max' && m[2] === 'w' && MAX_WIDTHS[m[3]] !== undefined) v = MAX_WIDTHS[m[3]];
    else if (m[1] === 'max' && m[2] === 'w' && (m[3].startsWith('screen-'))) v = BREAKPOINTS[m[3].slice(7)];
    else if (m[3] === 'prose') return warn('"max-w-prose" (ch units) is not supported in v0');
    else v = parseSize(m[3], opts);
    if (v === undefined || v === 'auto') return warn(`could not resolve "${cls}"`);
    s[key] = v;
    return;
  }

  // flex-basis
  if ((m = cls.match(/^basis-(.+)$/))) {
    const v = parseSize(m[1], opts);
    if (v === undefined || v === 'auto') return warn(`could not resolve "${cls}"`);
    s.flexBasis = v;
    return;
  }

  // padding
  if ((m = cls.match(/^p([trblxyse])?-(.+)$/))) {
    const v = asPx(parseSize(m[2], opts));
    if (v === undefined) return warn(`could not resolve "${cls}"`);
    applyEdges(s, 'padding', m[1], v);
    return;
  }

  // margin (incl. negative and auto)
  if ((m = cls.match(/^(-?)m([trblxyse])?-(.+)$/))) {
    const raw = m[3] === 'auto' ? 'auto' : asPx(parseSize(m[3], opts));
    if (raw === undefined) return warn(`could not resolve "${cls}"`);
    const v = typeof raw === 'number' && m[1] === '-' ? -raw : raw;
    applyEdges(s, 'margin', m[2], v);
    return;
  }

  // inset / top / right / bottom / left
  if ((m = cls.match(/^(-?)(inset|top|right|bottom|left)(-[xy])?-(.+)$/))) {
    let v = parseSize(m[4], opts);
    if (v === undefined || v === 'auto') return warn(`could not resolve "${cls}"`);
    if (typeof v === 'number' && m[1] === '-') v = -v;
    const axis = m[3]?.slice(1);
    const edges =
      m[2] === 'inset'
        ? axis === 'x' ? ['left', 'right'] : axis === 'y' ? ['top', 'bottom'] : ['top', 'right', 'bottom', 'left']
        : [m[2]];
    for (const e of edges) s[e as 'top' | 'right' | 'bottom' | 'left'] = v;
    return;
  }

  // borders (width classes only; color/style classes fall through to IGNORABLE/colors)
  if ((m = cls.match(/^border-([trblxy])$/))) {
    applyBorderEdges(s, m[1], 1);
    return;
  }
  if ((m = cls.match(/^border-([trblxy])-(\d+)$/))) {
    applyBorderEdges(s, m[1], parseInt(m[2]));
    return;
  }
  if ((m = cls.match(/^border-(\d+)$/))) {
    s.borderWidth = parseInt(m[1]);
    return;
  }
  if (cls.startsWith('border-')) {
    if (COLOR_RE.test(cls.slice(7)) || /^(solid|dashed|dotted|double|none|hidden)$/.test(cls.slice(7))) return;
    return warn(`could not resolve "${cls}"`);
  }

  // typography
  if ((m = cls.match(/^text-(.+)$/))) {
    const size = TEXT_SIZES[m[1]];
    if (size) { r.textSize = size; return; }
    if (COLOR_RE.test(m[1])) return;
    const arb = m[1].match(/^\[(.+)\]$/);
    if (arb) {
      const v = asPx(parseArbitrary(arb[1], opts));
      if (v !== undefined) { r.textSize = [v, NaN]; return; } // NaN: keep inherited line-height
    }
    return warn(`could not resolve "${cls}"`);
  }
  if ((m = cls.match(/^font-(.+)$/))) {
    const w = FONT_WEIGHTS[m[1]];
    if (w !== undefined) { r.fontWeight = w; return; }
    return warn(`could not resolve "${cls}"`);
  }
  if ((m = cls.match(/^leading-(.+)$/))) {
    if (LEADINGS[m[1]] !== undefined) { r.leadingFactor = LEADINGS[m[1]]; return; }
    const v = asPx(parseSize(m[1], opts));
    if (v !== undefined) { r.leadingPx = v; return; }
    return warn(`could not resolve "${cls}"`);
  }
  if ((m = cls.match(/^tracking-(.+)$/))) {
    if (TRACKINGS[m[1]] !== undefined) { r.trackingEm = TRACKINGS[m[1]]; return; }
    const arb = m[1].match(/^\[(-?[\d.]+)em\]$/);
    if (arb) { r.trackingEm = parseFloat(arb[1]); return; }
    return warn(`could not resolve "${cls}"`);
  }
  if (/^line-clamp-/.test(cls)) return warn(`"${cls}" is not supported in v0 — treated as unclamped`);
  if (/^aspect-\[(.+)\]$/.test(cls)) {
    const expr = cls.slice(8, -1);
    const ratio = expr.match(/^([\d.]+)\s*\/\s*([\d.]+)$/);
    if (ratio) { s.aspectRatio = parseFloat(ratio[1]) / parseFloat(ratio[2]); return; }
    return warn(`could not resolve "${cls}"`);
  }
  if (/^order-/.test(cls)) return warn(`"${cls}" is not supported in v0 (Yoga has no order property)`);
  if ((m = cls.match(/^overflow-[xy]-(visible|hidden|clip|auto|scroll)$/))) {
    s.overflow = m[1] === 'clip' ? 'hidden' : (m[1] as Style['overflow']);
    return;
  }

  for (const re of IGNORABLE) if (re.test(cls)) return;
  warn(`unrecognized class "${cls}" — ignored`);
}

function applyEdges(s: Style, prop: 'padding' | 'margin', edge: string | undefined, v: number | 'auto'): void {
  const set = (key: string) => {
    (s as Record<string, unknown>)[key] = v;
  };
  const cap = { t: 'Top', r: 'Right', b: 'Bottom', l: 'Left', s: 'Left', e: 'Right' } as const;
  if (!edge) {
    if (v === 'auto') { set(`${prop}Top`); set(`${prop}Right`); set(`${prop}Bottom`); set(`${prop}Left`); }
    else set(prop);
  } else if (edge === 'x') { set(`${prop}Left`); set(`${prop}Right`); }
  else if (edge === 'y') { set(`${prop}Top`); set(`${prop}Bottom`); }
  else set(`${prop}${cap[edge as keyof typeof cap]}`);
}

function applyBorderEdges(s: Style, edge: string, v: number): void {
  if (edge === 'x') { s.borderLeftWidth = v; s.borderRightWidth = v; }
  else if (edge === 'y') { s.borderTopWidth = v; s.borderBottomWidth = v; }
  else {
    const cap = { t: 'borderTopWidth', r: 'borderRightWidth', b: 'borderBottomWidth', l: 'borderLeftWidth' } as const;
    s[cap[edge as keyof typeof cap]] = v;
  }
}

/**
 * Whether a class changes box geometry. Used by the parser to decide if an
 * inline element must stay its own box: color/decoration classes (and plain
 * font-weight, which only nudges text metrics) collapse into the parent's
 * text run; padding/size/display classes make the span a real box.
 */
export function classAffectsLayout(cls: string): boolean {
  const base = cls.split(':').pop()!;
  if (FONT_WEIGHTS[base.replace(/^font-/, '')] !== undefined) return false;
  const r: ClassResolution = { style: {}, warnings: [] };
  applyClass(base, r, { viewport: 1024, viewportHeight: 800 });
  return (
    Object.keys(r.style).length > 0 ||
    r.textSize !== undefined ||
    r.leadingFactor !== undefined ||
    r.leadingPx !== undefined ||
    r.trackingEm !== undefined ||
    r.spaceX !== undefined ||
    r.spaceY !== undefined ||
    r.isFlex === true
  );
}

/** Split variant prefixes; returns null if the class doesn't apply (state variants, inactive breakpoints). */
function activeClass(cls: string, viewport: number): string | null {
  const parts = cls.split(':');
  const base = parts.pop()!;
  let order = -1;
  for (const variant of parts) {
    const bp = BREAKPOINTS[variant];
    if (bp !== undefined) {
      if (viewport < bp) return null;
      order = Math.max(order, bp);
      continue;
    }
    return null; // hover:, focus:, dark:, etc. — never active in static layout
  }
  return base;
}

interface InheritedText {
  fontSize: number;
  /** unitless factor (CSS inherited line-height) or px when pinned */
  leadingFactor?: number;
  leadingPx?: number;
  fontWeight: number;
  trackingEm: number;
}

/** Resolve one element's classes at a viewport. Exported for tests. */
export function resolveClasses(
  classes: string[],
  opts: ResolveOptions,
): ClassResolution {
  const r: ClassResolution = { style: {}, warnings: [] };
  // unprefixed first, then breakpoints in ascending order — Tailwind's cascade
  const active: { base: string; bp: number }[] = [];
  for (const cls of classes) {
    const base = activeClass(cls, opts.viewport);
    if (base === null) continue;
    const prefix = cls.includes(':') ? cls.split(':').slice(0, -1).find((p) => BREAKPOINTS[p] !== undefined) : undefined;
    active.push({ base, bp: prefix ? BREAKPOINTS[prefix] : 0 });
  }
  active.sort((a, b) => a.bp - b.bp);
  for (const { base } of active) applyClass(base, r, opts);
  return r;
}

/**
 * Resolve a parsed tree's Tailwind classes into styles at one viewport,
 * applying text-style inheritance (font-size, weight, line-height, tracking)
 * and block→flex-column defaults.
 */
export function resolveTree(raw: TreeNode, opts: ResolveOptions): ResolveResult {
  const warnings: string[] = [];

  const walk = (n: TreeNode, inherited: InheritedText, selector: string): TreeNode => {
    const r = resolveClasses(n.classes ?? [], opts);
    for (const w of r.warnings) warnings.push(`${selector}: ${w}`);

    const ctx: InheritedText = { ...inherited };
    if (r.textSize) {
      ctx.fontSize = r.textSize[0];
      if (Number.isNaN(r.textSize[1])) {
        // arbitrary font size: line-height stays inherited
      } else {
        ctx.leadingPx = r.textSize[1];
        ctx.leadingFactor = undefined;
      }
    }
    if (r.leadingFactor !== undefined) { ctx.leadingFactor = r.leadingFactor; ctx.leadingPx = undefined; }
    if (r.leadingPx !== undefined) { ctx.leadingPx = r.leadingPx; ctx.leadingFactor = undefined; }
    if (r.fontWeight !== undefined) ctx.fontWeight = r.fontWeight;
    if (r.trackingEm !== undefined) ctx.trackingEm = r.trackingEm;

    const style: Style = { ...r.style };
    const node: TreeNode = { ...n, style };

    if (n.text !== undefined) {
      style.fontSize = ctx.fontSize;
      style.lineHeight = ctx.leadingPx ?? round2((ctx.leadingFactor ?? 1.5) * ctx.fontSize);
      style.fontWeight = ctx.fontWeight;
      if (ctx.trackingEm !== 0) style.letterSpacing = round2(ctx.trackingEm * ctx.fontSize);
      delete node.children;
      return node;
    }

    // block elements lay out like a stretch column; flex defaults to row
    if (!r.isFlex && style.flexDirection === undefined) style.flexDirection = 'column';

    node.children = (n.children ?? []).map((c, i) => {
      const childSel = `${selector} > ${c.tag ?? 'div'}${(c.classes?.[0] && `.${c.classes[0]}`) || ''}`;
      const child = walk(c, ctx, childSel);
      // space-x/space-y compile to margins on every child after the first
      if (i > 0 && (r.spaceX !== undefined || r.spaceY !== undefined)) {
        child.style = child.style ?? {};
        if (r.spaceX !== undefined) child.style.marginLeft = (asNum(child.style.marginLeft) ?? 0) + r.spaceX;
        if (r.spaceY !== undefined) child.style.marginTop = (asNum(child.style.marginTop) ?? 0) + r.spaceY;
      }
      return child;
    });
    return node;
  };

  const rootSel = `${raw.tag ?? 'div'}${(raw.classes?.[0] && `.${raw.classes[0]}`) || ''}`;
  const tree = walk(raw, { fontSize: 16, leadingFactor: 1.5, fontWeight: 400, trackingEm: 0 }, rootSel);
  return { tree, warnings };
}

const asNum = (v: number | 'auto' | undefined): number | undefined =>
  typeof v === 'number' ? v : undefined;

const round2 = (n: number) => Math.round(n * 100) / 100;
