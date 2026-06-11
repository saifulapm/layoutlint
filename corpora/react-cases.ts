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
    name: 'react-css-import',
    viewport: 375,
    file: 'corpora/react/css-import.tsx',
  },
  {
    name: 'react-css-module',
    viewport: 320,
    file: 'corpora/react/css-module.tsx',
    component: 'StatusBadge',
    props: { status: 'Deployed to production' },
  },
  {
    name: 'react-asset-logo',
    viewport: 375,
    file: 'corpora/react/asset-logo.tsx',
  },
  {
    name: 'react-multi-file',
    viewport: 768,
    file: 'corpora/react/multi-file.tsx',
  },
  {
    name: 'react-alias-import',
    viewport: 320,
    file: 'corpora/react/alias-import.tsx',
  },
  {
    name: 'react-memo-card',
    viewport: 375,
    file: 'corpora/react/memo-card.tsx',
  },
  {
    name: 'react-named-exports',
    viewport: 375,
    file: 'corpora/react/named-exports.tsx',
    component: 'Footer',
  },
  {
    name: 'react-settings-form',
    viewport: 375,
    file: 'corpora/react/settings-form.tsx',
  },
  {
    name: 'react-stat-dashboard',
    viewport: 375,
    file: 'corpora/react/stat-dashboard.tsx',
  },
  {
    name: 'react-navbar-signed-in',
    viewport: 768,
    file: 'corpora/react/navbar-auth.tsx',
    props: { signedIn: true, userName: 'Saiful Islam Khan' },
  },
  {
    name: 'react-navbar-signed-out',
    viewport: 375,
    file: 'corpora/react/navbar-auth.tsx',
  },
  {
    name: 'react-chat-list',
    viewport: 375,
    file: 'corpora/react/chat-list.tsx',
  },
  {
    name: 'react-data-table',
    viewport: 768,
    file: 'corpora/react/data-table.tsx',
    props: {
      rows: [
        { name: 'golden-generator', status: 'Healthy', region: 'us-east-1' },
        { name: 'paint-comparator-with-a-very-long-service-name', status: 'Degraded', region: 'eu-central-1' },
        { name: 'mcp-server', status: 'Healthy', region: 'ap-southeast-1' },
      ],
    },
  },
  {
    name: 'react-context-theme',
    viewport: 375,
    file: 'corpora/react/context-theme.tsx',
    props: { density: 'comfortable' },
  },
  {
    name: 'react-banner',
    viewport: 320,
    file: 'corpora/react/banner-dismissible.tsx',
  },
  {
    name: 'react-footer-columns',
    viewport: 320,
    file: 'corpora/react/footer-columns.tsx',
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
