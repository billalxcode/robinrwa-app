import Link from "next/link";

export function AppFooter() {
  return (
    <footer className="border-t border-border bg-background px-6 py-6 text-xs text-muted-foreground md:px-10">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 RobinRWA — sample data.</p>
        <nav className="flex items-center gap-4">
          <Link href="/docs" className="hover:text-primary">
            Documentation
          </Link>
          <Link href="/oracle" className="hover:text-primary">
            Oracle
          </Link>
          <Link href="/indexes" className="hover:text-primary">
            Index
          </Link>
        </nav>
      </div>
    </footer>
  );
}
