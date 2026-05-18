"use client";

import {
  BookOpen,
  Copy,
  LayoutDashboard,
  Share2,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

import { LogoutButton } from "./logout-button";

const NAV = [
  { href: "/dashboard", label: "Resumen", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/album", label: "Mi colección", icon: BookOpen },
  { href: "/dashboard/repeated", label: "Repetidas", icon: Copy },
  { href: "/dashboard/exchange", label: "Intercambio", icon: Share2 },
  { href: "/dashboard/import", label: "Importar", icon: Upload },
];

export function DashboardSidebar({ email }: { email: string | null }) {
  const pathname = usePathname();
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-2 py-1.5 text-base font-semibold"
        >
          <span className="text-2xl leading-none">🏆</span>
          <span className="group-data-[collapsible=icon]:hidden">
            Panini 2026
          </span>
        </Link>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                    >
                      <Link href={item.href}>
                        <Icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter>
        <div className="flex items-center justify-between gap-2 px-2 group-data-[collapsible=icon]:hidden">
          <span
            className="truncate text-xs text-muted-foreground"
            title={email ?? undefined}
          >
            {email ?? "—"}
          </span>
          <ThemeToggle />
        </div>
        <div className="group-data-[collapsible=icon]:hidden">
          <LogoutButton />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
