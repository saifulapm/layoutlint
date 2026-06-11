/**
 * React-component corpus: real .tsx modules executed through the PRODUCT
 * loader (componentToHtml) at oracle time; the renderToStaticMarkup output
 * flows through the same golden pipeline as the Tailwind cases, so the
 * loader + engine are validated end-to-end against Chromium.
 *
 * Components must be deterministic: no Date/random/effects; useState initial
 * values only.
 */
export interface ReactCase {
  name: string;
  viewport: number;
  /** Component module path, relative to the repo root. */
  file: string;
  props?: Record<string, unknown>;
  /** Named export to render (default: the module's default export). */
  component?: string;
}

export const reactCases: ReactCase[] = [
  {
    name: 'react-profile-card',
    viewport: 375,
    file: 'corpora/react/profile-card.tsx',
    props: {
      name: 'Saiful Islam posting under a fairly long display name',
      verified: true,
      tags: ['layout', 'lint', 'react', 'tailwind'],
    },
  },
  {
    name: 'react-button-row',
    viewport: 320,
    file: 'corpora/react/button-row.tsx',
    component: 'ButtonRow',
  },
  {
    name: 'react-pricing-props',
    viewport: 375,
    file: 'corpora/react/pricing-props.tsx',
    props: {
      plans: [
        { name: 'Starter', price: '$0', blurb: 'For trying things out on small projects.' },
        { name: 'Pro', price: '$20', blurb: 'Everything in Starter plus unlimited checks.' },
      ],
    },
  },
];
