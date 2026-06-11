import { useState } from 'react';

interface Message {
  from: string;
  preview: string;
  time: string;
}

const INITIAL: Message[] = [
  { from: 'Nadia Rahman', preview: 'The truncation rule caught the overflowing username before review.', time: '09:12' },
  { from: 'CI Bot', preview: 'accuracy: 307/307 cases within threshold — geometry gate green.', time: '08:47' },
  { from: 'Saiful', preview: 'Shipping React support today.', time: 'Yesterday' },
];

export default function ChatList() {
  const [messages] = useState(INITIAL);
  return (
    <div className="flex flex-col">
      {messages.map((m) => (
        <div key={m.from} className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
          <div className="size-10 shrink-0 rounded-full bg-gray-300"></div>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-semibold">{m.from}</span>
              <span className="shrink-0 text-xs text-gray-400">{m.time}</span>
            </div>
            <p className="truncate text-sm text-gray-500">{m.preview}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
