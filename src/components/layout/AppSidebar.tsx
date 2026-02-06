"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Moon,
  Target,
  ListTodo,
  Settings,
  LayoutDashboardIcon,
  Dumbbell,
  Timer,
} from "lucide-react";
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
import { SignOutButton } from "@/components/dashboard/SignOutButton";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, color: "text-primary", bg: "bg-primary/10" },
  { href: "/tasks", label: "Tasks", icon: ListTodo, color: "text-[var(--color-task)]", bg: "bg-[var(--color-task)]/10" },
  { href: "/sleep", label: "Sleep", icon: Moon, color: "text-[var(--color-sleep)]", bg: "bg-[var(--color-sleep)]/10" },
  { href: "/focus", label: "Focus", icon: Timer, color: "text-[var(--color-focus)]", bg: "bg-[var(--color-focus)]/10" },
  { href: "/habits", label: "Habits", icon: Target, color: "text-[var(--color-habit)]", bg: "bg-[var(--color-habit)]/10" },
  { href: "/pushups", label: "Pushups", icon: Dumbbell, color: "text-[var(--color-pushup)]", bg: "bg-[var(--color-pushup)]/10" },
  { href: "/settings", label: "Settings", icon: Settings, color: "text-muted-foreground", bg: "bg-muted/50" },
] as const;

import { cn } from "@/lib/utils";

/** App sidebar: Dashboard, Habits, Sleep, Tasks, Settings. Collapses to sheet on mobile. */
export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <Link href="/" className="flex items-center gap-2">
          <LayoutDashboardIcon className="size-6 text-sidebar-primary" />
          <span className="font-semibold tracking-tight text-lg">Life OS</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(({ href, label, icon: Icon, color, bg }) => {
                const isActive =
                  href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(href);
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={label}
                      className={cn(
                        "transition-all duration-200",
                        isActive ? cn(color, bg, "font-medium") : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Link href={href}>
                        <Icon className={cn("size-4", isActive && "scale-110")} />
                        <span>{label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SignOutButton className="w-full justify-start" />
      </SidebarFooter>
    </Sidebar>
  );
}
