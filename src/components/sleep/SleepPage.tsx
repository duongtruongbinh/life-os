"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useLifeOSStore } from "@/store/useLifeOSStore";
import { DateNav } from "@/components/dashboard/DateNav";
import { SleepTracker } from "@/components/dashboard/SleepTracker";
import { SleepScoreCard } from "@/components/sleep/SleepScoreCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load heavy chart components for better navigation performance
const SleepTimelineChart = dynamic(
  () => import("@/components/dashboard/SleepTimelineChart").then((m) => m.SleepTimelineChart),
  { ssr: false, loading: () => <Skeleton className="h-[200px] w-full rounded-xl" /> }
);

const SleepTimingChart = dynamic(
  () => import("@/components/dashboard/SleepTimingChart").then((m) => m.SleepTimingChart),
  { ssr: false, loading: () => <Skeleton className="h-[200px] w-full rounded-xl" /> }
);

/** Dedicated sleep analysis and controls with tabs layout. */
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
      <main className="mx-auto flex min-h-0 max-w-2xl flex-col gap-4 p-4 pb-24 md:p-6 md:pb-24">
        {error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2 text-destructive text-sm backdrop-blur">
            {error}
          </div>
        )}
        {loading && (
          <div className="text-muted-foreground text-sm">Loading…</div>
        )}

        <Tabs defaultValue="tracker" className="flex-1">
          <TabsList className="w-full">
            <TabsTrigger value="tracker" className="flex-1">Tracker</TabsTrigger>
            <TabsTrigger value="analysis" className="flex-1">Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="tracker" className="mt-4 space-y-4">
            <DateNav value={selectedDate} onChange={setSelectedDate} />
            <div className="bento-tile min-h-0">
              <SleepTracker />
            </div>
            <SleepScoreCard />
          </TabsContent>

          <TabsContent value="analysis" className="mt-4 space-y-4">
            <div className="bento-tile space-y-4">
              <h3 className="text-xl font-bold tracking-tight">Sleep Timeline</h3>
              <SleepTimelineChart />
            </div>
            <div className="bento-tile space-y-4">
              <h3 className="text-xl font-bold tracking-tight">Bed & Wake Trend</h3>
              <SleepTimingChart />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
