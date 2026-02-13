"use client";

import {
  BarChart3,
  Calendar,
  CalendarCheck,
  ChevronsUpDown,
  FolderOpen,
  Layers,
  LogOut,
  type LucideIcon,
  Megaphone,
  Monitor,
  Moon,
  Music,
  Shield,
  Sun,
  UserCircle,
  Users,
  Wrench,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
} from "@/components/ui/sidebar";
import type { AppRole, NavItem } from "@/lib/auth/roles";
import { getNavItems } from "@/lib/auth/roles";

// ---------------------------------------------------------------------------
// Icon resolver
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, LucideIcon> = {
  BarChart3,
  Calendar,
  CalendarCheck,
  FolderOpen,
  Layers,
  Megaphone,
  Music,
  Shield,
  UserCircle,
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
  const router = useRouter();
  const navItems: NavItem[] = getNavItems(role);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const logoSrc =
    mounted && resolvedTheme === "dark"
      ? "/white_ym_logo.png"
      : "/black_ym_logo.jpg";

  const initials = user.email.split("@")[0].slice(0, 2).toUpperCase();

  const handleSignOut = async () => {
    await fetch("/auth/signout", { method: "POST" });
    router.push("/login");
  };

  return (
    <Sidebar collapsible="icon">
      {/* Header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="YM Serving Team">
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center">
                  <Image
                    src={logoSrc}
                    alt="YM Logo"
                    width={32}
                    height={32}
                    className="rounded"
                  />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-bold tracking-tight">
                    YM Serving Team
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

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

      {/* Footer — User menu */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  tooltip={user.email}
                >
                  <Avatar className="size-8 rounded-lg">
                    <AvatarFallback className="rounded-lg text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.email}</span>
                    <span className="truncate text-xs capitalize text-muted-foreground">
                      {user.role}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="top"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-0.5">
                    <span className="truncate text-sm font-medium">
                      {user.email}
                    </span>
                    <span className="truncate text-xs capitalize text-muted-foreground">
                      {user.role}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <UserCircle className="size-4" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => setTheme("light")}>
                    <Sun className="size-4" />
                    Light
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>
                    <Moon className="size-4" />
                    Dark
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")}>
                    <Monitor className="size-4" />
                    System
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
