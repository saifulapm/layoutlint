export type RuleName = 'no-overflow' | 'no-overlap' | 'fits-viewport' | 'no-text-truncation';

export const ALL_RULES: RuleName[] = ['no-overflow', 'no-overlap', 'fits-viewport', 'no-text-truncation'];

/**
 * One layout violation, shaped for an agent to read and self-correct:
 * every violation answers what, where, by how much, and a plausible fix.
 */
export interface Violation {
  rule: RuleName;
  /** Human-readable CSS-ish path of the offending node, e.g. 'div.card > h2'. */
  element: string;
  /** Stable tree path (root = "r") for programmatic correlation. */
  path: string;
  detail: string;
  measured: Record<string, number>;
  available?: Record<string, number>;
  suggestion?: string;
}

export interface ViewportResult {
  viewport: number;
  pass: boolean;
  violations: Violation[];
}

export interface CheckReport {
  pass: boolean;
  viewports: ViewportResult[];
  /** Resolver warnings (unsupported/unrecognized classes), deduplicated. */
  warnings: string[];
}

export interface CheckOptions {
  /** Viewport widths to check. Default [320, 375, 768, 1440]. */
  viewports?: number[];
  /** Height used for h-screen / vh units. Default 800. */
  viewportHeight?: number;
  /** Font files; defaults to the bundled Inter (+ Bengali, + system emoji if present). */
  fonts?: { family: string; path: string; weight: number }[];
  /** Rules to run. Default: all four. */
  rules?: RuleName[];
}
