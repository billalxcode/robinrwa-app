"use client";

import {
  Activity,
  BookOpenText,
  ChartLine,
  House,
  Layers,
  type LucideIcon,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

const mainNav: NavItem[] = [
  { title: "Home", url: "/", icon: House },
  { title: "Index", url: "/indexes", icon: ChartLine },
  { title: "Positions", url: "/positions", icon: Wallet },
];

// Resources group: supporting pages (contract docs + oracle status).
const resourceNav: NavItem[] = [
  { title: "Documentation", url: "/docs", icon: BookOpenText },
  { title: "Oracle", url: "/oracle", icon: Activity },
];

function NavGroup({
  label,
  items,
  pathname,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton
                render={<Link href={item.url} />}
                isActive={pathname === item.url}
                tooltip={item.title}
              >
                <item.icon />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/" />}>
              <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Layers />
              </span>
              <span className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">RobinRWA</span>
                <span className="text-xs text-muted-foreground">eIndex</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavGroup label="Menu" items={mainNav} pathname={pathname} />
        <NavGroup label="Resources" items={resourceNav} pathname={pathname} />
      </SidebarContent>
      <SidebarFooter>
        <Separator />
        <div className="flex items-center justify-between px-2 py-1.5">
          <Badge variant="secondary">Chain 4663</Badge>
          <span className="text-xs text-muted-foreground">v0.1.0</span>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
