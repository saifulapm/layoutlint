import { useState } from 'react';

export default function Banner() {
  const [visible] = useState(true);
  if (!visible) return null;
  return (
    <div className="flex items-center gap-3 bg-blue-600 px-4 py-2">
      <p className="min-w-0 flex-1 truncate text-sm font-medium text-white">
        React components are now checked by executing them — hooks included.
      </p>
      <button className="shrink-0 rounded-md bg-white px-2 py-1 text-xs font-medium text-blue-600">Dismiss</button>
    </div>
  );
}
