"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getMergedLogs, useLifeOSStore } from "@/store/useLifeOSStore";
import { DateNav } from "@/components/dashboard/DateNav";
import { HabitGrid } from "@/components/dashboard/HabitGrid";
import { HabitHeatmap } from "@/components/habits/HabitHeatmap";
import { getDailyLogsForRange } from "@/app/actions/daily-logs";
import { HABIT_CHART_COLORS } from "@/lib/constants";
import type { DailyLog } from "@/types/database";
import { cn } from "@/lib/utils";

/** Full-screen habit tracking with unified Master Heatmap. */
export function HabitsPage() {
  const loadInitialData = useLifeOSStore((s) => s.loadInitialData);
  const habitDefinitions = useLifeOSStore((s) => s.habitDefinitions);
  const selectedDate = useLifeOSStore((s) => s.selectedDate);
  const setSelectedDate = useLifeOSStore((s) => s.setSelectedDate);
  const dailyLog = useLifeOSStore((s) => s.dailyLog);
  const modifiedLogs = useLifeOSStore((s) => s.modifiedLogs);
  const error = useLifeOSStore((s) => s.error);
  const loading = useLifeOSStore((s) => s.loading);

  const currentYear = new Date().getFullYear();
  const [heatmapYear, setHeatmapYear] = useState(currentYear);
  const [heatmapLogs, setHeatmapLogs] = useState<DailyLog[]>([]);
  const [heatmapFilter, setHeatmapFilter] = useState<string | "all">("all");

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    const start = `${heatmapYear}-01-01`;
    const end = `${heatmapYear}-12-31`;
    getDailyLogsForRange(start, end).then(({ data }) => {
      setHeatmapLogs(data ?? []);
    });
  }, [heatmapYear]);

  const yearLogs = useMemo(() => {
    const overlay = { ...modifiedLogs, [dailyLog.date]: dailyLog };
    const merged = getMergedLogs(heatmapLogs, overlay);
    return merged.filter((l) => l.date.startsWith(`${heatmapYear}-`));
  }, [heatmapLogs, modifiedLogs, dailyLog, heatmapYear]);

  return (
    <div className="page-bg min-h-full">
      <main className="mx-auto flex min-h-0 max-w-3xl flex-col p-4 md:p-6">
        <DateNav value={selectedDate} onChange={setSelectedDate} />

        {error && (
          <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2 text-destructive text-sm backdrop-blur">
            {error}
          </div>
        )}
        {loading && (
          <div className="mb-4 text-muted-foreground text-sm">Loading…</div>
        )}

        <div className="flex flex-col gap-4">
          <div className="bento-tile min-h-0 flex-1">
            <HabitGrid />
          </div>
          {habitDefinitions.length > 0 && (
            <div className="bento-tile flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xl font-bold tracking-tight">Heatmap</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setHeatmapFilter("all")}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                      heatmapFilter === "all"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    All Activity
                  </button>
                  {habitDefinitions.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => setHeatmapFilter(h.id)}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                        heatmapFilter === h.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {h.name}
                    </button>
                  ))}
                  <div className="ml-auto flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2 py-1">
                    <button
                      type="button"
                      onClick={() => setHeatmapYear((y) => y - 1)}
                      className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
                      aria-label="Previous year"
                    >
                      <ChevronLeft className="size-5" />
                    </button>
                    <span className="min-w-[52px] text-center text-sm font-semibold tabular-nums">
                      {heatmapYear}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setHeatmapYear((y) => Math.min(currentYear, y + 1))
                      }
                      disabled={heatmapYear >= currentYear}
                      className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent"
                      aria-label="Next year"
                    >
                      <ChevronRight className="size-5" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="min-h-0">
                {heatmapFilter === "all" ? (
                  <HabitHeatmap
                    mode="all"
                    habitDefinitions={habitDefinitions.map((h) => ({
                      id: h.id,
                      name: h.name,
                    }))}
                    year={heatmapYear}
                    yearLogs={yearLogs}
                  />
                ) : (
                  (() => {
                    const h = habitDefinitions.find((x) => x.id === heatmapFilter);
                    if (!h) return null;
                    const idx = habitDefinitions.indexOf(h);
                    const color =
                      h.color ??
                      HABIT_CHART_COLORS[idx % HABIT_CHART_COLORS.length];
                    return (
                      <HabitHeatmap
                        mode="single"
                        habitId={h.id}
                        habitName={h.name}
                        color={color}
                        year={heatmapYear}
                        yearLogs={yearLogs}
                      />
                    );
                  })()
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
