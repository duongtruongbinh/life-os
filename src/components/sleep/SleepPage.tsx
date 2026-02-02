"use client";

import { useEffect } from "react";
import { useLifeOSStore } from "@/store/useLifeOSStore";
import { DateNav } from "@/components/dashboard/DateNav";
import { SleepTracker } from "@/components/dashboard/SleepTracker";
import { SleepTimingChart } from "@/components/dashboard/SleepTimingChart";
import { SleepTimelineChart } from "@/components/dashboard/SleepTimelineChart";

/** Dedicated sleep analysis and controls. */
export function SleepPage() {
  const loadInitialData = useLifeOSStore((s) => s.loadInitialData);
  const selectedDate = useLifeOSStore((s) => s.selectedDate);
  const setSelectedDate = useLifeOSStore((s) => s.setSelectedDate);
  const error = useLifeOSStore((s) => s.error);
  const loading = useLifeOSStore((s) => s.loading);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  return (
    <div className="page-bg min-h-full">
      <main className="mx-auto flex min-h-0 max-w-2xl flex-col gap-6 p-4 md:p-6">
        <DateNav value={selectedDate} onChange={setSelectedDate} />

        {error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2 text-destructive text-sm backdrop-blur">
            {error}
          </div>
        )}
        {loading && (
          <div className="text-muted-foreground text-sm">Loading…</div>
        )}

        <div className="bento-tile min-h-0 flex-1">
          <SleepTracker />
        </div>

        <div className="bento-tile space-y-4">
          <h3 className="text-xl font-bold tracking-tight">Bed & Wake Trend</h3>
          <SleepTimingChart />
        </div>

        <div className="bento-tile space-y-4">
          <h3 className="text-xl font-bold tracking-tight">Sleep Timeline</h3>
          <SleepTimelineChart />
        </div>
      </main>
    </div>
  );
}
