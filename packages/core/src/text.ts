import type { FontStore } from './fonts';
import type { Style } from './types';

export interface TextMeasurement {
  width: number;
  height: number;
  lineCount: number;
}

/** One broken line: trailing whitespace stripped, width as shaped. */
export interface LineBox {
  text: string;
  width: number;
}

const segmenter = new Intl.Segmenter(undefined, { granularity: 'word' });

const EPSILON = 0.05;

/**
 * Greedy line breaking at word-segment boundaries (Intl.Segmenter), with
 * HarfBuzz-shaped widths. Matches CSS `white-space: normal` +
 * `overflow-wrap: normal`: trailing spaces hang past the edge at line breaks
 * and unbreakable words overflow on their own line. Shared by measureText
 * (geometry) and the painter (paint), so they agree by construction.
 */
export function breakLines(
  store: FontStore,
  text: string,
  style: Style,
  maxWidth: number,
): LineBox[] {
  const fontSize = style.fontSize ?? 16;
  const weight = style.fontWeight ?? 400;
  const letterSpacing = style.letterSpacing ?? 0;

  const measure = (s: string) => store.measureWidth(s, fontSize, weight, letterSpacing);

  if (style.whiteSpace === 'nowrap') {
    return [{ text, width: measure(text) }];
  }

  const segments = [...segmenter.segment(text)].map((s) => s.segment);

  // Each line is shaped as a whole (cumulatively per candidate segment),
  // not as a sum of independently-shaped words — kerning and contextual
  // alternates can span word boundaries (e.g. Inter shapes "2.1" differently
  // alone than mid-string), and browsers shape per line.
  const trim = (s: string) => s.replace(/\s+$/, '');
  const measureLine = (s: string) => measure(trim(s));

  const lines: LineBox[] = [];
  let line = '';

  for (const seg of segments) {
    if (/^\s+$/.test(seg)) {
      // trailing whitespace never forces a break; it hangs past the edge
      if (line.length > 0) line += seg;
      continue;
    }
    const candidate = line + seg;
    if (trim(line).length > 0 && measureLine(candidate) > maxWidth + EPSILON) {
      lines.push({ text: trim(line), width: measureLine(line) });
      line = seg;
    } else {
      line = candidate;
    }
  }
  if (trim(line).length > 0 || lines.length === 0) {
    lines.push({ text: trim(line), width: measureLine(line) });
  }

  return lines;
}

export function measureText(
  store: FontStore,
  text: string,
  style: Style,
  maxWidth: number,
): TextMeasurement {
  const fontSize = style.fontSize ?? 16;
  const lineHeight = style.lineHeight ?? Math.round(fontSize * 1.5);
  const lines = breakLines(store, text, style, maxWidth);
  return {
    width: Math.max(...lines.map((l) => l.width)),
    height: lines.length * lineHeight,
    lineCount: lines.length,
  };
}
