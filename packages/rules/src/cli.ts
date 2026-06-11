#!/usr/bin/env node
/**
 * layoutlint CLI.
 *
 *   layoutlint check src/components/Card.tsx --viewports 320,1440
 *   layoutlint check Card.tsx --json          # agent-shaped report on stdout
 *
 * Exit code 0 = all rules pass at all viewports; 1 = violations; 2 = usage error.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { check, componentToHtml, isComponentModule, render, ALL_RULES, DEFAULT_VIEWPORTS, type RuleName } from './index';

const HELP = `layoutlint — deterministic UI layout checks and screenshots, no browser

Usage:
  layoutlint check <file...> [options]
  layoutlint render <file> [--viewport 375] [-o out.svg|out.png]

Check options:
  --viewports <list>        comma-separated widths (default ${DEFAULT_VIEWPORTS.join(',')})
  --rules <list>            subset of: ${ALL_RULES.join(', ')}
  --json                    machine-readable report (for agents)

Render options:
  --viewport <px>           viewport width (default 375)
  -o, --out <path>          output file; format from extension (.svg/.png);
                            no -o writes SVG to stdout

Common:
  --viewport-height <px>    height for h-screen/vh units (default 800)
  --props <json>            props for a React component file (JSON object)
  --component <name>        named export to render (default: default export)
  --no-execute              never execute component modules; static parse only
  --help                    show this help

React component files (.tsx/.jsx with import/export) are executed via your
project's react-dom (renderToStaticMarkup) — hooks and className logic
evaluate; effects don't run. NOTE: this runs the file's code.
`;

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  allowPositionals: true,
  options: {
    viewports: { type: 'string' },
    viewport: { type: 'string' },
    'viewport-height': { type: 'string' },
    rules: { type: 'string' },
    json: { type: 'boolean', default: false },
    out: { type: 'string', short: 'o' },
    props: { type: 'string' },
    component: { type: 'string' },
    'no-execute': { type: 'boolean', default: false },
    help: { type: 'boolean', default: false },
  },
});

const command = positionals[0];
if (values.help || (command !== 'check' && command !== 'render') || positionals.length < 2) {
  console.log(HELP);
  process.exit(values.help ? 0 : 2);
}

const viewportHeight = values['viewport-height'] ? parseInt(values['viewport-height'], 10) : undefined;

let props: Record<string, unknown> | undefined;
if (values.props !== undefined) {
  try {
    props = JSON.parse(values.props);
  } catch {
    console.error(`--props is not valid JSON: ${values.props}`);
    process.exit(2);
  }
  if (props === null || typeof props !== 'object' || Array.isArray(props)) {
    console.error(`--props must be a JSON object, got: ${values.props}`);
    process.exit(2);
  }
}

/** File contents — executed via the user's React when it's a component module. */
async function loadSource(file: string): Promise<string> {
  let raw: string;
  try {
    raw = readFileSync(file, 'utf8');
  } catch {
    console.error(`cannot read ${file}`);
    process.exit(2);
  }
  if (values['no-execute'] || !isComponentModule(file, raw)) return raw;
  try {
    return await componentToHtml(file, { props, component: values.component });
  } catch (e) {
    console.error(`${file}: ${(e as Error).message}`);
    process.exit(2);
  }
}

if (command === 'render') {
  const file = positionals[1];
  const source = await loadSource(file);
  const viewport = values.viewport ? parseInt(values.viewport, 10) : undefined;
  if (values.viewport && (!Number.isFinite(viewport) || viewport! <= 0)) {
    console.error(`invalid viewport: ${values.viewport}`);
    process.exit(2);
  }
  const wantPng = values.out?.endsWith('.png') ?? false;
  const result = await render(source, {
    viewport,
    viewportHeight,
    format: wantPng ? 'png' : 'svg',
  });
  if (values.out === undefined) {
    console.log(result.svg);
  } else if (wantPng) {
    writeFileSync(values.out, result.png!);
    console.error(`${values.out} (${result.width}×${result.height})`);
  } else {
    writeFileSync(values.out, result.svg);
    console.error(`${values.out} (${result.width}×${result.height})`);
  }
  process.exit(0);
}

const viewports = values.viewports?.split(',').map((v) => {
  const n = parseInt(v.trim(), 10);
  if (!Number.isFinite(n) || n <= 0) {
    console.error(`invalid viewport: ${v}`);
    process.exit(2);
  }
  return n;
});

const rules = values.rules?.split(',').map((r) => {
  const name = r.trim() as RuleName;
  if (!ALL_RULES.includes(name)) {
    console.error(`unknown rule: ${r} (valid: ${ALL_RULES.join(', ')})`);
    process.exit(2);
  }
  return name;
});

const tty = process.stdout.isTTY && !values.json;
const c = {
  red: (s: string) => (tty ? `\x1b[31m${s}\x1b[0m` : s),
  green: (s: string) => (tty ? `\x1b[32m${s}\x1b[0m` : s),
  yellow: (s: string) => (tty ? `\x1b[33m${s}\x1b[0m` : s),
  dim: (s: string) => (tty ? `\x1b[2m${s}\x1b[0m` : s),
  bold: (s: string) => (tty ? `\x1b[1m${s}\x1b[0m` : s),
};

let anyFail = false;
const jsonOut: Record<string, unknown>[] = [];

for (const file of positionals.slice(1)) {
  const source = await loadSource(file);
  const report = await check(source, { viewports, rules, viewportHeight });
  if (!report.pass) anyFail = true;

  if (values.json) {
    jsonOut.push({ file, ...report });
    continue;
  }

  console.log(c.bold(file));
  for (const vp of report.viewports) {
    if (vp.pass) {
      console.log(`  ${c.green('✓')} ${vp.viewport}px`);
      continue;
    }
    console.log(`  ${c.red('✗')} ${vp.viewport}px — ${vp.violations.length} violation(s)`);
    for (const v of vp.violations) {
      console.log(`      ${c.red(v.rule)} ${c.bold(v.element)}`);
      console.log(`        ${v.detail}`);
      if (v.suggestion) console.log(`        ${c.dim(`fix: ${v.suggestion}`)}`);
    }
  }
  for (const w of report.warnings) console.log(`  ${c.yellow('⚠')} ${w}`);
  console.log();
}

if (values.json) console.log(JSON.stringify(jsonOut.length === 1 ? jsonOut[0] : jsonOut, null, 2));
process.exit(anyFail ? 1 : 0);
