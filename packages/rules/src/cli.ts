#!/usr/bin/env node
/**
 * layoutlint CLI.
 *
 *   layoutlint check src/components/Card.tsx --viewports 320,1440
 *   layoutlint check Card.tsx --json          # agent-shaped report on stdout
 *
 * Exit code 0 = all rules pass at all viewports; 1 = violations; 2 = usage error.
 */
import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { check, ALL_RULES, DEFAULT_VIEWPORTS, type RuleName } from './index';

const HELP = `layoutlint — deterministic UI layout checks, no browser

Usage:
  layoutlint check <file...> [options]

Options:
  --viewports <list>        comma-separated widths (default ${DEFAULT_VIEWPORTS.join(',')})
  --viewport-height <px>    height for h-screen/vh units (default 800)
  --rules <list>            subset of: ${ALL_RULES.join(', ')}
  --json                    machine-readable report (for agents)
  --help                    show this help
`;

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  allowPositionals: true,
  options: {
    viewports: { type: 'string' },
    'viewport-height': { type: 'string' },
    rules: { type: 'string' },
    json: { type: 'boolean', default: false },
    help: { type: 'boolean', default: false },
  },
});

if (values.help || positionals[0] !== 'check' || positionals.length < 2) {
  console.log(HELP);
  process.exit(values.help ? 0 : 2);
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
  let source: string;
  try {
    source = readFileSync(file, 'utf8');
  } catch {
    console.error(`cannot read ${file}`);
    process.exit(2);
  }

  const report = await check(source, {
    viewports,
    rules,
    viewportHeight: values['viewport-height'] ? parseInt(values['viewport-height'], 10) : undefined,
  });
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
