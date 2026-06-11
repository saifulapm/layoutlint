import { cn } from './lib/cn';
import { Stat } from './parts/stat';

export default function StatsRow({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn('flex gap-3', compact ? 'p-2' : 'p-4')}>
      <Stat label="Corpus cases" value="304" />
      <Stat label="Paint gate" value="7%" />
      <Stat label="Viewports" value="4" />
    </div>
  );
}
