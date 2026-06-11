export function Header() {
  return (
    <header className="flex items-center justify-between border-b border-gray-200 p-4">
      <span className="text-lg font-bold">Acme</span>
      <span className="text-sm text-gray-500">Menu</span>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="flex flex-col gap-2 border-t border-gray-200 p-6">
      <p className="text-sm font-semibold">Acme Inc.</p>
      <p className="text-xs text-gray-500">Two named exports — discovery must require an explicit pick.</p>
    </footer>
  );
}
