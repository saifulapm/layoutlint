/**
 * React component loading: execute a .tsx/.jsx module and capture its static
 * markup, so check()/render() see exactly what React would emit (hooks,
 * context, className logic all evaluated; effects never run).
 *
 * Pipeline: esbuild bundles the component (TSX, tsconfig paths) with bare
 * imports kept external → bundle is written as a temp .mjs NEXT TO the source
 * file so react/react-dom resolve from the user's own node_modules (a second
 * react copy would break hooks via dispatcher mismatch) → import → pick the
 * component export → user's renderToStaticMarkup → HTML string.
 *
 * SECURITY: this executes the component file's module graph. Never point it
 * at untrusted code (e.g. fork PRs in CI).
 */
import { rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build, type Plugin } from 'esbuild';

export interface ComponentOptions {
  /** Props passed to the component (JSON-shaped). */
  props?: Record<string, unknown>;
  /** Named export to render (default: the default export, else the single capitalized export). */
  component?: string;
}

/**
 * A .tsx/.jsx file with module syntax (import/export) is a component module —
 * it must be executed to yield markup. Raw markup fragments, whatever their
 * extension, take the static parse path.
 */
export function isComponentModule(file: string, source: string): boolean {
  return /\.(tsx|jsx)$/i.test(file) && /^\s*(import|export)\b/m.test(source);
}

/** Function components, plus exotic wrappers (memo/forwardRef carry $$typeof). */
function isRenderable(v: unknown): boolean {
  return typeof v === 'function' || (typeof v === 'object' && v !== null && '$$typeof' in v);
}

function pickComponent(mod: Record<string, unknown>, name: string | undefined, file: string): unknown {
  const exportNames = Object.keys(mod).filter((k) => k !== '__esModule');
  if (name !== undefined) {
    const picked = mod[name];
    if (picked === undefined) {
      throw new Error(`no export named "${name}" in ${file} (exports: ${exportNames.join(', ') || 'none'})`);
    }
    return picked;
  }
  if (isRenderable(mod.default)) return mod.default;
  const capitalized = exportNames.filter((k) => /^[A-Z]/.test(k) && isRenderable(mod[k]));
  if (capitalized.length === 1) return mod[capitalized[0]];
  throw new Error(
    `cannot determine which component to render from ${file} (exports: ${exportNames.join(', ') || 'none'}) — specify the export name (CLI: --component <Name>)`,
  );
}

/** react and react-dom/server, resolved from the COMPONENT's directory — the
 *  user's copies, never layoutlint's own. */
// biome-ignore lint: user-module shape is unknowable
async function loadUserModule(specifier: string, from: string): Promise<any> {
  const req = createRequire(pathToFileURL(from).href);
  let resolved: string;
  try {
    resolved = req.resolve(specifier);
  } catch {
    throw new Error(
      `cannot resolve "${specifier}" from ${dirname(from)} — install react and react-dom in your project to check component files, or pass --no-execute for a static parse`,
    );
  }
  const m = await import(pathToFileURL(resolved).href);
  return m.default ?? m;
}

/**
 * Stylesheets and assets can't affect layoutlint's measurement (layout comes
 * from Tailwind classes), so their imports are stubbed: plain stylesheets
 * become empty modules, CSS modules export an identity proxy (className logic
 * keeps producing strings), assets export their import path.
 */
const stubPlugin: Plugin = {
  name: 'layoutlint-stubs',
  setup(b) {
    b.onResolve({ filter: /\.(css|scss|sass|less|styl)$/ }, (a) => ({
      path: a.path,
      namespace: /\.module\.[a-z]+$/.test(a.path) ? 'll-cssmod' : 'll-empty',
    }));
    b.onLoad({ filter: /.*/, namespace: 'll-empty' }, () => ({ contents: '', loader: 'js' }));
    b.onLoad({ filter: /.*/, namespace: 'll-cssmod' }, () => ({
      contents: 'export default new Proxy({}, { get: (_, p) => String(p) })',
      loader: 'js',
    }));
    b.onResolve({ filter: /\.(svg|png|jpe?g|gif|webp|avif|ico|bmp|woff2?|ttf|otf|eot|mp4|webm|mp3|wav)$/ }, (a) => ({
      path: a.path,
      namespace: 'll-asset',
    }));
    b.onLoad({ filter: /.*/, namespace: 'll-asset' }, (a) => ({
      contents: `export default ${JSON.stringify(a.path)}`,
      loader: 'js',
    }));
  },
};

let tmpSeq = 0;

/** Execute a React component module and return its static HTML markup. */
export async function componentToHtml(file: string, opts: ComponentOptions = {}): Promise<string> {
  const entry = resolve(file);
  const out = await build({
    entryPoints: [entry],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'node',
    jsx: 'automatic',
    packages: 'external',
    logLevel: 'silent',
    plugins: [stubPlugin],
  });
  // Resolve the user's react BEFORE importing the bundle: the bundle's own
  // external `react/jsx-runtime` import would otherwise fail first with a
  // raw ERR_MODULE_NOT_FOUND pointing at the (deleted) temp file.
  const react = await loadUserModule('react', entry);
  const server = await loadUserModule('react-dom/server', entry);
  const tmp = join(dirname(entry), `.layoutlint-${process.pid}-${++tmpSeq}.mjs`);
  writeFileSync(tmp, out.outputFiles[0].text);
  try {
    const mod = (await import(pathToFileURL(tmp).href)) as Record<string, unknown>;
    const component = pickComponent(mod, opts.component, file);
    const html: string = server.renderToStaticMarkup(react.createElement(component, opts.props ?? {}));
    if (html.trim() === '') throw new Error(`${file}: component rendered nothing (null or empty output)`);
    return html;
  } finally {
    rmSync(tmp, { force: true });
  }
}
