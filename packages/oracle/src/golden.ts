import { join } from 'node:path';

export const GOLDEN_DIR = join(import.meta.dir, '../../../golden');
export const ACCURACY_DIR = join(import.meta.dir, '../../../accuracy');

export interface GoldenRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GoldenFile {
  name: string;
  viewport: number;
  chromium: string;
  generatedAt: string;
  rects: Record<string, GoldenRect>;
}
