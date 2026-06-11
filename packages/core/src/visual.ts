/**
 * Visual style resolver — the painter's counterpart to the layout resolver.
 * Walks the same raw parsed tree with the same child indexing (so its map
 * keys match Box.path), resolving the color/radius/align classes that the
 * layout resolver deliberately ignores. The layout `Style` type and the
 * geometry goldens are untouched by anything in this file.
 */
import { PALETTE } from './palette';
import { activeClass, BREAKPOINTS, COLOR_RE, type ResolveOptions } from './tailwind';
import type { TreeNode } from './types';

export interface CornerRadii {
  tl: number;
  tr: number;
  br: number;
  bl: number;
}

export interface VisualStyle {
  /** Resolved sRGB (#rrggbb or #rrggbbaa); absent = transparent. */
  background?: string;
  /** Inherited; default black (canvastext). */
  textColor: string;
  /** Explicit border-{color} or CSS default currentColor → textColor. */
  borderColor: string;
  radius: CornerRadii;
  /** Inherited. */
  textAlign: 'left' | 'center' | 'right';
  isImg: boolean;
}

/** v4 default theme radius scale (verified against the vendored browser build). */
const RADIUS: Record<string, number> = {
  none: 0, xs: 2, sm: 4, md: 6, lg: 8, xl: 12, '2xl': 16, '3xl': 24, '4xl': 32, full: 9999,
};

/** corner-group suffix → affected corners (LTR: s=left, e=right). */
const CORNERS: Record<string, (keyof CornerRadii)[]> = {
  t: ['tl', 'tr'], r: ['tr', 'br'], b: ['br', 'bl'], l: ['tl', 'bl'],
  s: ['tl', 'bl'], e: ['tr', 'br'],
  tl: ['tl'], tr: ['tr'], br: ['br'], bl: ['bl'],
  ss: ['tl'], se: ['tr'], es: ['bl'], ee: ['br'],
};

/**
 * Resolve a Tailwind color token (`white`, `blue-600`, `black/50`) to sRGB
 * hex. `current` resolves to currentColor (passed in); `transparent`,
 * `inherit`, and unknown tokens resolve to undefined.
 */
function resolveColor(token: string, currentColor: string): string | undefined {
  const [name, alphaStr] = token.split('/');
  let hex: string | undefined;
  if (name === 'current') hex = currentColor;
  else if (name === 'transparent' || name === 'inherit') return undefined;
  else hex = PALETTE[name];
  if (hex === undefined) return undefined;
  if (alphaStr !== undefined) {
    const alpha = Math.round((parseInt(alphaStr, 10) / 100) * 255);
    if (Number.isFinite(alpha)) hex += Math.max(0, Math.min(255, alpha)).toString(16).padStart(2, '0');
  }
  return hex;
}

interface OwnVisual {
  background?: string;
  textColor?: string;
  borderColor?: string;
  radius: Partial<CornerRadii>;
  textAlign?: 'left' | 'center' | 'right';
}

/** COLOR_RE only allows /alpha on hue colors; visually, black/50 etc. are valid too. */
const isColorToken = (token: string) => COLOR_RE.test(token.split('/')[0]);

function applyVisualClass(base: string, v: OwnVisual, currentColor: string): void {
  let m = base.match(/^bg-(.+)$/);
  if (m && isColorToken(m[1])) {
    v.background = resolveColor(m[1], currentColor);
    return;
  }
  m = base.match(/^text-(.+)$/);
  if (m) {
    if (isColorToken(m[1])) {
      const c = resolveColor(m[1], currentColor);
      if (c !== undefined) v.textColor = c;
      return;
    }
    if (m[1] === 'left' || m[1] === 'center' || m[1] === 'right') {
      v.textAlign = m[1];
      return;
    }
    if (m[1] === 'justify' || m[1] === 'start') v.textAlign = 'left';
    if (m[1] === 'end') v.textAlign = 'right';
    return; // sizes handled by the layout resolver
  }
  m = base.match(/^border-(.+)$/);
  if (m && isColorToken(m[1])) {
    const c = resolveColor(m[1], currentColor);
    if (c !== undefined) v.borderColor = c;
    return;
  }
  m = base.match(/^rounded(?:-(.+))?$/);
  if (m) {
    const rest = m[1];
    const setAll = (px: number) => {
      v.radius.tl = px; v.radius.tr = px; v.radius.br = px; v.radius.bl = px;
    };
    if (rest === undefined) return setAll(RADIUS.sm);
    const arb = rest.match(/^\[(\d+(?:\.\d+)?)px\]$/);
    if (arb) return setAll(parseFloat(arb[1]));
    if (RADIUS[rest] !== undefined) return setAll(RADIUS[rest]);
    const sided = rest.match(/^([a-z]{1,2})(?:-(.+))?$/);
    if (sided && CORNERS[sided[1]]) {
      const sizeKey = sided[2];
      let px: number | undefined;
      if (sizeKey === undefined) px = RADIUS.sm;
      else if (RADIUS[sizeKey] !== undefined) px = RADIUS[sizeKey];
      else {
        const a = sizeKey.match(/^\[(\d+(?:\.\d+)?)px\]$/);
        if (a) px = parseFloat(a[1]);
      }
      if (px !== undefined) for (const c of CORNERS[sided[1]]) v.radius[c] = px;
    }
  }
}

/** Resolve one element's visual classes at a viewport (cascade order). */
function resolveVisualClasses(classes: string[], opts: ResolveOptions, currentColor: string): OwnVisual {
  const v: OwnVisual = { radius: {} };
  const active: { base: string; bp: number }[] = [];
  for (const cls of classes) {
    const base = activeClass(cls, opts.viewport);
    if (base === null) continue;
    const prefix = cls.includes(':')
      ? cls.split(':').slice(0, -1).find((p) => BREAKPOINTS[p] !== undefined)
      : undefined;
    active.push({ base, bp: prefix ? BREAKPOINTS[prefix] : 0 });
  }
  active.sort((a, b) => a.bp - b.bp);
  for (const { base } of active) applyVisualClass(base, v, currentColor);
  return v;
}

/**
 * Resolve the whole tree's visual styles. Walk order and child indexing
 * mirror resolveTree/computeLayout, so keys equal Box.path.
 */
export function resolveVisualTree(raw: TreeNode, opts: ResolveOptions): Map<string, VisualStyle> {
  const out = new Map<string, VisualStyle>();

  const walk = (n: TreeNode, path: string, inherited: { textColor: string; textAlign: 'left' | 'center' | 'right' }) => {
    // two-pass: text-color first so border-current/bg-current see this node's color
    const pre = resolveVisualClasses(n.classes ?? [], opts, inherited.textColor);
    const textColor = pre.textColor ?? inherited.textColor;
    const own = resolveVisualClasses(n.classes ?? [], opts, textColor);
    const style: VisualStyle = {
      background: own.background,
      textColor,
      borderColor: own.borderColor ?? textColor, // CSS default: currentColor
      radius: { tl: 0, tr: 0, br: 0, bl: 0, ...own.radius },
      textAlign: own.textAlign ?? inherited.textAlign,
      isImg: n.tag === 'img',
    };
    out.set(path, style);
    (n.children ?? []).forEach((c, i) =>
      walk(c, `${path}.${i}`, { textColor, textAlign: style.textAlign }),
    );
  };

  walk(raw, 'r', { textColor: '#000000', textAlign: 'left' });
  return out;
}
