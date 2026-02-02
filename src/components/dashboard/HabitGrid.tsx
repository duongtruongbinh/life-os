"use client";

import { useCallback } from "react";
import { Settings2, Target, Check } from "lucide-react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { useLifeOSStore } from "@/store/useLifeOSStore";
import Link from "next/link";
import { getHabitIcon } from "@/lib/habit-icons";
import { HABIT_CHART_COLORS } from "@/lib/constants";

/** Single habit row: Icon | Name | Check. */
function HabitRow({
  habit,
  color,
  onToggle,
}: {
  habit: { id: string; name: string; icon: string | null };
  color: string;
  onToggle: () => void;
}) {
  const Icon = getHabitIcon(habit.icon);
  const habitsStatus = useLifeOSStore((s) => s.dailyLog.habits_status);
  const checked = habitsStatus[habit.id] ?? false;

  return (
    <div
      className="flex min-h-[52px] items-center justify-between gap-3 rounded-2xl border border-border bg-muted/30 px-4 py-3 transition-colors hover:border-border hover:bg-muted/50"
      role="row"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Icon className="size-5 shrink-0 text-muted-foreground" style={{ color }} />
        <span className="truncate text-base font-medium">{habit.name}</span>
      </div>
      <Button
        variant={checked ? "default" : "outline"}
        size="icon"
        onClick={onToggle}
        className="size-10 shrink-0 md:size-10"
        style={checked ? { backgroundColor: color, borderColor: color } : undefined}
        aria-label={checked ? "Mark incomplete" : "Mark complete"}
      >
        <Check className="size-5" />
      </Button>
    </div>
  );
}

/** Compact list view: [Icon] [Name] [7 dots] [Check]. Streaks-style habit tracker. */
export function HabitGrid() {
  const habitDefinitions = useLifeOSStore((s) => s.habitDefinitions);
  const toggleHabit = useLifeOSStore((s) => s.toggleHabit);

  const handleToggle = useCallback(
    (habitId: string) => {
      const habitsStatus = useLifeOSStore.getState().dailyLog.habits_status;
      const wasDone = habitsStatus[habitId] ?? false;
      toggleHabit(habitId);
      if (!wasDone) {
        confetti({
          particleCount: 30,
          spread: 60,
          origin: { y: 0.6 },
          colors: ["#22c55e", "#10b981", "#34d399"],
        });
      }
    },
    [toggleHabit]
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Habits</h2>
        <Button
          size="icon"
          variant="ghost"
          asChild
          title="Manage habits"
          className="size-11 shrink-0 opacity-70 hover:opacity-100"
        >
          <Link href="/settings">
            <Settings2 className="size-4" />
          </Link>
        </Button>
      </div>
      {habitDefinitions.length === 0 ? (
        <div
          className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 py-6 text-center"
          role="presentation"
        >
          <Target className="size-6 text-[var(--color-habit)]/80" />
          <p className="text-muted-foreground text-sm font-medium">
            Ready to build new habits?
          </p>
          <Button size="sm" variant="outline" asChild className="min-h-[44px] md:min-h-0">
            <Link href="/settings">Add habits</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {habitDefinitions.map((h, idx) => {
            const color = h.color ?? HABIT_CHART_COLORS[idx % HABIT_CHART_COLORS.length];
            return (
              <HabitRow
                key={h.id}
                habit={h}
                color={color}
                onToggle={() => handleToggle(h.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
