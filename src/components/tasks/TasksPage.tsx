"use client";

import { useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { useLifeOSStore } from "@/store/useLifeOSStore";
import { DateNav } from "@/components/dashboard/DateNav";
import { TodoList } from "@/components/dashboard/TodoList";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load chart component
const TasksChart = dynamic(
  () => import("@/components/dashboard/TasksChart").then((m) => m.TasksChart),
  { ssr: false, loading: () => <Skeleton className="h-[200px] w-full rounded-xl" /> }
);
const TaskPriorityChart = dynamic(
  () => import("@/components/dashboard/TaskPriorityChart").then((m) => m.TaskPriorityChart),
  { ssr: false, loading: () => <Skeleton className="h-[200px] w-full rounded-xl" /> }
);


/** Advanced todo list view with productivity analytics. */
export function TasksPage() {
  const loadInitialData = useLifeOSStore((s) => s.loadInitialData);
  const selectedDate = useLifeOSStore((s) => s.selectedDate);
  const setSelectedDate = useLifeOSStore((s) => s.setSelectedDate);
  const tasks = useLifeOSStore((s) => s.tasks);
  const error = useLifeOSStore((s) => s.error);
  const loading = useLifeOSStore((s) => s.loading);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const { completedToday, totalPending } = useMemo(() => {
    const today = selectedDate;
    const completedToday = tasks.filter(
      (t) => t.is_completed && t.completed_at != null && t.completed_at.slice(0, 10) === today
    ).length;
    const totalPending = tasks.filter((t) => !t.is_completed).length;
    return { completedToday, totalPending };
  }, [tasks, selectedDate]);

  return (
    <div className="page-bg min-h-full">
      <main className="mx-auto flex min-h-0 max-w-5xl flex-col gap-6 p-4 pb-24 md:p-6 md:pb-6">
        <DateNav value={selectedDate} onChange={setSelectedDate} />

        {error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2 text-destructive text-sm backdrop-blur">
            {error}
          </div>
        )}
        {loading && (
          <div className="text-muted-foreground text-sm">Loading…</div>
        )}

        {/* Productivity: chart + summary */}
        <section className="bento-tile flex flex-col gap-4">
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Productivity
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                Completed today
              </p>
              <p className="text-xl font-bold tabular-nums text-slate-900 dark:text-white">
                {completedToday}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                Pending
              </p>
              <p className="text-xl font-bold tabular-nums text-slate-900 dark:text-white">
                {totalPending}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TasksChart />
            <div className="hidden md:block">
              <TaskPriorityChart />
            </div>
          </div>
          <div className="md:hidden">
            {/* Show only Bar Chart on mobile to save space, or stack? Let's stack if mobile logic in chart handles it */}
            {/* Actually reusing TasksChart logic for mobile. */}
          </div>

        </section>

        <div className="bento-tile min-h-0 flex-1">
          <TodoList />
        </div>
      </main>
    </div>
  );
}
