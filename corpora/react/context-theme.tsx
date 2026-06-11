import { createContext, useContext } from 'react';

type Density = 'comfortable' | 'compact';

const DensityContext = createContext<Density>('comfortable');

function Row({ label, value }: { label: string; value: string }) {
  const density = useContext(DensityContext);
  return (
    <div className={`flex items-center justify-between ${density === 'compact' ? 'py-1' : 'py-2'}`}>
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export default function ThemePanel({ density = 'compact' }: { density?: Density }) {
  return (
    <DensityContext.Provider value={density}>
      <div className="m-4 flex flex-col rounded-lg border border-gray-200 p-4">
        <p className="pb-2 text-sm font-semibold">Usage</p>
        <Row label="Checks run" value="1,204" />
        <Row label="Violations" value="37" />
        <Row label="Mean runtime" value="8 ms" />
      </div>
    </DensityContext.Provider>
  );
}
