"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { useLifeOSStore } from "@/store/useLifeOSStore";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { WeeklySummary } from "@/components/dashboard/WeeklySummary";
import { WellnessCard } from "@/components/dashboard/WellnessCard";
import { TasksCard } from "@/components/dashboard/TasksCard";
import { FocusCard } from "@/components/dashboard/FocusCard";
import { SleepCard } from "@/components/dashboard/SleepCard";

// Lazy load heavy chart components
const ProductivityHeatmap = dynamic(
  () => import("@/components/dashboard/ProductivityHeatmap").then((m) => m.ProductivityHeatmap),
  { ssr: false, loading: () => <Skeleton className="h-full w-full rounded-2xl min-h-[160px]" /> }
);

const WellnessRadar = dynamic(
  () => import("@/components/dashboard/WellnessRadar").then((m) => m.WellnessRadar),
  { ssr: false, loading: () => <Skeleton className="h-full w-full rounded-2xl min-h-[200px]" /> }
);

export function Dashboard() {
  const loadInitialData = useLifeOSStore((s) => s.loadInitialData);
  const error = useLifeOSStore((s) => s.error);
  const loading = useLifeOSStore((s) => s.loading);
  const isInitialized = useLifeOSStore((s) => s.isInitialized);

  // Prevent hydration mismatch by mounting only on client
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    loadInitialData();
  }, [loadInitialData]);

  if (!mounted) return <div className="min-h-screen bg-transparent" />;

  return (
    <div className="page-bg min-h-screen flex flex-col">
      <main className="mx-auto flex-1 w-full max-w-[1400px] p-3 pb-24 lg:p-6 lg:pb-6 flex flex-col gap-3">

        {/* Error / Loading States */}
        {error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2 text-destructive text-sm font-medium backdrop-blur animate-in slide-in-from-top-2">
            ⚠️ {error}
          </div>
        )}
        {(loading && !isInitialized) && (
          <div className="text-muted-foreground text-sm animate-pulse px-1">
            Syncing LifeOS...
          </div>
        )}

        <DashboardHeader />

        {/* Weekly Summary */}
        <WeeklySummary />

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:grid-rows-[auto_1fr] flex-1">

          {/* --- TOP SECTION --- */}

          {/* Productivity Heatmap (Col 8) */}
          <div className="lg:col-span-8 h-[220px] lg:h-[280px]">
            <div className="bento-tile p-4 h-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm">
              <ProductivityHeatmap />
            </div>
          </div>

          {/* Wellness Radar (Col 4) */}
          <div className="lg:col-span-4 h-[220px] lg:h-[280px]">
            <WellnessRadar />
          </div>

          {/* --- BOTTOM SECTION --- */}

          {/* Tasks (Col 8 - Expanded) */}
          <div className="lg:col-span-8 h-full min-h-[500px]">
            <TasksCard />
          </div>

          {/* Right Column Stack (Col 4) */}
          <div className="lg:col-span-4 flex flex-col gap-3 h-full">
            {/* Habits/Wellness */}
            <div className="min-h-[280px] flex-none">
              <WellnessCard />
            </div>

            {/* Focus Card */}
            <div className="min-h-[300px] flex-1">
              <FocusCard />
            </div>

            {/* Sleep Card */}
            <div className="min-h-[300px] flex-1">
              <SleepCard />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
