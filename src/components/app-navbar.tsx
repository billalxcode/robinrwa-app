"use client";

import { Layers } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@/components/connect-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Home", url: "/" },
  { title: "Index", url: "/indexes" },
  { title: "Portfolio", url: "/portfolio" },
  { title: "Docs", url: "/docs" },
  { title: "Oracle", url: "/oracle" },
];

export function AppNavbar() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-10 bg-background">
      <div className="mx-auto flex h-20 w-full max-w-[1200px] items-center justify-between gap-4 px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Layers className="size-4" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-semibold text-foreground">RobinRWA</span>
            <span className="text-xs text-muted-foreground">eIndex</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 rounded-xl border border-border bg-secondary p-1.5 md:flex">
          {navItems.map((item) => {
            const isActive =
              item.url === "/"
                ? pathname === "/"
                : pathname.startsWith(item.url);
            return (
              <Link
                key={item.url}
                href={item.url}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {item.title}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="hidden sm:inline-flex">
            Robinhood Chain
          </Badge>
          <ConnectButton />
        </div>
      </div>
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-border px-4 py-2 md:hidden">
        {navItems.map((item) => {
          const isActive =
            item.url === "/" ? pathname === "/" : pathname.startsWith(item.url);
          return (
            <Link
              key={item.url}
              href={item.url}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                isActive
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.title}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
