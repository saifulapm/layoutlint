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
];
