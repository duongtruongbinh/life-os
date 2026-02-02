"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Moon, Target, ListTodo, Settings, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/habits", label: "Habits", icon: Target },
  { href: "/sleep", label: "Sleep", icon: Moon },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/pushups", label: "Pushups", icon: Dumbbell },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

/** Bottom nav bar for mobile; hidden on desktop. */
export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex md:hidden border-t border-border bg-card/95 backdrop-blur-lg"
      aria-label="Main navigation"
    >
      <div className="flex w-full">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition-colors",
                isActive
                  ? "text-sidebar-primary font-medium"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="size-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
