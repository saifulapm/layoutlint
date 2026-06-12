import type { CorpusCase } from '@layoutlint/core';

/**
 * Grid corpus — style-object trees exercising the Taffy-backed grid islands
 * against Chromium. Each case isolates one grid behavior; thresholds are the
 * standard ones (positions/sizes ≤1px, text ≤2px).
 *
 * `{ min: 0, max: '1fr' }` is Tailwind's minmax(0,1fr); bare '1fr' is
 * minmax(auto,1fr) — they diverge under min-content pressure (case
 * grid-min-content-pressure covers the difference).
 */

const FR = { min: 0, max: '1fr' } as const;

export const gridCases: CorpusCase[] = [
  {
    name: 'grid-basic-3col',
    viewport: 600,
    tree: {
      name: 'root',
      style: { display: 'grid', gridTemplateColumns: [FR, FR, FR], gap: 16, padding: 16 },
      children: [
        { name: 'a', style: { height: 40 } },
        { name: 'b', style: { height: 40 } },
        { name: 'c', style: { height: 40 } },
        { name: 'd', style: { height: 40 } },
        { name: 'e', style: { height: 40 } },
        { name: 'f', style: { height: 40 } },
      ],
    },
  },
  {
    name: 'grid-fr-mix',
    viewport: 400,
    tree: {
      name: 'root',
      style: { display: 'grid', gridTemplateColumns: [100, '1fr', '2fr'] },
      children: [
        { name: 'fixed', style: { height: 50 } },
        { name: 'one-fr', style: { height: 50 } },
        { name: 'two-fr', style: { height: 50 } },
      ],
    },
  },
  {
    name: 'grid-col-span',
    viewport: 600,
    tree: {
      name: 'root',
      style: { display: 'grid', gridTemplateColumns: [FR, FR, FR], gap: 12 },
      children: [
        { name: 'wide', style: { gridColumn: { span: 2 }, height: 40 } },
        { name: 'narrow', style: { height: 40 } },
        { name: 'full', style: { gridColumn: { start: 1, end: -1 }, height: 40 } },
        { name: 'tail', style: { height: 40 } },
      ],
    },
  },
  {
    name: 'grid-explicit-placement',
    viewport: 600,
    tree: {
      name: 'root',
      style: { display: 'grid', gridTemplateColumns: [FR, FR, FR, FR], gap: 8 },
      children: [
        { name: 'mid', style: { gridColumn: { start: 2, end: 4 }, height: 40 } },
        { name: 'first', style: { gridColumn: { start: 1, end: 2 }, height: 40 } },
        { name: 'to-end', style: { gridColumn: { start: 3, end: -1 }, height: 40 } },
        { name: 'auto', style: { height: 40 } },
      ],
    },
  },
  {
    name: 'grid-row-placement',
    viewport: 600,
    tree: {
      name: 'root',
      style: {
        display: 'grid',
        gridTemplateColumns: [FR, FR],
        gridTemplateRows: [60, 60, 60],
        gap: 10,
      },
      children: [
        { name: 'tall', style: { gridRow: { start: 1, end: 3 } } },
        { name: 'top-right', style: {} },
        { name: 'span-down', style: { gridRow: { span: 2 } } },
        { name: 'bottom-left', style: {} },
      ],
    },
  },
  {
    name: 'grid-auto-flow-column',
    viewport: 600,
    tree: {
      name: 'root',
      style: {
        display: 'grid',
        gridTemplateRows: [80, 80],
        gridAutoFlow: 'column',
        gridAutoColumns: 120,
        gap: 8,
      },
      children: [
        { name: 'a', style: {} },
        { name: 'b', style: {} },
        { name: 'c', style: {} },
        { name: 'd', style: {} },
        { name: 'e', style: {} },
      ],
    },
  },
  {
    name: 'grid-auto-flow-dense',
    viewport: 600,
    tree: {
      name: 'root',
      style: {
        display: 'grid',
        gridTemplateColumns: [FR, FR, FR],
        gridAutoRows: 50,
        gridAutoFlow: 'row dense',
        gap: 6,
      },
      children: [
        { name: 'pinned', style: { gridColumn: { start: 2, span: 2 } } },
        { name: 'wide', style: { gridColumn: { span: 2 } } },
        { name: 'backfill', style: {} },
      ],
    },
  },
  {
    name: 'grid-auto-rows-content',
    viewport: 375,
    tree: {
      name: 'root',
      style: { display: 'grid', gridTemplateColumns: [FR, FR], gap: 12, padding: 12 },
      children: [
        {
          name: 'short',
          text: 'One line.',
          style: { fontSize: 16, lineHeight: 24 },
        },
        {
          name: 'long',
          text: 'This text is long enough to wrap onto several lines inside its half-width grid track, sizing the implicit row.',
          style: { fontSize: 16, lineHeight: 24 },
        },
        {
          name: 'second-row',
          text: 'Second row follows the tallest cell above.',
          style: { fontSize: 16, lineHeight: 24 },
        },
        { name: 'block', style: { height: 30 } },
      ],
    },
  },
  {
    name: 'grid-percent-tracks',
    viewport: 400,
    tree: {
      name: 'root',
      style: { display: 'grid', gridTemplateColumns: ['25%', '75%'], gap: 20 },
      children: [
        { name: 'a', style: { height: 30 } },
        { name: 'b', style: { height: 30 } },
        { name: 'c', style: { height: 30 } },
        { name: 'd', style: { height: 30 } },
      ],
    },
  },
  {
    name: 'grid-in-flex',
    viewport: 600,
    tree: {
      name: 'root',
      style: { flexDirection: 'row', gap: 16, padding: 16 },
      children: [
        { name: 'sidebar', style: { width: 150, height: 120 } },
        {
          name: 'grid-panel',
          style: {
            display: 'grid',
            gridTemplateColumns: [FR, FR],
            gap: 8,
            flexGrow: 1,
          },
          children: [
            { name: 'cell-1', style: { height: 40 } },
            { name: 'cell-2', style: { height: 40 } },
            { name: 'cell-3', style: { height: 40 } },
            { name: 'cell-4', style: { height: 40 } },
          ],
        },
      ],
    },
  },
  {
    name: 'flex-in-grid',
    viewport: 600,
    tree: {
      name: 'root',
      style: { display: 'grid', gridTemplateColumns: [200, '1fr'], gap: 16, padding: 12 },
      children: [
        { name: 'fixed-cell', style: { height: 60 } },
        {
          name: 'flex-cell',
          style: { flexDirection: 'row', gap: 8, padding: 8 },
          children: [
            { name: 'avatar', style: { width: 40, height: 40, flexShrink: 0 } },
            {
              name: 'label',
              text: 'A row of text inside a grid item that has to share space with the avatar and wrap or shrink like the browser does.',
              style: { fontSize: 14, lineHeight: 20 },
            },
          ],
        },
      ],
    },
  },
  {
    name: 'grid-nested',
    viewport: 600,
    tree: {
      name: 'root',
      style: { display: 'grid', gridTemplateColumns: [FR, FR], gap: 12, padding: 12 },
      children: [
        {
          name: 'inner-grid',
          style: { display: 'grid', gridTemplateColumns: [FR, FR], gap: 4 },
          children: [
            { name: 'i1', style: { height: 30 } },
            { name: 'i2', style: { height: 30 } },
            { name: 'i3', style: { height: 30 } },
            { name: 'i4', style: { height: 30 } },
          ],
        },
        { name: 'plain', style: {} },
      ],
    },
  },
  {
    name: 'grid-alignment',
    viewport: 600,
    tree: {
      name: 'root',
      style: {
        display: 'grid',
        gridTemplateColumns: [FR, FR, FR],
        gridTemplateRows: [80],
        justifyItems: 'center',
        alignItems: 'flex-end',
        gap: 8,
      },
      children: [
        { name: 'centered', style: { width: 60, height: 30 } },
        { name: 'stretched', style: { justifySelf: 'stretch', height: 30 } },
        { name: 'top-start', style: { justifySelf: 'start', alignSelf: 'flex-start', width: 60, height: 30 } },
      ],
    },
  },
  {
    name: 'grid-min-content-pressure',
    viewport: 320,
    tree: {
      name: 'root',
      style: { display: 'grid', gridTemplateColumns: [FR, FR], gap: 8, padding: 8 },
      children: [
        {
          name: 'unbreakable',
          text: 'supercalifragilisticexpialidocious',
          style: { fontSize: 14, lineHeight: 20 },
        },
        {
          name: 'normal',
          text: 'short words wrap fine here',
          style: { fontSize: 14, lineHeight: 20 },
        },
      ],
    },
  },
];
