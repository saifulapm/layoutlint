import { Stat } from './parts/stat';

const STATS = [
  { label: 'Corpus cases', value: '316' },
  { label: 'Geometry gate', value: '1px' },
  { label: 'Paint gate', value: '7%' },
  { label: 'Runtime', value: '8 ms' },
];

export default function StatDashboard() {
  return (
    <div className="flex flex-wrap p-3">
      {STATS.map((s) => (
        <div key={s.label} className="w-1/2 p-1 sm:w-1/4">
          <Stat label={s.label} value={s.value} />
        </div>
      ))}
    </div>
  );
}
