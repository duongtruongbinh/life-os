"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Moon, Target, ListTodo, Settings, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: LayoutDashboard, color: "text-primary" },
  { href: "/habits", label: "Habits", icon: Target, color: "text-[var(--color-habit)]" },
  { href: "/sleep", label: "Sleep", icon: Moon, color: "text-[var(--color-sleep)]" },
  { href: "/tasks", label: "Tasks", icon: ListTodo, color: "text-[var(--color-task)]" },
  { href: "/pushups", label: "Pushups", icon: Dumbbell, color: "text-[var(--color-pushup)]" },
  { href: "/settings", label: "Settings", icon: Settings, color: "text-muted-foreground" },
] as const;

/** Bottom nav bar for mobile with safe-area-inset for iPhone. Hidden on desktop. */
export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex md:hidden border-t border-white/10 bg-background/80 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
      aria-label="Main navigation"
    >
      <div className="flex w-full">
        {navItems.map(({ href, label, icon: Icon, color }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-all",
                isActive
                  ? cn(color, "scale-105")
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "flex size-8 items-center justify-center rounded-xl transition-colors",
                isActive && "bg-white/10"
              )}>
                <Icon className="size-5" />
              </div>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
