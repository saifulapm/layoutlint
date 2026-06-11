interface NavbarProps {
  signedIn?: boolean;
  userName?: string;
}

export default function Navbar({ signedIn = false, userName = 'Account' }: NavbarProps) {
  return (
    <nav className="flex items-center gap-4 border-b border-gray-200 px-4 py-2">
      <span className="text-lg font-bold">layoutlint</span>
      <span className="text-sm font-medium">Docs</span>
      <span className="text-sm font-medium">Pricing</span>
      <div className="ml-auto flex items-center gap-3">
        {signedIn ? (
          <>
            <span className="truncate text-sm font-medium">{userName}</span>
            <div className="size-8 rounded-full bg-gray-300 shrink-0"></div>
          </>
        ) : (
          <>
            <span className="text-sm font-medium">Sign in</span>
            <button className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white">Get started</button>
          </>
        )}
      </div>
    </nav>
  );
}
