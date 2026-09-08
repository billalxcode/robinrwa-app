"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { ConnectButton } from "@/components/connect-button";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { breadcrumbTrail } from "@/lib/site";

export function AppNavbar() {
  const pathname = usePathname();
  const trail = breadcrumbTrail(pathname);
  return (
    <header className="sticky top-0 z-10 flex h-[74px] shrink-0 items-center justify-between gap-2 border-b border-sidebar-border bg-white/80 px-10 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            {trail.map((label, i) => {
              const last = i === trail.length - 1;
              return (
                <Fragment key={label}>
                  {i > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {last ? (
                      <BreadcrumbPage>{label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink render={<Link href="/" />}>
                        {label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant="outline">Robinhood Chain</Badge>
        <ConnectButton />
      </div>
    </header>
  );
}
