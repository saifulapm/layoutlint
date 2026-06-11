#!/usr/bin/env bun
/**
 * agent-eyes MCP server (stdio): exposes `check_layout` so agents can verify
 * UI layout deterministically — no browser, no screenshots.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { readFileSync } from 'node:fs';
import { check, ALL_RULES, DEFAULT_VIEWPORTS, type RuleName } from 'agent-eyes';

const server = new McpServer({ name: 'agent-eyes', version: '0.0.0' });

const inputSchema: z.ZodRawShape = {
  source: z
    .string()
    .optional()
    .describe('JSX/HTML source with Tailwind classes. Provide either source or file.'),
  file: z.string().optional().describe('Path to a component file to check.'),
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
type ToolResult = { content: { type: 'text'; text: string }[]; isError?: boolean };
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
    const args = rawArgs as {
      source?: string;
      file?: string;
      viewports?: number[];
      viewportHeight?: number;
      rules?: string[];
    };
    const source = args.source ?? (args.file ? readFileSync(args.file, 'utf8') : undefined);
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

await server.connect(new StdioServerTransport());
