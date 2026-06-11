interface Row {
  name: string;
  status: string;
  region: string;
}

export default function DataTable({ rows }: { rows: Row[] }) {
  return (
    <div className="m-4 flex flex-col rounded-lg border border-gray-200">
      <div className="flex gap-4 border-b border-gray-200 bg-gray-50 px-4 py-2">
        <span className="w-2/5 text-xs font-semibold text-gray-500">Service</span>
        <span className="w-1/5 text-xs font-semibold text-gray-500">Status</span>
        <span className="flex-1 text-xs font-semibold text-gray-500">Region</span>
      </div>
      {rows.map((r) => (
        <div key={r.name} className="flex items-center gap-4 border-b border-gray-100 px-4 py-2">
          <span className="w-2/5 truncate text-sm font-medium">{r.name}</span>
          <span className="w-1/5 text-sm text-gray-600">{r.status}</span>
          <span className="flex-1 truncate text-sm text-gray-600">{r.region}</span>
        </div>
      ))}
    </div>
  );
}
