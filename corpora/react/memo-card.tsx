import { memo } from 'react';

interface MemoCardProps {
  title?: string;
  body?: string;
}

const MemoCard = memo(function MemoCard({
  title = 'Memoized',
  body = 'Exotic component objects (memo/forwardRef) are renderable too.',
}: MemoCardProps) {
  return (
    <div className="m-4 flex flex-col gap-2 rounded-lg border border-gray-200 p-4">
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-sm text-gray-600">{body}</p>
    </div>
  );
});

export default MemoCard;
