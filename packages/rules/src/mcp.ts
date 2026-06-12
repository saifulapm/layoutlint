#!/usr/bin/env node
/**
 * layoutlint MCP server (stdio): exposes `check_layout` so agents can verify
 * UI layout deterministically — no browser, no screenshots.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { readFileSync } from 'node:fs';
import { check, componentToHtml, isComponentModule, render, ALL_RULES, DEFAULT_VIEWPORTS, type RuleName } from './index';

const server = new McpServer({ name: 'layoutlint', version: '0.0.0' });

const inputSchema: z.ZodRawShape = {
  source: z
    .string()
    .optional()
    .describe('JSX/HTML source with Tailwind classes. Provide either source or file.'),
  file: z.string().optional().describe(
    'Path to a component file to check. React component modules (.tsx/.jsx with ' +
    'import/export) are executed via the project\'s react-dom (renderToStaticMarkup) — ' +
    'hooks and className logic evaluate. NOTE: this runs the file\'s code.',
  ),
  props: z.record(z.unknown()).optional().describe('Props for a React component file (JSON object).'),
  component: z.string().optional().describe('Named export to render (default: the default export).'),
  execute: z.boolean().optional().describe('Set false to force a static parse (never execute component modules).'),
  viewports: z
    .array(z.number().int().positive())
    .optional()
    .describe(`Viewport widths in px (default ${DEFAULT_VIEWPORTS.join(', ')}).`),
  viewportHeight: z.number().int().positive().optional()
    .describe('Height used for h-screen/vh units (default 800).'),
  rules: z.array(z.string()).optional()
    .describe(`Rules to run (default: all of ${ALL_RULES.join(', ')}).`),
};

/**
 * registerTool's generic inference over ZodRawShape hits TS2589 with current
 * zod+SDK versions; this loose signature skips inference. The SDK still
 * validates calls against the zod shape at runtime.
 */
type ToolContent =
  | { type: 'text'; text: string }
  | { type: 'image'; mimeType: string; data: string };
type ToolResult = { content: ToolContent[]; isError?: boolean };

interface SourceArgs {
  source?: string;
  file?: string;
  props?: Record<string, unknown>;
  component?: string;
  execute?: boolean;
}

/** Source markup; component-module files are executed unless execute === false. */
async function resolveSource(args: SourceArgs): Promise<string | undefined> {
  if (args.source !== undefined) return args.source;
  if (args.file === undefined) return undefined;
  const raw = readFileSync(args.file, 'utf8');
  if (args.execute === false || !isComponentModule(args.file, raw)) return raw;
  return componentToHtml(args.file, { props: args.props, component: args.component });
}

const errorResult = (e: unknown): ToolResult => ({
  content: [{ type: 'text', text: `error: ${(e as Error).message}` }],
  isError: true,
});
const registerTool = server.registerTool.bind(server) as (
  name: string,
  config: { title?: string; description?: string; inputSchema?: z.ZodRawShape },
  cb: (args: Record<string, unknown>) => Promise<ToolResult>,
) => void;

registerTool(
  'check_layout',
  {
    title: 'Check UI layout',
    description:
      'Deterministically verify a JSX/HTML + Tailwind component for layout bugs ' +
      '(overflow, overlap, viewport fit, text truncation) across viewports in ' +
      'milliseconds, without a browser. Returns per-viewport violations with ' +
      'element paths, measured vs available px, and suggested fixes. Run this ' +
      'after every UI edit and fix the reported violations.',
    inputSchema,
  },
  async (rawArgs) => {
    const args = rawArgs as SourceArgs & {
      viewports?: number[];
      viewportHeight?: number;
      rules?: string[];
    };
    let source: string | undefined;
    try {
      source = await resolveSource(args);
    } catch (e) {
      return errorResult(e);
    }
    if (!source) {
      return {
        content: [{ type: 'text' as const, text: 'error: provide either `source` or `file`' }],
        isError: true,
      };
    }
    const unknownRules = (args.rules ?? []).filter((r) => !ALL_RULES.includes(r as RuleName));
    if (unknownRules.length > 0) {
      return {
        content: [
          { type: 'text' as const, text: `error: unknown rule(s) ${unknownRules.join(', ')} — valid: ${ALL_RULES.join(', ')}` },
        ],
        isError: true,
      };
    }
    const report = await check(source, {
      viewports: args.viewports,
      viewportHeight: args.viewportHeight,
      rules: args.rules as RuleName[] | undefined,
    });
    return { content: [{ type: 'text' as const, text: JSON.stringify(report, null, 2) }] };
  },
);

registerTool(
  'render_layout',
  {
    title: 'Render UI layout to an image',
    description:
      'Deterministically render a JSX/HTML + Tailwind component to a PNG ' +
      'screenshot without a browser — real flexbox + grid layout, real text shaping, ' +
      'real Tailwind colors. Use it to SEE what a component looks like at a ' +
      'viewport after check_layout passes (or to inspect a reported violation).',
    inputSchema: {
      source: inputSchema.source,
      file: inputSchema.file,
      props: inputSchema.props,
      component: inputSchema.component,
      execute: inputSchema.execute,
      viewport: z.number().int().positive().optional()
        .describe('Viewport width in px (default 375).'),
      viewportHeight: inputSchema.viewportHeight,
    },
  },
  async (rawArgs) => {
    const args = rawArgs as SourceArgs & { viewport?: number; viewportHeight?: number };
    let source: string | undefined;
    try {
      source = await resolveSource(args);
    } catch (e) {
      return errorResult(e);
    }
    if (!source) {
      return {
        content: [{ type: 'text' as const, text: 'error: provide either `source` or `file`' }],
        isError: true,
      };
    }
    const result = await render(source, {
      viewport: args.viewport,
      viewportHeight: args.viewportHeight,
      format: 'png',
    });
    return {
      content: [
        {
          type: 'image' as const,
          mimeType: 'image/png',
          data: Buffer.from(result.png!).toString('base64'),
        },
      ],
    };
  },
);

await server.connect(new StdioServerTransport());
