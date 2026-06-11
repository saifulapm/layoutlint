interface ProfileCardProps {
  name: string;
  role?: string;
  verified?: boolean;
  tags?: string[];
}

export default function ProfileCard({ name, role = 'Engineer', verified = false, tags = [] }: ProfileCardProps) {
  return (
    <div className="p-4">
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-full bg-gray-300 shrink-0"></div>
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="text-xs text-gray-500">{role}</p>
          </div>
          {verified && (
            <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">Verified</span>
          )}
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-600">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
