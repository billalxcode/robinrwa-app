import Link from "next/link";

export function AppFooter() {
  return (
    <footer className="flex flex-col gap-2 border-t bg-white px-10 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
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
    </footer>
  );
}
