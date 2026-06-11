function cn(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function ButtonRow({ primaryLabel = 'Save changes', disabled = false }: { primaryLabel?: string; disabled?: boolean }) {
  return (
    <div className="flex gap-2 p-4">
      <button
        className={cn(
          'rounded-md px-3 py-1.5 text-sm font-medium text-white',
          disabled ? 'bg-gray-300' : 'bg-blue-600',
        )}
      >
        {primaryLabel}
      </button>
      <button className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium">Cancel</button>
    </div>
  );
}
