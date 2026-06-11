import { Stat } from '@parts/stat';

export default function AliasDashboard() {
  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row">
      <Stat label="Aliased import" value="OK" />
      <Stat label="tsconfig paths" value="@parts/*" />
    </div>
  );
}
