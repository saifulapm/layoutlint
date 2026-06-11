import logo from './logo.svg';

export default function BrandHeader() {
  return (
    <header className="flex items-center gap-3 border-b border-gray-200 p-4">
      <img src={logo} alt="" className="size-8 shrink-0" />
      <span className="text-lg font-bold">layoutlint</span>
      <span className="ml-auto text-sm text-gray-500">v0.2</span>
    </header>
  );
}
