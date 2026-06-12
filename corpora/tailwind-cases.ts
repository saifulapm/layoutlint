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

  // ---- batch 2 ---------------------------------------------------------------
  {
    name: 'tw-settings-row',
    viewport: 768,
    html: `
<div className="flex flex-col">
  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
    <div className="flex flex-col gap-0.5">
      <p className="text-sm font-medium">Email notifications</p>
      <p className="text-sm text-gray-500">Receive a digest of failed layout checks every morning.</p>
    </div>
    <div className="w-11 h-6 rounded-full bg-blue-600 shrink-0 ml-4"></div>
  </div>
  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
    <div className="flex flex-col gap-0.5">
      <p className="text-sm font-medium">Public scoreboard</p>
      <p className="text-sm text-gray-500">Publish accuracy results on your profile.</p>
    </div>
    <div className="w-11 h-6 rounded-full bg-gray-300 shrink-0 ml-4"></div>
  </div>
</div>`,
  },
  {
    name: 'tw-chat-bubbles',
    viewport: 375,
    html: `
<div className="flex flex-col gap-3 p-4">
  <div className="flex justify-start">
    <div className="max-w-[80%] rounded-2xl bg-gray-100 px-4 py-2">
      <p className="text-sm">Did the corpus regenerate after the Chromium bump?</p>
    </div>
  </div>
  <div className="flex justify-end">
    <div className="max-w-[80%] rounded-2xl bg-blue-600 px-4 py-2">
      <p className="text-sm text-white">Yes — 65 of 65 within threshold, three were fixed by the flex resolution pass.</p>
    </div>
  </div>
  <div className="flex justify-start">
    <div className="max-w-[80%] rounded-2xl bg-gray-100 px-4 py-2">
      <p className="text-sm">ship it 🚀</p>
    </div>
  </div>
</div>`,
  },
  {
    name: 'tw-pagination',
    viewport: 375,
    html: `
<div className="flex items-center justify-between px-4 py-3">
  <button className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-md">Previous</button>
  <div className="flex items-center gap-1">
    <span className="size-8 flex items-center justify-center text-sm rounded-md bg-blue-600 text-white">1</span>
    <span className="size-8 flex items-center justify-center text-sm rounded-md">2</span>
    <span className="size-8 flex items-center justify-center text-sm rounded-md">3</span>
  </div>
  <button className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-md">Next</button>
</div>`,
  },
  {
    name: 'tw-tabs',
    viewport: 375,
    html: `
<div className="flex flex-col">
  <div className="flex border-b border-gray-200 px-4">
    <span className="px-4 py-2.5 text-sm font-medium border-b-2 border-blue-600 text-blue-600">Overview</span>
    <span className="px-4 py-2.5 text-sm font-medium text-gray-500">Violations</span>
    <span className="px-4 py-2.5 text-sm font-medium text-gray-500">History</span>
  </div>
  <div className="p-4">
    <p className="text-sm text-gray-600">All four rules passed at every configured viewport on the last run.</p>
  </div>
</div>`,
  },
  {
    name: 'tw-toast',
    viewport: 375,
    html: `
<div className="p-4">
  <div className="flex items-center gap-3 rounded-lg bg-gray-900 px-4 py-3">
    <div className="size-5 rounded-full bg-green-400 shrink-0"></div>
    <p className="flex-1 text-sm text-white min-w-0">Layout check passed at all 4 viewports</p>
    <span className="text-sm font-medium text-gray-400 shrink-0">Undo</span>
  </div>
</div>`,
  },
  {
    name: 'tw-stepper',
    viewport: 768,
    html: `
<div className="flex items-center gap-2 p-6">
  <div className="flex items-center gap-2 shrink-0">
    <div className="size-8 rounded-full bg-blue-600 flex items-center justify-center"><span className="text-sm font-semibold text-white">1</span></div>
    <span className="text-sm font-medium">Parse</span>
  </div>
  <div className="flex-1 h-0.5 bg-gray-200"></div>
  <div className="flex items-center gap-2 shrink-0">
    <div className="size-8 rounded-full bg-blue-600 flex items-center justify-center"><span className="text-sm font-semibold text-white">2</span></div>
    <span className="text-sm font-medium">Resolve</span>
  </div>
  <div className="flex-1 h-0.5 bg-gray-200"></div>
  <div className="flex items-center gap-2 shrink-0">
    <div className="size-8 rounded-full border-2 border-gray-300 flex items-center justify-center"><span className="text-sm font-semibold text-gray-500">3</span></div>
    <span className="text-sm font-medium text-gray-500">Assert</span>
  </div>
</div>`,
  },
  {
    name: 'tw-file-rows',
    viewport: 375,
    html: `
<div className="flex flex-col px-2">
  <div className="flex items-center gap-3 px-3 py-2 rounded-md">
    <div className="size-4 bg-amber-400 shrink-0"></div>
    <span className="flex-1 text-sm truncate min-w-0">packages/core/src/extremely-long-module-name-that-truncates.ts</span>
    <span className="text-xs text-gray-400 shrink-0">2.1 kB</span>
  </div>
  <div className="flex items-center gap-3 px-3 py-2 rounded-md">
    <div className="size-4 bg-blue-400 shrink-0"></div>
    <span className="flex-1 text-sm truncate min-w-0">layout.ts</span>
    <span className="text-xs text-gray-400 shrink-0">8.4 kB</span>
  </div>
  <div className="flex items-center gap-3 px-3 py-2 rounded-md">
    <div className="size-4 bg-blue-400 shrink-0"></div>
    <span className="flex-1 text-sm truncate min-w-0">flexfix.ts</span>
    <span className="text-xs text-gray-400 shrink-0">6.0 kB</span>
  </div>
</div>`,
  },
  {
    name: 'tw-comment-thread',
    viewport: 375,
    html: `
<div className="flex flex-col gap-4 p-4">
  <div className="flex gap-3">
    <div className="size-8 rounded-full bg-gray-300 shrink-0"></div>
    <div className="flex-1 flex flex-col gap-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold truncate">chenglou</span>
        <span className="text-xs text-gray-400 shrink-0">3h</span>
      </div>
      <p className="text-sm text-gray-700">The oracle method generalizes really well here. Curious about the grid story.</p>
    </div>
  </div>
  <div className="flex gap-3 pl-11">
    <div className="size-8 rounded-full bg-gray-300 shrink-0"></div>
    <div className="flex-1 flex flex-col gap-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold truncate">saiful</span>
        <span className="text-xs text-gray-400 shrink-0">2h</span>
      </div>
      <p className="text-sm text-gray-700">Taffy WASM is on the roadmap — same comparator, second engine.</p>
    </div>
  </div>
</div>`,
  },
  {
    name: 'tw-login-page',
    viewport: 375,
    html: `
<div className="flex flex-col items-center px-6 py-12 gap-6">
  <div className="size-12 rounded-xl bg-gray-900"></div>
  <div className="flex flex-col items-center gap-1">
    <h1 className="text-2xl font-bold">Welcome back</h1>
    <p className="text-sm text-gray-500">Sign in to view your accuracy dashboard</p>
  </div>
  <div className="w-full max-w-sm flex flex-col gap-3">
    <input className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm" />
    <input className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm" />
    <button className="h-10 w-full rounded-md bg-blue-600 text-sm font-semibold text-white">Continue</button>
  </div>
  <p className="text-sm text-gray-500">No account? <span className="font-medium text-blue-600">Start free</span></p>
</div>`,
  },
  {
    name: 'tw-table-as-flex',
    viewport: 768,
    html: `
<div className="flex flex-col px-6 py-4">
  <div className="flex items-center gap-4 py-2 border-b border-gray-200">
    <span className="w-2/5 text-xs font-semibold text-gray-500 tracking-wider">CASE</span>
    <span className="w-1/5 text-xs font-semibold text-gray-500 tracking-wider">VIEWPORT</span>
    <span className="w-1/5 text-xs font-semibold text-gray-500 tracking-wider">MAX DELTA</span>
    <span className="w-1/5 text-xs font-semibold text-gray-500 tracking-wider">RESULT</span>
  </div>
  <div className="flex items-center gap-4 py-3 border-b border-gray-100">
    <span className="w-2/5 text-sm truncate">min-max-constraints</span>
    <span className="w-1/5 text-sm text-gray-500">768</span>
    <span className="w-1/5 text-sm text-gray-500">0.00</span>
    <span className="w-1/5 text-sm font-medium text-green-600">PASS</span>
  </div>
  <div className="flex items-center gap-4 py-3 border-b border-gray-100">
    <span className="w-2/5 text-sm truncate">text-in-row-shrink</span>
    <span className="w-1/5 text-sm text-gray-500">375</span>
    <span className="w-1/5 text-sm text-gray-500">0.01</span>
    <span className="w-1/5 text-sm font-medium text-green-600">PASS</span>
  </div>
</div>`,
  },
  {
    name: 'tw-product-card',
    viewport: 320,
    html: `
<div className="p-4">
  <div className="flex flex-col rounded-xl border border-gray-200 overflow-hidden">
    <div className="aspect-video w-full bg-gray-200"></div>
    <div className="flex flex-col gap-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-base font-semibold flex-1 min-w-0">Mechanical keyboard, 75% layout</p>
        <p className="text-base font-bold shrink-0">$149</p>
      </div>
      <p className="text-sm text-gray-500">Hot-swappable switches, aluminium case, ships worldwide.</p>
      <button className="mt-2 h-9 w-full rounded-md bg-gray-900 text-sm font-medium text-white">Add to cart</button>
    </div>
  </div>
</div>`,
  },
  {
    name: 'tw-empty-state',
    viewport: 375,
    html: `
<div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
  <div className="size-16 rounded-full bg-gray-100"></div>
  <p className="text-base font-semibold">No violations found</p>
  <p className="text-sm text-gray-500 max-w-[260px]">Every component passed at every viewport. Add more corpus cases to keep the engine honest.</p>
  <button className="mt-2 px-4 py-2 rounded-md border border-gray-300 text-sm font-medium">Add a case</button>
</div>`,
  },
  {
    name: 'tw-banner-cta',
    viewport: 768,
    html: `
<div className="flex items-center justify-between gap-6 bg-gray-900 px-6 py-4">
  <div className="flex flex-col gap-0.5 min-w-0">
    <p className="text-sm font-semibold text-white">agent-eyes 0.1 is out</p>
    <p className="text-sm text-gray-300 truncate">Grid support via Taffy, 200 new corpus cases, and a GitHub Action for layout linting.</p>
  </div>
  <button className="shrink-0 px-4 py-2 rounded-md bg-white text-sm font-semibold">Upgrade</button>
</div>`,
  },
  {
    name: 'tw-kpi-cards',
    viewport: 1440,
    html: `
<div className="flex gap-4 p-6">
  <div className="flex-1 flex flex-col gap-1 rounded-xl border border-gray-200 p-5">
    <p className="text-sm text-gray-500">Checks today</p>
    <p className="text-3xl font-bold">1,284</p>
    <p className="text-xs text-green-600 font-medium">+12% from yesterday</p>
  </div>
  <div className="flex-1 flex flex-col gap-1 rounded-xl border border-gray-200 p-5">
    <p className="text-sm text-gray-500">Violations caught</p>
    <p className="text-3xl font-bold">96</p>
    <p className="text-xs text-red-600 font-medium">+4% from yesterday</p>
  </div>
  <div className="flex-1 flex flex-col gap-1 rounded-xl border border-gray-200 p-5">
    <p className="text-sm text-gray-500">Mean check time</p>
    <p className="text-3xl font-bold">31ms</p>
    <p className="text-xs text-gray-400 font-medium">across 4 viewports</p>
  </div>
  <div className="w-72 shrink-0 flex flex-col gap-1 rounded-xl bg-gray-900 p-5">
    <p className="text-sm text-gray-400">Accuracy</p>
    <p className="text-3xl font-bold text-white">100%</p>
    <p className="text-xs text-gray-400 font-medium">65/65 within threshold</p>
  </div>
</div>`,
  },
  {
    name: 'tw-timeline',
    viewport: 375,
    html: `
<div className="flex flex-col gap-0 p-4">
  <div className="flex gap-3">
    <div className="flex flex-col items-center">
      <div className="size-3 rounded-full bg-blue-600 shrink-0 mt-1.5"></div>
      <div className="w-0.5 flex-1 bg-gray-200"></div>
    </div>
    <div className="flex flex-col gap-0.5 pb-6">
      <p className="text-sm font-medium">Golden files regenerated</p>
      <p className="text-xs text-gray-500">Chromium 145 · 2 minutes ago</p>
    </div>
  </div>
  <div className="flex gap-3">
    <div className="flex flex-col items-center">
      <div className="size-3 rounded-full bg-blue-600 shrink-0 mt-1.5"></div>
      <div className="w-0.5 flex-1 bg-gray-200"></div>
    </div>
    <div className="flex flex-col gap-0.5 pb-6">
      <p className="text-sm font-medium">Flex resolution pass merged</p>
      <p className="text-xs text-gray-500">65/65 cases green · 1 hour ago</p>
    </div>
  </div>
  <div className="flex gap-3">
    <div className="size-3 rounded-full bg-gray-300 shrink-0 mt-1.5"></div>
    <div className="flex flex-col gap-0.5">
      <p className="text-sm font-medium text-gray-500">Corpus expansion queued</p>
      <p className="text-xs text-gray-500">target: 300 cases</p>
    </div>
  </div>
</div>`,
  },
  {
    name: 'tw-search-header',
    viewport: 768,
    html: `
<div className="flex items-center gap-3 px-6 py-3 border-b border-gray-200">
  <div className="flex-1 max-w-md h-9 rounded-md border border-gray-300 px-3 flex items-center">
    <span className="text-sm text-gray-400">Search corpus cases…</span>
  </div>
  <div className="ml-auto flex items-center gap-2">
    <button className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300">Filter</button>
    <button className="px-3 py-1.5 text-sm font-medium rounded-md bg-gray-900 text-white">New case</button>
  </div>
</div>`,
  },
  {
    name: 'tw-notification-pref',
    viewport: 320,
    html: `
<div className="flex flex-col gap-4 p-4">
  <div className="flex items-start gap-3">
    <div className="size-5 rounded border border-gray-300 shrink-0 mt-0.5"></div>
    <div className="flex flex-col gap-0.5 min-w-0">
      <p className="text-sm font-medium">Failed checks only</p>
      <p className="text-xs text-gray-500 leading-relaxed">Only notify when a rule actually fails — quiet when everything passes at every viewport.</p>
    </div>
  </div>
  <div className="flex items-start gap-3">
    <div className="size-5 rounded border border-gray-300 shrink-0 mt-0.5"></div>
    <div className="flex flex-col gap-0.5 min-w-0">
      <p className="text-sm font-medium">Weekly accuracy digest</p>
      <p className="text-xs text-gray-500 leading-relaxed">A summary of scoreboard movement and newly added corpus cases.</p>
    </div>
  </div>
</div>`,
  },
  {
    name: 'tw-avatar-stack-row',
    viewport: 375,
    html: `
<div className="flex items-center justify-between px-4 py-3">
  <div className="flex items-center">
    <div className="size-8 rounded-full bg-gray-300 border-2 border-white"></div>
    <div className="size-8 rounded-full bg-gray-400 border-2 border-white -ml-2"></div>
    <div className="size-8 rounded-full bg-gray-500 border-2 border-white -ml-2"></div>
    <span className="text-sm text-gray-500 ml-2">+12 contributors</span>
  </div>
  <button className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 shrink-0">Invite</button>
</div>`,
  },
  {
    name: 'tw-blog-list',
    viewport: 768,
    html: `
<div className="flex flex-col gap-8 px-6 py-8 max-w-2xl">
  <div className="flex flex-col gap-2">
    <p className="text-xs font-medium text-gray-400 tracking-wider">ENGINEERING · JUN 2026</p>
    <h2 className="text-xl font-bold leading-snug">Using Chrome as a test oracle for a pure-TypeScript layout engine</h2>
    <p className="text-sm text-gray-600 leading-relaxed">How golden files, per-node pixel deltas, and an agent-driven grind loop got us to a 100% scoreboard without writing a layout engine from scratch.</p>
    <div className="flex items-center gap-2 mt-1">
      <div className="size-6 rounded-full bg-gray-300"></div>
      <span className="text-sm font-medium">Saiful</span>
      <span className="text-sm text-gray-400">· 9 min read</span>
    </div>
  </div>
  <div className="flex flex-col gap-2">
    <p className="text-xs font-medium text-gray-400 tracking-wider">RELEASE · JUN 2026</p>
    <h2 className="text-xl font-bold leading-snug">agent-eyes 0.1: layout assertions your agent can act on</h2>
    <p className="text-sm text-gray-600 leading-relaxed">Four rules, agent-shaped diagnostics, a CLI, an MCP server, and a Claude Code skill — all with no browser at runtime.</p>
  </div>
</div>`,
  },
  {
    name: 'tw-error-page',
    viewport: 375,
    html: `
<div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6 text-center">
  <p className="text-7xl font-bold text-gray-200">404</p>
  <p className="text-lg font-semibold">This viewport does not exist</p>
  <p className="text-sm text-gray-500 max-w-xs">The page you are looking for was moved, removed, or never fit in the first place.</p>
  <button className="mt-2 px-4 py-2 rounded-md bg-gray-900 text-sm font-medium text-white">Back to dashboard</button>
</div>`,
  },
  {
    name: 'tw-inbox-row-overflowy',
    viewport: 320,
    html: `
<div className="flex flex-col">
  <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
    <div className="size-2 rounded-full bg-blue-600 shrink-0"></div>
    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold truncate">GitHub Actions</span>
        <span className="text-xs text-gray-400 shrink-0">09:12</span>
      </div>
      <p className="text-sm text-gray-500 truncate">accuracy: all 65 corpus cases passed on chromium-145 with zero regressions</p>
    </div>
  </div>
  <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
    <div className="size-2 rounded-full bg-transparent shrink-0"></div>
    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold truncate">npm publish bot</span>
        <span className="text-xs text-gray-400 shrink-0">08:47</span>
      </div>
      <p className="text-sm text-gray-500 truncate">reminder: the package name is still not reserved</p>
    </div>
  </div>
</div>`,
  },
  {
    name: 'tw-feature-grid-as-flex',
    viewport: 768,
    html: `
<div className="flex flex-wrap p-6">
  <div className="w-1/3 p-3">
    <div className="flex flex-col gap-2 h-full rounded-lg border border-gray-200 p-4">
      <div className="size-8 rounded-md bg-blue-100"></div>
      <p className="text-sm font-semibold">Deterministic</p>
      <p className="text-xs text-gray-500 leading-relaxed">Same input, same boxes, every time. No flaky screenshots.</p>
    </div>
  </div>
  <div className="w-1/3 p-3">
    <div className="flex flex-col gap-2 h-full rounded-lg border border-gray-200 p-4">
      <div className="size-8 rounded-md bg-green-100"></div>
      <p className="text-sm font-semibold">Fast</p>
      <p className="text-xs text-gray-500 leading-relaxed">Milliseconds per check across four viewports.</p>
    </div>
  </div>
  <div className="w-1/3 p-3">
    <div className="flex flex-col gap-2 h-full rounded-lg border border-gray-200 p-4">
      <div className="size-8 rounded-md bg-purple-100"></div>
      <p className="text-sm font-semibold">Agent-shaped</p>
      <p className="text-xs text-gray-500 leading-relaxed">Violations say what, where, by how much, and how to fix.</p>
    </div>
  </div>
</div>`,
  },
  {
    name: 'tw-cookie-banner',
    viewport: 320,
    html: `
<div className="relative h-96">
  <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 border-t border-gray-200 bg-white p-4">
    <p className="text-sm text-gray-600">We use exactly one cookie, and it remembers that you dismissed this banner.</p>
    <div className="flex gap-2">
      <button className="flex-1 px-3 py-2 rounded-md bg-gray-900 text-sm font-medium text-white">Accept</button>
      <button className="flex-1 px-3 py-2 rounded-md border border-gray-300 text-sm font-medium">Decline</button>
    </div>
  </div>
</div>`,
  },
  {
    name: 'tw-user-dropdown',
    viewport: 375,
    html: `
<div className="relative h-80 p-4">
  <div className="absolute top-4 right-4 w-56 rounded-lg border border-gray-200 bg-white p-1 flex flex-col">
    <div className="flex flex-col gap-0.5 px-3 py-2 border-b border-gray-100">
      <p className="text-sm font-semibold truncate">saifulapm@gmail.com</p>
      <p className="text-xs text-gray-500">Free plan</p>
    </div>
    <span className="px-3 py-2 text-sm rounded-md">Dashboard</span>
    <span className="px-3 py-2 text-sm rounded-md">Settings</span>
    <span className="px-3 py-2 text-sm rounded-md text-red-600">Sign out</span>
  </div>
</div>`,
  },
  {
    name: 'tw-progress-card',
    viewport: 375,
    html: `
<div className="p-4">
  <div className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4">
    <div className="flex items-center justify-between">
      <p className="text-sm font-semibold">Corpus coverage</p>
      <span className="text-sm font-bold">71/300</span>
    </div>
    <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
      <div className="h-full w-1/4 rounded-full bg-blue-600"></div>
    </div>
    <p className="text-xs text-gray-500">Next milestone: 100 cases unlocks the public scoreboard badge.</p>
  </div>
</div>`,
  },
  {
    name: 'tw-bangla-mixed-feed',
    viewport: 375,
    html: `
<div className="flex flex-col gap-4 p-4">
  <div className="flex gap-3">
    <div className="size-10 rounded-full bg-gray-300 shrink-0"></div>
    <div className="flex-1 min-w-0 flex flex-col gap-1">
      <p className="text-sm font-semibold">তানভীর আহমেদ</p>
      <p className="text-sm leading-relaxed">নতুন tool টা try করলাম — browser ছাড়াই layout bug ধরে ফেলে। React component এ overflow ছিল, এক সেকেন্ডে পেয়ে গেছি।</p>
    </div>
  </div>
</div>`,
  },
  {
    name: 'tw-grid-cards',
    viewport: 768,
    html: `
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
  <div className="flex flex-col gap-2 rounded-lg border border-gray-200 p-4">
    <div className="h-24 rounded-md bg-blue-100"></div>
    <p className="text-sm font-semibold">Deterministic</p>
    <p className="text-xs text-gray-500 leading-relaxed">Same input, same boxes, every time. No flaky screenshots to babysit.</p>
  </div>
  <div className="flex flex-col gap-2 rounded-lg border border-gray-200 p-4">
    <div className="h-24 rounded-md bg-green-100"></div>
    <p className="text-sm font-semibold">Fast</p>
    <p className="text-xs text-gray-500 leading-relaxed">Milliseconds per check.</p>
  </div>
  <div className="flex flex-col gap-2 rounded-lg border border-gray-200 p-4">
    <div className="h-24 rounded-md bg-purple-100"></div>
    <p className="text-sm font-semibold">Agent-shaped</p>
    <p className="text-xs text-gray-500 leading-relaxed">Violations say what, where, by how much, and how to fix it.</p>
  </div>
</div>`,
  },
  {
    name: 'tw-grid-dashboard',
    viewport: 1024,
    html: `
<div className="grid grid-cols-4 gap-4 p-4">
  <div className="col-span-2 row-span-2 flex flex-col gap-2 rounded-xl border border-gray-200 p-4">
    <p className="text-sm font-semibold">Traffic overview</p>
    <div className="flex-1 rounded-md bg-blue-50"></div>
  </div>
  <div className="flex flex-col gap-1 rounded-xl border border-gray-200 p-4">
    <p className="text-xs text-gray-500">Checks run</p>
    <p className="text-2xl font-bold">14,208</p>
  </div>
  <div className="flex flex-col gap-1 rounded-xl border border-gray-200 p-4">
    <p className="text-xs text-gray-500">Bugs caught</p>
    <p className="text-2xl font-bold">312</p>
  </div>
  <div className="col-span-2 flex items-center justify-between rounded-xl border border-gray-200 p-4">
    <p className="text-sm font-medium">Median latency</p>
    <p className="text-lg font-bold">38ms</p>
  </div>
  <div className="col-span-full flex items-center gap-2 rounded-xl bg-gray-50 p-3">
    <div className="size-2 rounded-full bg-green-500"></div>
    <p className="text-xs text-gray-600">All gates green as of the last push.</p>
  </div>
</div>`,
  },
  {
    name: 'tw-grid-form',
    viewport: 375,
    html: `
<div className="grid grid-cols-2 gap-3 p-4">
  <div className="flex flex-col gap-1">
    <p className="text-xs font-medium text-gray-700">First name</p>
    <div className="h-10 rounded-md border border-gray-300"></div>
  </div>
  <div className="flex flex-col gap-1">
    <p className="text-xs font-medium text-gray-700">Last name</p>
    <div className="h-10 rounded-md border border-gray-300"></div>
  </div>
  <div className="col-span-full flex flex-col gap-1">
    <p className="text-xs font-medium text-gray-700">Email address</p>
    <div className="h-10 rounded-md border border-gray-300"></div>
  </div>
  <div className="col-span-full h-11 rounded-md bg-blue-600"></div>
</div>`,
  },
  {
    name: 'tw-grid-stats',
    viewport: 768,
    html: `
<div className="grid grid-cols-4 gap-4 p-6">
  <div className="flex flex-col gap-1">
    <p className="text-3xl font-bold">316</p>
    <p className="text-xs text-gray-500">geometry cases</p>
  </div>
  <div className="flex flex-col gap-1">
    <p className="text-3xl font-bold">61</p>
    <p className="text-xs text-gray-500">paint cases</p>
  </div>
  <div className="flex flex-col gap-1">
    <p className="text-3xl font-bold">1px</p>
    <p className="text-xs text-gray-500">size threshold</p>
  </div>
  <div className="flex flex-col gap-1">
    <p className="text-3xl font-bold">0</p>
    <p className="text-xs text-gray-500">browsers shipped</p>
  </div>
</div>`,
  },
  {
    name: 'tw-grid-flow-col',
    viewport: 600,
    html: `
<div className="grid grid-flow-col auto-cols-fr gap-2 p-4">
  <div className="h-10 rounded-md bg-gray-100"></div>
  <div className="h-10 rounded-md bg-gray-200"></div>
  <div className="h-10 rounded-md bg-gray-300"></div>
  <div className="h-10 rounded-md bg-gray-200"></div>
  <div className="h-10 rounded-md bg-gray-100"></div>
</div>`,
  },
  {
    name: 'tw-grid-hero',
    viewport: 768,
    html: `
<div className="grid h-64 place-items-center p-6">
  <div className="flex w-64 flex-col items-center gap-2 rounded-xl border border-gray-200 p-4">
    <p className="text-lg font-bold">layoutlint</p>
    <p className="text-xs text-gray-500">grid, now for real</p>
  </div>
</div>`,
  },
];
