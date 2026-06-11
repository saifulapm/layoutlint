import type { FontStore } from './fonts';
import type { Style } from './types';

export interface TextMeasurement {
  width: number;
  height: number;
  lineCount: number;
}

const segmenter = new Intl.Segmenter(undefined, { granularity: 'word' });

const EPSILON = 0.05;

/**
 * Greedy line breaking at word-segment boundaries (Intl.Segmenter), with
 * fontkit-shaped widths. Matches CSS `white-space: normal` +
 * `overflow-wrap: normal`: trailing spaces hang past the edge at line breaks
 * and unbreakable words overflow on their own line.
 */
export function measureText(
  store: FontStore,
  text: string,
  style: Style,
  maxWidth: number,
): TextMeasurement {
  const fontSize = style.fontSize ?? 16;
  const lineHeight = style.lineHeight ?? Math.round(fontSize * 1.5);
  const weight = style.fontWeight ?? 400;
  const letterSpacing = style.letterSpacing ?? 0;

  const measure = (s: string) => store.measureWidth(s, fontSize, weight, letterSpacing);

  if (style.whiteSpace === 'nowrap') {
    return { width: measure(text), height: lineHeight, lineCount: 1 };
  }

  const segments = [...segmenter.segment(text)].map((s) => s.segment);

  // Each line is shaped as a whole (cumulatively per candidate segment),
  // not as a sum of independently-shaped words — kerning and contextual
  // alternates can span word boundaries (e.g. Inter shapes "2.1" differently
  // alone than mid-string), and browsers shape per line.
  const measureLine = (s: string) => measure(s.replace(/\s+$/, ''));

  const lineWidths: number[] = [];
  let line = '';

  for (const seg of segments) {
    if (/^\s+$/.test(seg)) {
      // trailing whitespace never forces a break; it hangs past the edge
      if (line.length > 0) line += seg;
      continue;
    }
    const candidate = line + seg;
    if (line.replace(/\s+$/, '').length > 0 && measureLine(candidate) > maxWidth + EPSILON) {
      lineWidths.push(measureLine(line));
      line = seg;
    } else {
      line = candidate;
    }
  }
  if (line.replace(/\s+$/, '').length > 0 || lineWidths.length === 0) {
    lineWidths.push(measureLine(line));
  }

  return {
    width: Math.max(...lineWidths),
    height: lineWidths.length * lineHeight,
    lineCount: lineWidths.length,
  };
}
