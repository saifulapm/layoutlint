import * as fontkit from 'fontkit';
import type { Font } from 'fontkit';
import { readFileSync } from 'node:fs';
import {
  Blob as HbBlob,
  Buffer as HbBuffer,
  Face as HbFace,
  Font as HbFont,
  shape as hbShape,
} from 'harfbuzzjs';

export interface FontFace {
  family: string;
  path: string;
  weight: number;
}

/** One positioned glyph: px offsets relative to the line's pen origin
 *  (x grows rightward, y grows DOWNWARD from the baseline — SVG space). */
export interface PositionedGlyph {
  glyphId: number;
  x: number;
  y: number;
}

/** A run of glyphs from a single face, ready for outline extraction. */
export interface GlyphRun {
  /** fontkit font — `font.getGlyph(glyphId).path` yields outlines (font units, y-up). */
  font: Font;
  upem: number;
  fontSize: number;
  glyphs: PositionedGlyph[];
}

export interface LineMetrics {
  /** px above the baseline (positive). */
  ascent: number;
  /** px below the baseline (positive). */
  descent: number;
}

interface LoadedFace {
  family: string;
  weight: number;
  /** fontkit — font parsing, cmap coverage, table access */
  font: Font;
  /** HarfBuzz — shaping (what Chrome uses), so advances match the browser */
  hbFont: HbFont;
  upem: number;
}

/** Default-ignorable codepoints that should stay attached to the current run. */
function isJoinerOrSelector(cp: number): boolean {
  return cp === 0x200d || (cp >= 0xfe00 && cp <= 0xfe0f) || cp === 0x20e3;
}

const graphemeSegmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

// single reusable shaping buffer — FontStore usage is synchronous
const hbBuffer = new HbBuffer();

/** Advance width of a run in font units, shaped with HarfBuzz. */
function runAdvance(face: LoadedFace, text: string): number {
  hbBuffer.reset();
  hbBuffer.addText(text);
  hbBuffer.guessSegmentProperties();
  hbShape(face.hbFont, hbBuffer);
  let advance = 0;
  for (const p of hbBuffer.getGlyphPositions()) advance += p.xAdvance;
  return advance;
}

/**
 * Ordered font fallback chain. Width measurement walks the chain per
 * codepoint, mirroring browser font fallback across @font-face entries.
 */
export class FontStore {
  private faces: LoadedFace[] = [];

  constructor(faces: FontFace[]) {
    for (const f of faces) {
      const data = readFileSync(f.path);
      const hbFace = new HbFace(new HbBlob(new Uint8Array(data).buffer as ArrayBuffer), 0);
      this.faces.push({
        family: f.family,
        weight: f.weight,
        font: fontkit.create(data) as Font,
        hbFont: new HbFont(hbFace),
        upem: hbFace.upem,
      });
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
   * by codepoint coverage (CSS per-character family matching), then shapes
   * each run with HarfBuzz — the same shaper Chrome uses.
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
    for (const run of runs) {
      width += (runAdvance(run.face, run.text) / run.face.upem) * fontSize;
    }
    if (letterSpacing !== 0) {
      // letter-spacing applies per typographic character unit (grapheme
      // cluster), not per codepoint — combining marks add no spacing
      width += letterSpacing * [...graphemeSegmenter.segment(text)].length;
    }
    return width;
  }

  /**
   * Shaped, positioned glyphs for one line of text, for the painter.
   * Same run splitting and shaping as measureWidth; letter-spacing is added
   * after every cluster (HarfBuzz cluster ≈ grapheme for our corpus), so the
   * final pen advance equals measureWidth for cluster==grapheme text.
   */
  glyphRuns(text: string, fontSize: number, weight: number, letterSpacing = 0): GlyphRun[] {
    if (text.length === 0) return [];
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

    const out: GlyphRun[] = [];
    let penX = 0;
    for (const run of runs) {
      const scale = fontSize / run.face.upem;
      hbBuffer.reset();
      hbBuffer.addText(run.text);
      hbBuffer.guessSegmentProperties();
      hbShape(run.face.hbFont, hbBuffer);
      const infos = hbBuffer.getGlyphInfos();
      const positions = hbBuffer.getGlyphPositions();
      const glyphs: PositionedGlyph[] = [];
      for (let i = 0; i < infos.length; i++) {
        const p = positions[i];
        glyphs.push({
          glyphId: infos[i].codepoint,
          x: penX + p.xOffset * scale,
          y: -p.yOffset * scale, // HarfBuzz y-up → SVG y-down
        });
        penX += p.xAdvance * scale;
        // cluster boundary (incl. the last glyph) → letter-spacing, like CSS
        if (letterSpacing !== 0 && (i === infos.length - 1 || infos[i + 1].cluster !== infos[i].cluster)) {
          penX += letterSpacing;
        }
      }
      out.push({ font: run.face.font, upem: run.face.upem, fontSize, glyphs });
    }
    return out;
  }

  /**
   * Line metrics of the chain's primary family at the weight Chrome would
   * pick — the browser struts the line box from the primary font.
   */
  lineMetrics(fontSize: number, weight: number): LineMetrics {
    const primaryFamily = this.faces[0].family;
    const candidates = this.faces.filter((f) => f.family === primaryFamily);
    const face = candidates.sort((a, b) => {
      const da = Math.abs(a.weight - weight);
      const db = Math.abs(b.weight - weight);
      return da !== db ? da - db : a.weight - b.weight;
    })[0];
    const scale = fontSize / face.font.unitsPerEm;
    return {
      ascent: face.font.ascent * scale,
      descent: Math.abs(face.font.descent) * scale,
    };
  }
}
