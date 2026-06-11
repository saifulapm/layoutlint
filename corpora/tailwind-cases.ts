/**
 * Tailwind-input corpus: JSX/HTML + Tailwind classes, validated end-to-end —
 * parser → resolver → Yoga — against headless Chromium running the real
 * (vendored, pinned) Tailwind v4 browser build. These exercise the resolver;
 * the style-object cases in cases.ts exercise the layout engine in isolation.
 */
export interface TailwindCase {
  name: string;
  viewport: number;
  html: string;
}

const card = `
<div className="p-4">
  <div className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 shadow-sm">
    <div className="flex items-center gap-3">
      <div className="size-10 rounded-full bg-gray-300 shrink-0"></div>
      <div className="flex flex-col min-w-0 flex-1">
        <p className="text-sm font-semibold truncate">Saiful at Lareys posting a fairly long display name</p>
        <p className="text-xs text-gray-500">2 hours ago</p>
      </div>
    </div>
    <p className="text-xl font-bold leading-snug">Layout bugs caught before any browser opens</p>
    <p className="text-sm text-gray-600">The assertion engine measures every text run at every viewport and reports exactly which element overflows and by how many pixels.</p>
    <div className="flex gap-2">
      <button className="px-3 py-1.5 text-sm font-medium rounded-md bg-blue-600 text-white">Run checks</button>
      <button className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300">Dismiss</button>
    </div>
  </div>
</div>`;

const pricing = `
<div className="flex flex-col md:flex-row gap-6 p-6">
  <div className="flex-1 flex flex-col gap-2 border border-gray-200 rounded-lg p-6">
    <p className="text-sm font-medium text-gray-500">Starter</p>
    <p className="text-3xl font-bold">$0</p>
    <p className="text-sm text-gray-600">For trying things out on small projects.</p>
  </div>
  <div className="flex-1 flex flex-col gap-2 border-2 border-blue-600 rounded-lg p-6">
    <p className="text-sm font-medium text-blue-600">Pro</p>
    <p className="text-3xl font-bold">$20</p>
    <p className="text-sm text-gray-600">Everything in Starter plus unlimited checks.</p>
  </div>
</div>`;

export const tailwindCases: TailwindCase[] = [
  { name: 'tw-card', viewport: 320, html: card },
  { name: 'tw-card-wide', viewport: 768, html: card },
  {
    name: 'tw-navbar',
    viewport: 768,
    html: `
<nav className="flex items-center px-4 py-2 border-b border-gray-200 gap-6">
  <span className="text-lg font-bold">agent-eyes</span>
  <div className="flex items-center gap-6 ml-auto">
    <span className="text-sm font-medium">Docs</span>
    <span className="text-sm font-medium">Accuracy</span>
    <span className="text-sm font-medium">GitHub</span>
  </div>
</nav>`,
  },
  {
    name: 'tw-hero',
    viewport: 375,
    html: `
<section className="flex flex-col items-center text-center gap-4 px-4 py-12">
  <h1 className="text-3xl font-bold tracking-tight">Verify layout without a browser</h1>
  <p className="text-lg text-gray-600 max-w-md">Deterministic overflow, overlap and truncation checks for AI coding agents, in milliseconds.</p>
  <div className="flex gap-3">
    <button className="px-4 py-2 rounded-lg bg-black text-white text-sm font-medium">Get started</button>
    <button className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium">Read docs</button>
  </div>
</section>`,
  },
  {
    name: 'tw-stats-responsive',
    viewport: 320,
    html: `
<div className="flex flex-wrap p-4">
  <div className="w-1/2 sm:w-1/4 p-2"><div className="rounded-lg border border-gray-200 p-3"><p className="text-2xl font-bold">128</p><p className="text-xs text-gray-500">Corpus cases</p></div></div>
  <div className="w-1/2 sm:w-1/4 p-2"><div className="rounded-lg border border-gray-200 p-3"><p className="text-2xl font-bold">94%</p><p className="text-xs text-gray-500">Accuracy</p></div></div>
  <div className="w-1/2 sm:w-1/4 p-2"><div className="rounded-lg border border-gray-200 p-3"><p className="text-2xl font-bold">9ms</p><p className="text-xs text-gray-500">Per check</p></div></div>
  <div className="w-1/2 sm:w-1/4 p-2"><div className="rounded-lg border border-gray-200 p-3"><p className="text-2xl font-bold">0</p><p className="text-xs text-gray-500">Browsers</p></div></div>
</div>`,
  },
  {
    name: 'tw-stats-responsive-sm',
    viewport: 768,
    html: `
<div className="flex flex-wrap p-4">
  <div className="w-1/2 sm:w-1/4 p-2"><div className="rounded-lg border border-gray-200 p-3"><p className="text-2xl font-bold">128</p><p className="text-xs text-gray-500">Corpus cases</p></div></div>
  <div className="w-1/2 sm:w-1/4 p-2"><div className="rounded-lg border border-gray-200 p-3"><p className="text-2xl font-bold">94%</p><p className="text-xs text-gray-500">Accuracy</p></div></div>
  <div className="w-1/2 sm:w-1/4 p-2"><div className="rounded-lg border border-gray-200 p-3"><p className="text-2xl font-bold">9ms</p><p className="text-xs text-gray-500">Per check</p></div></div>
  <div className="w-1/2 sm:w-1/4 p-2"><div className="rounded-lg border border-gray-200 p-3"><p className="text-2xl font-bold">0</p><p className="text-xs text-gray-500">Browsers</p></div></div>
</div>`,
  },
  {
    name: 'tw-form',
    viewport: 375,
    html: `
<form className="flex flex-col gap-4 p-6">
  <div className="flex flex-col gap-1">
    <label className="text-sm font-medium">Email address</label>
    <input className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm" />
  </div>
  <div className="flex flex-col gap-1">
    <label className="text-sm font-medium">Password</label>
    <input className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm" />
    <p className="text-xs text-gray-500">Must be at least 12 characters and include one symbol.</p>
  </div>
  <button className="h-10 rounded-md bg-blue-600 text-sm font-semibold text-white">Sign in</button>
</form>`,
  },
  {
    name: 'tw-badges',
    viewport: 320,
    html: `
<div className="flex flex-wrap gap-2 p-4">
  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">deterministic</span>
  <span className="px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-medium">no browser</span>
  <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-xs font-medium">flexbox</span>
  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">tailwind v4</span>
  <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-medium">agent-shaped diagnostics</span>
</div>`,
  },
  {
    name: 'tw-sidebar-layout',
    viewport: 1440,
    html: `
<div className="flex min-h-screen">
  <aside className="w-64 shrink-0 border-r border-gray-200 p-4 flex flex-col gap-2">
    <p className="text-xs font-semibold text-gray-400 tracking-wider">NAVIGATION</p>
    <p className="text-sm font-medium">Dashboard</p>
    <p className="text-sm font-medium">Reports</p>
    <p className="text-sm font-medium">Settings</p>
  </aside>
  <main className="flex-1 p-8 flex flex-col gap-4">
    <h1 className="text-2xl font-bold">Accuracy dashboard</h1>
    <p className="text-sm text-gray-600 max-w-2xl">Every corpus case is rendered by the engine and by headless Chromium; the deltas below are recomputed on every push to main.</p>
  </main>
</div>`,
  },
  {
    name: 'tw-media-object',
    viewport: 375,
    html: `
<div className="flex items-start gap-4 p-4">
  <div className="size-12 rounded-full bg-gray-300 shrink-0"></div>
  <div className="flex-1 min-w-0 flex flex-col gap-1">
    <p className="text-sm font-semibold truncate">A notification title that is clearly too long to fit on one line</p>
    <p className="text-sm text-gray-600">Body copy that wraps normally across multiple lines without truncation.</p>
  </div>
  <span className="text-xs text-gray-400 shrink-0">now</span>
</div>`,
  },
  {
    name: 'tw-alert',
    viewport: 320,
    html: `
<div className="p-4">
  <div className="flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 p-4">
    <div className="size-5 shrink-0 rounded-full bg-amber-400"></div>
    <div className="flex-1 flex flex-col gap-1">
      <p className="text-sm font-semibold">Accuracy regression detected</p>
      <p className="text-sm leading-relaxed">Three corpus cases drifted past the threshold after the Chromium bump. Regenerate the golden files and re-run the comparator.</p>
    </div>
  </div>
</div>`,
  },
  {
    name: 'tw-modal',
    viewport: 375,
    html: `
<div className="relative h-96">
  <div className="absolute inset-0 bg-black/50"></div>
  <div className="absolute inset-x-4 top-12 rounded-xl bg-white p-6 flex flex-col gap-3">
    <p className="text-lg font-semibold">Delete golden files?</p>
    <p className="text-sm text-gray-600">This cannot be undone. The comparator will fail until they are regenerated.</p>
    <div className="flex justify-end gap-2">
      <button className="px-3 py-2 text-sm font-medium rounded-md border border-gray-300">Cancel</button>
      <button className="px-3 py-2 text-sm font-medium rounded-md bg-red-600 text-white">Delete</button>
    </div>
  </div>
</div>`,
  },
  {
    name: 'tw-breadcrumbs',
    viewport: 768,
    html: `
<nav className="flex items-center space-x-2 px-6 py-3 text-sm">
  <span className="text-gray-500">corpora</span>
  <span className="text-gray-400">/</span>
  <span className="text-gray-500">tailwind</span>
  <span className="text-gray-400">/</span>
  <span className="font-medium">tw-breadcrumbs.tsx</span>
</nav>`,
  },
  {
    name: 'tw-footer',
    viewport: 375,
    html: `
<footer className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-8 border-t border-gray-200">
  <p className="text-sm text-gray-500">© 2026 Lareys. MIT licensed.</p>
  <div className="flex gap-4">
    <span className="text-sm font-medium">Privacy</span>
    <span className="text-sm font-medium">Terms</span>
    <span className="text-sm font-medium">Status</span>
  </div>
</footer>`,
  },
  {
    name: 'tw-bangla-profile',
    viewport: 320,
    html: `
<div className="flex flex-col items-center gap-3 p-6 text-center">
  <div className="size-20 rounded-full bg-gray-300"></div>
  <p className="text-xl font-semibold">সাইফুল ইসলাম</p>
  <p className="text-sm leading-relaxed text-gray-600 max-w-xs">ঢাকায় বসবাসকারী একজন সফটওয়্যার প্রকৌশলী। ওপেন সোর্স টুল তৈরি করতে ভালোবাসেন এবং বাংলা ভাষায় প্রযুক্তি নিয়ে লেখালেখি করেন।</p>
</div>`,
  },
];
