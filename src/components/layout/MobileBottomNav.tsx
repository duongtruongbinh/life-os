"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Moon, Target, ListTodo, Settings, Dumbbell, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: LayoutDashboard, color: "text-primary", bg: "bg-primary/10" },
  { href: "/tasks", label: "Tasks", icon: ListTodo, color: "text-[var(--color-task)]", bg: "bg-[var(--color-task)]/10" },
  { href: "/sleep", label: "Sleep", icon: Moon, color: "text-[var(--color-sleep)]", bg: "bg-[var(--color-sleep)]/10" },
  { href: "/focus", label: "Focus", icon: Timer, color: "text-[var(--color-focus)]", bg: "bg-[var(--color-focus)]/10" },
  { href: "/habits", label: "Habits", icon: Target, color: "text-[var(--color-habit)]", bg: "bg-[var(--color-habit)]/10" },
  { href: "/pushups", label: "Pushups", icon: Dumbbell, color: "text-[var(--color-pushup)]", bg: "bg-[var(--color-pushup)]/10" },
  { href: "/settings", label: "Settings", icon: Settings, color: "text-muted-foreground", bg: "bg-muted/50" },
] as const;

/** Bottom nav bar for mobile with safe-area-inset for iPhone. Hidden on desktop. */
export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex md:hidden border-t border-white/10 bg-background/80 backdrop-blur-2xl pb-[env(safe-area-inset-bottom)]"
      aria-label="Main navigation"
    >
      <div className="flex w-full">
        {navItems.map(({ href, label, icon: Icon, color, bg }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-spring active:scale-95",
                isActive ? color : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "flex size-9 items-center justify-center rounded-xl transition-spring",
                  isActive
                    ? cn(bg, "scale-105 shadow-sm nav-glow-active")
                    : "hover:bg-muted/30"
                )}
              >
                <Icon className={cn(
                  "size-5 transition-spring",
                  isActive ? "scale-110" : "group-hover:scale-105"
                )} />
              </div>
              <span className={cn(
                "transition-opacity",
                isActive ? "font-semibold" : "opacity-70"
              )}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
