function Field({ label, hint, placeholder }: { label: string; hint?: string; placeholder?: string }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium">{label}</span>
      <input className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm" placeholder={placeholder} />
      {hint && <span className="text-xs text-gray-500">{hint}</span>}
    </label>
  );
}

export default function SettingsForm() {
  return (
    <form className="m-4 flex max-w-md flex-col gap-4 rounded-lg border border-gray-200 p-6">
      <p className="text-lg font-bold">Project settings</p>
      <Field label="Project name" placeholder="layoutlint" />
      <Field label="Viewports" hint="Comma-separated widths checked on every run." placeholder="320, 375, 768, 1440" />
      <div className="flex justify-end gap-2">
        <button className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium">Cancel</button>
        <button className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white">Save</button>
      </div>
    </form>
  );
}
