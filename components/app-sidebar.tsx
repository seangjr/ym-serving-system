"use client";

import {
  BarChart3,
  Calendar,
  CalendarCheck,
  FolderOpen,
  type LucideIcon,
  Megaphone,
  Music,
  Shield,
  Users,
  Wrench,
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
import { UserNav } from "@/components/user-nav";
import type { AppRole, NavItem } from "@/lib/auth/roles";
import { getNavItems } from "@/lib/auth/roles";

// ---------------------------------------------------------------------------
// Icon resolver: maps string icon names from NavItem to Lucide components
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, LucideIcon> = {
  BarChart3,
  Calendar,
  CalendarCheck,
  FolderOpen,
  Megaphone,
  Music,
  Shield,
  Users,
  Wrench,
};

function resolveIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Calendar;
}

// ---------------------------------------------------------------------------
// AppSidebar
// ---------------------------------------------------------------------------

interface AppSidebarProps {
  role: AppRole;
  user: { email: string; role: AppRole };
}

export function AppSidebar({ role, user }: AppSidebarProps) {
  const pathname = usePathname();
  const navItems: NavItem[] = getNavItems(role);

  return (
    <Sidebar>
      {/* Header */}
      <SidebarHeader className="px-4 py-4">
        <span className="text-lg font-bold tracking-tight">YM Serving</span>
      </SidebarHeader>

      <SidebarSeparator />

      {/* Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = resolveIcon(item.icon);
                const isActive = pathname.startsWith(item.href);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      size="lg"
                    >
                      <Link href={item.href}>
                        <Icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter>
        <SidebarSeparator />
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
        <SidebarSeparator />
        <UserNav user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
