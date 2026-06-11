import * as fontkit from 'fontkit';
import type { Font } from 'fontkit';

export interface FontFace {
  family: string;
  path: string;
  weight: number;
}

interface LoadedFace {
  family: string;
  weight: number;
  font: Font;
}

/** Default-ignorable codepoints that should stay attached to the current run. */
function isJoinerOrSelector(cp: number): boolean {
  return cp === 0x200d || (cp >= 0xfe00 && cp <= 0xfe0f) || cp === 0x20e3;
}

/**
 * Advance width of a run in font units. Prefers full OpenType shaping
 * (kerning, ligatures, complex scripts); falls back to raw cmap+hmtx sums
 * for fonts fontkit cannot shape (e.g. CBDT color-emoji fonts, which have
 * no glyf/CFF table). Known gap: the fallback measures ZWJ emoji sequences
 * as the sum of their parts.
 */
function runAdvance(font: Font, text: string): number {
  try {
    return font.layout(text).advanceWidth;
  } catch {
    const f = font as Font & {
      _cmapProcessor: { lookup(cp: number): number };
      hmtx: { metrics: { length: number; get(i: number): { advance: number } } };
    };
    let advance = 0;
    for (const ch of text) {
      const cp = ch.codePointAt(0)!;
      if (isJoinerOrSelector(cp)) continue;
      const id = f._cmapProcessor.lookup(cp);
      const metric = f.hmtx.metrics.get(Math.min(id, f.hmtx.metrics.length - 1));
      if (metric) advance += metric.advance;
    }
    return advance;
  }
}

/**
 * Ordered font fallback chain. Width measurement walks the chain per
 * codepoint, mirroring browser font fallback across @font-face entries.
 */
export class FontStore {
  private faces: LoadedFace[] = [];

  constructor(faces: FontFace[]) {
    for (const f of faces) {
      this.faces.push({ family: f.family, weight: f.weight, font: fontkit.openSync(f.path) as Font });
    }
    if (this.faces.length === 0) throw new Error('FontStore requires at least one font');
  }

  /**
   * Pick the nearest-weight face that covers cp, in chain order within a
   * weight (simplified CSS font-matching: nearest weight, lower wins ties).
   */
  private faceFor(cp: number, weight: number): LoadedFace {
    const byDistance = [...this.faces].sort((a, b) => {
      const da = Math.abs(a.weight - weight);
      const db = Math.abs(b.weight - weight);
      if (da !== db) return da - db;
      if (a.weight !== b.weight) return a.weight - b.weight;
      return this.faces.indexOf(a) - this.faces.indexOf(b);
    });
    for (const face of byDistance) {
      if (face.font.hasGlyphForCodePoint(cp)) return face;
    }
    return byDistance[0];
  }

  /**
   * Advance width of a string in px. Splits the string into same-font runs
   * by codepoint coverage, then shapes each run with fontkit (kerning,
   * ligatures, complex-script shaping) like a browser would with HarfBuzz.
   */
  measureWidth(text: string, fontSize: number, weight: number, letterSpacing = 0): number {
    if (text.length === 0) return 0;
    const runs: { face: LoadedFace; text: string }[] = [];
    let current: { face: LoadedFace; text: string } | null = null;
    for (const ch of text) {
      const cp = ch.codePointAt(0)!;
      if (current && isJoinerOrSelector(cp)) {
        current.text += ch;
        continue;
      }
      const face = this.faceFor(cp, weight);
      if (current && current.face === face) {
        current.text += ch;
      } else {
        current = { face, text: ch };
        runs.push(current);
      }
    }
    let width = 0;
    let chars = 0;
    for (const run of runs) {
      width += (runAdvance(run.face.font, run.text) / run.face.font.unitsPerEm) * fontSize;
      chars += [...run.text].length;
    }
    if (letterSpacing !== 0) width += letterSpacing * chars;
    return width;
  }
}
