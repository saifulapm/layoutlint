/**
 * Resolves the react corpus to HTML by executing every component through the
 * PRODUCT loader (componentToHtml) — the honest end-to-end test. Shared by
 * generate/compare (geometry) and screenshot/paint-compare (paint).
 */
import { join } from 'node:path';
import { reactCases } from '../../../corpora/react-cases';
import { componentToHtml } from '../../rules/src/react';

const ROOT = join(import.meta.dir, '../../..');

export interface ResolvedReactCase {
  name: string;
  viewport: number;
  html: string;
}

let cache: Promise<ResolvedReactCase[]> | undefined;

export function resolvedReactCases(): Promise<ResolvedReactCase[]> {
  cache ??= Promise.all(
    reactCases.map(async (c) => ({
      name: c.name,
      viewport: c.viewport,
      html: await componentToHtml(join(ROOT, c.file), { props: c.props, component: c.component }),
    })),
  );
  return cache;
}
