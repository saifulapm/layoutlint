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

  const lineWidths: number[] = [];
  let lineWidth = 0; // includes trailing spaces
  let lineTrimmedWidth = 0; // excludes trailing spaces — what determines the box
  let lineHasContent = false;

  const pushLine = () => {
    lineWidths.push(lineTrimmedWidth);
    lineWidth = 0;
    lineTrimmedWidth = 0;
    lineHasContent = false;
  };

  for (const seg of segments) {
    const isSpace = /^\s+$/.test(seg);
    const w = measure(seg);
    if (isSpace) {
      // trailing whitespace never forces a break; it hangs past the edge
      lineWidth += w;
      continue;
    }
    if (lineHasContent && lineWidth + w > maxWidth + EPSILON) {
      pushLine();
    }
    lineWidth += w;
    lineTrimmedWidth = lineWidth;
    lineHasContent = true;
  }
  if (lineHasContent || lineWidths.length === 0) pushLine();

  return {
    width: Math.max(...lineWidths),
    height: lineWidths.length * lineHeight,
    lineCount: lineWidths.length,
  };
}
