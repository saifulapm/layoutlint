import './styles.css';

export default function AlertCard() {
  return (
    <div className="p-4">
      <div className="alert flex items-start gap-3 rounded-lg border border-gray-200 p-4">
        <div className="size-5 rounded-full bg-blue-600 shrink-0"></div>
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-sm font-semibold">Stylesheet imports are ignored</p>
          <p className="text-sm text-gray-600">Layout comes from Tailwind classes; the .css import must not break loading.</p>
        </div>
      </div>
    </div>
  );
}
