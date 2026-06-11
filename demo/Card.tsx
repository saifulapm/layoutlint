export function Card() {
  return (
    <div className="flex w-96 items-center gap-4 rounded-xl border border-gray-200 p-4 shadow-sm">
      <img className="h-12 w-12 shrink-0 rounded-full bg-gray-100" />
      <div>
        <h2 className="text-lg font-semibold">Quarterly report is ready for review</h2>
        <p className="text-sm text-gray-500">Finance · updated 2 hours ago</p>
      </div>
    </div>
  );
}
