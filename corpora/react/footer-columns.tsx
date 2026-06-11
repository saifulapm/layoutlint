const COLUMNS = [
  { title: 'Product', links: ['Checks', 'Render', 'Action', 'MCP server'] },
  { title: 'Resources', links: ['Docs', 'Accuracy scoreboard', 'Engineering notes'] },
  { title: 'Company', links: ['GitHub', 'npm', 'License'] },
];

export default function FooterColumns() {
  return (
    <footer className="flex flex-col gap-8 border-t border-gray-200 p-8 sm:flex-row">
      {COLUMNS.map((col) => (
        <div key={col.title} className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="text-sm font-semibold">{col.title}</p>
          {col.links.map((l) => (
            <span key={l} className="truncate text-sm text-gray-500">
              {l}
            </span>
          ))}
        </div>
      ))}
    </footer>
  );
}
