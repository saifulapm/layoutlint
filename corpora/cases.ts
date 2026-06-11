import type { CorpusCase } from '@agent-eyes/core';

/**
 * Corpus v0, first 10 of 50. Hardcoded style-object trees (Phase 0 — no
 * parser). Each case is rendered identically by the Yoga engine and by
 * headless Chromium (the oracle); boxes must match within threshold.
 *
 * Text cases set an explicit px lineHeight: `line-height: normal` parity is
 * deliberately out of scope for the spike.
 */
export const cases: CorpusCase[] = [
  {
    name: 'row-fixed-gap',
    viewport: 320,
    tree: {
      name: 'root',
      style: { flexDirection: 'row', gap: 8, padding: 16 },
      children: [
        { name: 'box-a', style: { width: 80, height: 40 } },
        { name: 'box-b', style: { width: 80, height: 40 } },
        { name: 'box-c', style: { width: 80, height: 40 } },
      ],
    },
  },
  {
    name: 'column-padding-margin',
    viewport: 375,
    tree: {
      name: 'root',
      style: { flexDirection: 'column', padding: 12 },
      children: [
        { name: 'header', style: { height: 48, marginBottom: 16 } },
        {
          name: 'card',
          style: { flexDirection: 'column', padding: 20, marginLeft: 8, marginRight: 8 },
          children: [
            { name: 'card-line-1', style: { height: 24, marginBottom: 8 } },
            { name: 'card-line-2', style: { height: 24 } },
          ],
        },
        { name: 'footer', style: { height: 32, marginTop: 16 } },
      ],
    },
  },
  {
    name: 'nested-flex-grow',
    viewport: 768,
    tree: {
      name: 'root',
      style: { flexDirection: 'row', gap: 12, padding: 16 },
      children: [
        {
          name: 'sidebar',
          style: { flexGrow: 1, flexDirection: 'column', gap: 8 },
          children: [
            { name: 'nav-item-1', style: { height: 36 } },
            { name: 'nav-item-2', style: { height: 36 } },
          ],
        },
        {
          name: 'main',
          style: { flexGrow: 2, flexDirection: 'column' },
          children: [{ name: 'content', style: { height: 120 } }],
        },
        { name: 'aside', style: { width: 200, height: 80 } },
      ],
    },
  },
  {
    name: 'wrapping-text',
    viewport: 320,
    tree: {
      name: 'root',
      style: { flexDirection: 'column', padding: 16, gap: 8 },
      children: [
        {
          name: 'heading',
          style: { fontSize: 24, lineHeight: 32, fontWeight: 700 },
          text: 'Deterministic layout checks for coding agents',
        },
        {
          name: 'body',
          style: { fontSize: 16, lineHeight: 24 },
          text: 'Verify that text does not overflow and elements do not overlap, in milliseconds, with no browser and no screenshots involved at all.',
        },
      ],
    },
  },
  {
    name: 'fixed-vs-auto-row',
    viewport: 375,
    tree: {
      name: 'root',
      style: { flexDirection: 'row', padding: 12, gap: 12, alignItems: 'center' },
      children: [
        { name: 'avatar', style: { width: 48, height: 48 } },
        {
          name: 'details',
          style: { flexGrow: 1, flexDirection: 'column', gap: 4 },
          children: [
            { name: 'title-bar', style: { height: 20 } },
            { name: 'subtitle-bar', style: { height: 16, maxWidth: 160 } },
          ],
        },
        { name: 'action', style: { width: 64, height: 32 } },
      ],
    },
  },
  {
    name: 'min-max-constraints',
    viewport: 768,
    tree: {
      name: 'root',
      style: { flexDirection: 'row', gap: 16, padding: 16 },
      children: [
        { name: 'clamped-min', style: { flexGrow: 1, minWidth: 250, height: 60 } },
        { name: 'clamped-max', style: { flexGrow: 1, maxWidth: 180, height: 60 } },
        { name: 'free', style: { flexGrow: 1, height: 60 } },
      ],
    },
  },
  {
    name: 'long-unbroken-string',
    viewport: 320,
    tree: {
      name: 'root',
      style: { flexDirection: 'column', padding: 16 },
      children: [
        {
          name: 'url-text',
          style: { fontSize: 16, lineHeight: 24 },
          text: 'See https://example.com/extremely/long/unbroken/path/that/cannot/wrap/anywhere for details on the supercalifragilisticexpialidocious configuration.',
        },
      ],
    },
  },
  {
    name: 'emoji-text',
    viewport: 375,
    tree: {
      name: 'root',
      style: { flexDirection: 'column', padding: 16 },
      children: [
        {
          name: 'emoji-line',
          style: { fontSize: 16, lineHeight: 24 },
          text: 'Launch day 🚀 went great 🎉 and the whole team 😀 celebrated with cake 🍰 until late.',
        },
      ],
    },
  },
  {
    name: 'bangla-text',
    viewport: 320,
    tree: {
      name: 'root',
      style: { flexDirection: 'column', padding: 16 },
      children: [
        {
          name: 'bangla-paragraph',
          style: { fontSize: 16, lineHeight: 28 },
          text: 'বাংলা ভাষা দক্ষিণ এশিয়ার একটি সমৃদ্ধ ভাষা। এই ভাষায় প্রায় ত্রিশ কোটি মানুষ কথা বলে এবং এটি পৃথিবীর অন্যতম প্রধান ভাষা।',
        },
      ],
    },
  },
  {
    name: 'space-between-wrap',
    viewport: 375,
    tree: {
      name: 'root',
      style: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 8,
        padding: 16,
      },
      children: [
        { name: 'chip-1', style: { width: 96, height: 28 } },
        { name: 'chip-2', style: { width: 120, height: 28 } },
        { name: 'chip-3', style: { width: 80, height: 28 } },
        { name: 'chip-4', style: { width: 140, height: 28 } },
        { name: 'chip-5', style: { width: 104, height: 28 } },
      ],
    },
  },

  // ---- alignment & direction (11–18) --------------------------------------
  {
    name: 'row-reverse-fixed',
    viewport: 375,
    tree: {
      name: 'root',
      style: { flexDirection: 'row-reverse', gap: 8, padding: 16 },
      children: [
        { name: 'first', style: { width: 80, height: 40 } },
        { name: 'second', style: { width: 60, height: 40 } },
        { name: 'third', style: { width: 100, height: 40 } },
      ],
    },
  },
  {
    name: 'justify-center-row',
    viewport: 375,
    tree: {
      name: 'root',
      style: { flexDirection: 'row', justifyContent: 'center', gap: 12, padding: 8 },
      children: [
        { name: 'box-a', style: { width: 90, height: 36 } },
        { name: 'box-b', style: { width: 90, height: 36 } },
      ],
    },
  },
  {
    name: 'justify-space-around',
    viewport: 768,
    tree: {
      name: 'root',
      style: { flexDirection: 'row', justifyContent: 'space-around', padding: 16 },
      children: [
        { name: 'box-a', style: { width: 120, height: 48 } },
        { name: 'box-b', style: { width: 120, height: 48 } },
        { name: 'box-c', style: { width: 120, height: 48 } },
      ],
    },
  },
  {
    name: 'justify-space-evenly',
    viewport: 768,
    tree: {
      name: 'root',
      style: { flexDirection: 'row', justifyContent: 'space-evenly', padding: 16 },
      children: [
        { name: 'box-a', style: { width: 100, height: 48 } },
        { name: 'box-b', style: { width: 100, height: 48 } },
        { name: 'box-c', style: { width: 100, height: 48 } },
      ],
    },
  },
  {
    name: 'align-items-flex-end',
    viewport: 375,
    tree: {
      name: 'root',
      style: { flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 8, padding: 8 },
      children: [
        { name: 'short', style: { width: 60, height: 30 } },
        { name: 'tall', style: { width: 60, height: 90 } },
        { name: 'medium', style: { width: 60, height: 60 } },
      ],
    },
  },
  {
    name: 'align-self-mixed',
    viewport: 375,
    tree: {
      name: 'root',
      style: { flexDirection: 'row', height: 140, gap: 8, padding: 8 },
      children: [
        { name: 'stretched', style: { width: 70 } },
        { name: 'centered', style: { width: 70, height: 48, alignSelf: 'center' } },
        { name: 'pinned-end', style: { width: 70, height: 48, alignSelf: 'flex-end' } },
        { name: 'pinned-start', style: { width: 70, height: 48, alignSelf: 'flex-start' } },
      ],
    },
  },
  {
    name: 'column-justify-center',
    viewport: 375,
    tree: {
      name: 'root',
      style: { flexDirection: 'column', justifyContent: 'center', height: 400, gap: 16 },
      children: [
        { name: 'item-a', style: { height: 60 } },
        { name: 'item-b', style: { height: 60 } },
      ],
    },
  },
  {
    name: 'column-reverse',
    viewport: 320,
    tree: {
      name: 'root',
      style: { flexDirection: 'column-reverse', gap: 12, padding: 16 },
      children: [
        { name: 'logically-first', style: { height: 40 } },
        { name: 'logically-second', style: { height: 56 } },
        { name: 'logically-third', style: { height: 32 } },
      ],
    },
  },

  // ---- wrapping (19–22) ----------------------------------------------------
  {
    name: 'wrap-align-content-stretch',
    viewport: 375,
    tree: {
      name: 'root',
      style: { flexDirection: 'row', flexWrap: 'wrap', height: 200, gap: 10, padding: 10 },
      children: [
        { name: 'tile-1', style: { width: 150 } },
        { name: 'tile-2', style: { width: 150 } },
        { name: 'tile-3', style: { width: 150 } },
        { name: 'tile-4', style: { width: 150 } },
      ],
    },
  },
  {
    name: 'wrap-reverse-chips',
    viewport: 320,
    tree: {
      name: 'root',
      style: { flexDirection: 'row', flexWrap: 'wrap-reverse', gap: 8, padding: 12 },
      children: [
        { name: 'chip-1', style: { width: 110, height: 28 } },
        { name: 'chip-2', style: { width: 110, height: 28 } },
        { name: 'chip-3', style: { width: 110, height: 28 } },
        { name: 'chip-4', style: { width: 110, height: 28 } },
      ],
    },
  },
  {
    name: 'wrap-mixed-gaps',
    viewport: 375,
    tree: {
      name: 'root',
      style: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 4, columnGap: 16, padding: 12 },
      children: [
        { name: 'cell-1', style: { width: 100, height: 40 } },
        { name: 'cell-2', style: { width: 100, height: 40 } },
        { name: 'cell-3', style: { width: 100, height: 40 } },
        { name: 'cell-4', style: { width: 100, height: 40 } },
        { name: 'cell-5', style: { width: 100, height: 40 } },
      ],
    },
  },
  {
    name: 'wrap-single-overflowing-line',
    viewport: 320,
    tree: {
      name: 'root',
      style: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 8 },
      children: [
        { name: 'wide-1', style: { width: 280, height: 36 } },
        { name: 'wide-2', style: { width: 280, height: 36 } },
      ],
    },
  },

  // ---- sizing (23–31) --------------------------------------------------------
  {
    name: 'percent-width-children',
    viewport: 375,
    tree: {
      name: 'root',
      style: { flexDirection: 'column' },
      children: [
        { name: 'half', style: { width: '50%', height: 40 } },
        { name: 'quarter', style: { width: '25%', height: 40 } },
        { name: 'three-quarter', style: { width: '75%', height: 40 } },
      ],
    },
  },
  {
    name: 'percent-width-with-parent-padding',
    viewport: 375,
    tree: {
      name: 'root',
      style: { flexDirection: 'column', padding: 20 },
      children: [{ name: 'half-of-content-box', style: { width: '50%', height: 40 } }],
    },
  },
  {
    name: 'flex-basis-fixed',
    viewport: 768,
    tree: {
      name: 'root',
      style: { flexDirection: 'row', gap: 12, padding: 16 },
      children: [
        { name: 'basis-only', style: { flexBasis: 120, height: 48 } },
        { name: 'basis-grow', style: { flexBasis: 120, flexGrow: 1, height: 48 } },
        { name: 'basis-grow-2x', style: { flexBasis: 120, flexGrow: 2, height: 48 } },
      ],
    },
  },
  {
    name: 'flex-basis-percent',
    viewport: 768,
    tree: {
      name: 'root',
      style: { flexDirection: 'row', gap: 16, padding: 16 },
      children: [
        { name: 'basis-30', style: { flexBasis: '30%', height: 48 } },
        { name: 'basis-50', style: { flexBasis: '50%', height: 48 } },
      ],
    },
  },
  {
    name: 'shrink-proportional',
    viewport: 320,
    tree: {
      name: 'root',
      style: { flexDirection: 'row' },
      children: [
        { name: 'squeezed-a', style: { width: 240, height: 40 } },
        { name: 'squeezed-b', style: { width: 240, height: 40 } },
      ],
    },
  },
  {
    name: 'shrink-uneven',
    viewport: 320,
    tree: {
      name: 'root',
      style: { flexDirection: 'row' },
      children: [
        { name: 'rigid', style: { width: 240, height: 40, flexShrink: 1 } },
        { name: 'squishy', style: { width: 240, height: 40, flexShrink: 3 } },
      ],
    },
  },
  {
    name: 'min-width-freeze-redistribute',
    viewport: 768,
    tree: {
      name: 'root',
      style: { flexDirection: 'row', gap: 16, padding: 16 },
      children: [
        { name: 'wants-400', style: { flexGrow: 1, minWidth: 400, height: 60 } },
        { name: 'takes-rest', style: { flexGrow: 1, height: 60 } },
      ],
    },
  },
  {
    name: 'max-width-cap-single',
    viewport: 768,
    tree: {
      name: 'root',
      style: { flexDirection: 'row', padding: 16 },
      children: [{ name: 'capped', style: { flexGrow: 1, maxWidth: 200, height: 60 } }],
    },
  },
  {
    name: 'max-height-shrink-children',
    viewport: 375,
    tree: {
      name: 'root',
      style: { flexDirection: 'column', maxHeight: 100, padding: 8 },
      children: [
        { name: 'wants-80-a', style: { height: 80 } },
        { name: 'wants-80-b', style: { height: 80 } },
      ],
    },
  },

  // ---- spacing (32–36) -------------------------------------------------------
  {
    name: 'asymmetric-padding',
    viewport: 320,
    tree: {
      name: 'root',
      style: {
        flexDirection: 'column',
        paddingTop: 8,
        paddingRight: 24,
        paddingBottom: 16,
        paddingLeft: 4,
      },
      children: [{ name: 'content', style: { height: 48 } }],
    },
  },
  {
    name: 'margin-auto-push',
    viewport: 375,
    tree: {
      name: 'root',
      style: { flexDirection: 'row', padding: 12, alignItems: 'center' },
      children: [
        { name: 'brand', style: { width: 96, height: 32 } },
        { name: 'pushed-right', style: { width: 64, height: 32, marginLeft: 'auto' } },
      ],
    },
  },
  {
    name: 'margin-auto-center',
    viewport: 768,
    tree: {
      name: 'root',
      style: { flexDirection: 'column', padding: 16 },
      children: [
        {
          name: 'centered-block',
          style: { width: 200, height: 80, marginLeft: 'auto', marginRight: 'auto' },
        },
      ],
    },
  },
  {
    name: 'negative-margin-overlap',
    viewport: 375,
    tree: {
      name: 'root',
      style: { flexDirection: 'column', padding: 16 },
      children: [
        { name: 'banner', style: { height: 96 } },
        { name: 'pulled-up-card', style: { height: 64, marginTop: -24, marginLeft: 16, marginRight: 16 } },
      ],
    },
  },
  {
    name: 'nested-padding-stack',
    viewport: 320,
    tree: {
      name: 'outer',
      style: { flexDirection: 'column', padding: 16 },
      children: [
        {
          name: 'middle',
          style: { flexDirection: 'column', padding: 12 },
          children: [
            {
              name: 'inner',
              style: { flexDirection: 'column', padding: 8 },
              children: [{ name: 'leaf', style: { height: 24 } }],
            },
          ],
        },
      ],
    },
  },

  // ---- positioning (37–40) ---------------------------------------------------
  {
    name: 'absolute-top-left',
    viewport: 375,
    tree: {
      name: 'root',
      style: { flexDirection: 'column', position: 'relative', height: 200, padding: 16 },
      children: [
        { name: 'in-flow', style: { height: 48 } },
        { name: 'badge', style: { position: 'absolute', top: 10, left: 10, width: 40, height: 40 } },
      ],
    },
  },
  {
    name: 'absolute-right-bottom',
    viewport: 375,
    tree: {
      name: 'root',
      style: { flexDirection: 'column', position: 'relative', height: 240 },
      children: [
        { name: 'in-flow', style: { height: 60 } },
        { name: 'fab', style: { position: 'absolute', right: 16, bottom: 16, width: 56, height: 56 } },
      ],
    },
  },
  {
    name: 'absolute-inset-overlay',
    viewport: 375,
    tree: {
      name: 'root',
      style: { flexDirection: 'column', position: 'relative', height: 180, padding: 12 },
      children: [
        { name: 'content', style: { height: 80 } },
        {
          name: 'overlay',
          style: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
        },
      ],
    },
  },
  {
    name: 'relative-offset',
    viewport: 320,
    tree: {
      name: 'root',
      style: { flexDirection: 'column', padding: 16, gap: 8 },
      children: [
        { name: 'anchor', style: { height: 40 } },
        { name: 'nudged', style: { position: 'relative', top: 12, left: 20, height: 40 } },
        { name: 'after-nudged', style: { height: 40 } },
      ],
    },
  },

  // ---- §9.7 flexible-length resolution (the flexfix pass) -------------------
  {
    name: 'shrink-with-min-floor',
    viewport: 320,
    tree: {
      name: 'root',
      style: { flexDirection: 'row', gap: 8 },
      children: [
        { name: 'floored', style: { width: 200, minWidth: 170, height: 40 } },
        { name: 'free-shrink', style: { width: 200, height: 40 } },
      ],
    },
  },
  {
    name: 'grow-max-redistribute-pair',
    viewport: 768,
    tree: {
      name: 'root',
      style: { flexDirection: 'row', gap: 12, padding: 12 },
      children: [
        { name: 'capped-a', style: { flexGrow: 1, maxWidth: 120, height: 40 } },
        { name: 'capped-b', style: { flexGrow: 1, maxWidth: 150, height: 40 } },
        { name: 'absorbs-rest', style: { flexGrow: 1, height: 40 } },
      ],
    },
  },
  {
    name: 'truncate-text-next-to-fixed',
    viewport: 320,
    tree: {
      name: 'root',
      style: { flexDirection: 'row', gap: 8, padding: 8 },
      children: [
        { name: 'leading-box', style: { width: 180, height: 24 } },
        {
          name: 'squeezed-truncate',
          style: { flexGrow: 1, fontSize: 14, lineHeight: 24, whiteSpace: 'nowrap', overflow: 'hidden' },
          text: 'a single line that will certainly not fit in the leftover space',
        },
      ],
    },
  },
  {
    name: 'two-texts-share-row',
    viewport: 375,
    tree: {
      name: 'root',
      style: { flexDirection: 'row', gap: 12, padding: 12 },
      children: [
        {
          name: 'left-text',
          style: { fontSize: 14, lineHeight: 20 },
          text: 'shorter label here',
        },
        {
          name: 'right-text',
          style: { fontSize: 14, lineHeight: 20 },
          text: 'a considerably longer piece of text that wants much more of the row',
        },
      ],
    },
  },
  {
    name: 'nested-corrected-rows',
    viewport: 375,
    tree: {
      name: 'root',
      style: { flexDirection: 'row', gap: 8, padding: 8 },
      children: [
        { name: 'outer-fixed', style: { width: 100, height: 80, minWidth: 80 } },
        {
          name: 'inner-row',
          style: { flexGrow: 1, flexDirection: 'row', gap: 8 },
          children: [
            { name: 'inner-capped', style: { flexGrow: 1, maxWidth: 60, height: 80 } },
            { name: 'inner-free', style: { flexGrow: 1, height: 80 } },
          ],
        },
      ],
    },
  },
  {
    name: 'percent-basis-with-min',
    viewport: 768,
    tree: {
      name: 'root',
      style: { flexDirection: 'row', gap: 16, padding: 16 },
      children: [
        { name: 'basis-20-min-200', style: { flexBasis: '20%', minWidth: 200, height: 40 } },
        { name: 'basis-80', style: { flexBasis: '80%', height: 40 } },
      ],
    },
  },

  // ---- text (41–50) ------------------------------------------------------------
  {
    name: 'text-in-row-shrink',
    viewport: 375,
    tree: {
      name: 'root',
      style: { flexDirection: 'row', gap: 8, padding: 12 },
      children: [
        { name: 'icon', style: { width: 80, height: 80 } },
        {
          name: 'label',
          style: { flexGrow: 1, fontSize: 16, lineHeight: 24 },
          text: 'A medium-length label that has to wrap inside the space remaining next to the icon.',
        },
      ],
    },
  },
  {
    name: 'text-min-content-floor',
    viewport: 320,
    tree: {
      name: 'root',
      style: { flexDirection: 'row', gap: 8 },
      children: [
        { name: 'wide-fixed', style: { width: 240, height: 48 } },
        {
          name: 'cramped-text',
          style: { flexGrow: 1, fontSize: 16, lineHeight: 24 },
          text: 'deterministic verification',
        },
      ],
    },
  },
  {
    name: 'text-center-natural-width',
    viewport: 375,
    tree: {
      name: 'root',
      style: { flexDirection: 'column', alignItems: 'center', padding: 16 },
      children: [
        { name: 'short-label', style: { fontSize: 16, lineHeight: 24 }, text: 'Centered label' },
      ],
    },
  },
  {
    name: 'text-letter-spacing',
    viewport: 375,
    tree: {
      name: 'root',
      style: { flexDirection: 'column', padding: 16 },
      children: [
        {
          name: 'spaced-heading',
          style: { fontSize: 14, lineHeight: 20, letterSpacing: 1 },
          text: 'OVERVIEW AND DETAILED METRICS FOR THE CURRENT REPORTING PERIOD',
        },
      ],
    },
  },
  {
    name: 'text-small-caption',
    viewport: 320,
    tree: {
      name: 'root',
      style: { flexDirection: 'column', padding: 12 },
      children: [
        {
          name: 'caption',
          style: { fontSize: 12, lineHeight: 16 },
          text: 'Generated automatically from the layout engine accuracy harness; values are compared against headless Chromium golden files on every run.',
        },
      ],
    },
  },
  {
    name: 'wide-single-line-1440',
    viewport: 1440,
    tree: {
      name: 'root',
      style: { flexDirection: 'column', padding: 24 },
      children: [
        {
          name: 'one-liner',
          style: { fontSize: 18, lineHeight: 28 },
          text: 'At desktop widths this sentence fits comfortably on a single line without wrapping.',
        },
      ],
    },
  },
  {
    name: 'mixed-bangla-latin',
    viewport: 320,
    tree: {
      name: 'root',
      style: { flexDirection: 'column', padding: 16 },
      children: [
        {
          name: 'mixed-paragraph',
          style: { fontSize: 16, lineHeight: 28 },
          text: 'আমরা TypeScript দিয়ে UI যাচাই করি এবং Chrome ছাড়াই layout বাগ ধরি।',
        },
      ],
    },
  },
  {
    name: 'emoji-only-row',
    viewport: 375,
    tree: {
      name: 'root',
      style: { flexDirection: 'column', padding: 16 },
      children: [
        { name: 'reactions', style: { fontSize: 24, lineHeight: 32 }, text: '🚀🎉😀🍰' },
      ],
    },
  },
  {
    name: 'text-with-padding',
    viewport: 320,
    tree: {
      name: 'root',
      style: { flexDirection: 'column', padding: 16 },
      children: [
        {
          name: 'padded-note',
          style: { padding: 12, fontSize: 16, lineHeight: 24 },
          text: 'Padding on a text node must shrink the wrap width and grow the box height symmetrically.',
        },
      ],
    },
  },
  {
    name: 'card-kitchen-sink',
    viewport: 320,
    tree: {
      name: 'root',
      style: { flexDirection: 'column', padding: 16 },
      children: [
        {
          name: 'card',
          style: { flexDirection: 'column', padding: 16, gap: 12 },
          children: [
            {
              name: 'card-header',
              style: { flexDirection: 'row', gap: 12, alignItems: 'center' },
              children: [
                { name: 'avatar', style: { width: 40, height: 40 } },
                {
                  name: 'author',
                  style: { flexGrow: 1, fontSize: 14, lineHeight: 20, fontWeight: 700 },
                  text: 'Saiful at Lareys',
                },
              ],
            },
            {
              name: 'card-title',
              style: { fontSize: 20, lineHeight: 28, fontWeight: 700 },
              text: 'Layout bugs caught before the browser ever opens',
            },
            {
              name: 'card-body',
              style: { fontSize: 14, lineHeight: 20 },
              text: 'The assertion engine walks every viewport, measures every text run, and reports exactly which element overflows and by how many pixels.',
            },
            {
              name: 'card-actions',
              style: { flexDirection: 'row', gap: 8 },
              children: [
                {
                  name: 'primary-btn',
                  style: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingTop: 6,
                    paddingBottom: 6,
                    paddingLeft: 12,
                    paddingRight: 12,
                  },
                  children: [
                    { name: 'primary-btn-label', style: { fontSize: 14, lineHeight: 20 }, text: 'Run checks' },
                  ],
                },
                {
                  name: 'ghost-btn',
                  style: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingTop: 6,
                    paddingBottom: 6,
                    paddingLeft: 12,
                    paddingRight: 12,
                  },
                  children: [
                    { name: 'ghost-btn-label', style: { fontSize: 14, lineHeight: 20 }, text: 'Dismiss' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  },
];
