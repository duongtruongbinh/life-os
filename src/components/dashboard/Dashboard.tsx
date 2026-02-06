"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { useLifeOSStore } from "@/store/useLifeOSStore";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { WellnessCard } from "@/components/dashboard/WellnessCard";
import { TasksCard } from "@/components/dashboard/TasksCard";
import { FocusCard } from "@/components/dashboard/FocusCard";
import { SleepCard } from "@/components/dashboard/SleepCard";

// Lazy load heavy chart components
const ProductivityHeatmap = dynamic(
  () => import("@/components/dashboard/ProductivityHeatmap").then((m) => m.ProductivityHeatmap),
  { ssr: false, loading: () => <Skeleton className="h-full w-full rounded-2xl min-h-[160px]" /> }
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

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:grid-rows-[auto_1fr] flex-1">

          {/* --- TOP SECTION --- */}

          {/* Productivity Heatmap (Col 9) */}
          <div className="lg:col-span-9 h-[220px] lg:h-[280px]">
            <div className="bento-tile p-4 h-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm">
              <ProductivityHeatmap />
            </div>
          </div>

          {/* Wellness: Habits + Pushups (Col 3) */}
          <div className="lg:col-span-3 h-[280px] lg:h-[280px]">
            <WellnessCard />
          </div>

          {/* --- BOTTOM SECTION --- */}

          {/* Tasks (Col 6) */}
          <div className="lg:col-span-6 min-h-[300px]">
            <TasksCard />
          </div>

          {/* Focus Card (Col 3) */}
          <div className="lg:col-span-3 min-h-[300px]">
            <FocusCard />
          </div>

          {/* Sleep Card (Col 3) */}
          <div className="lg:col-span-3 min-h-[300px]">
            <SleepCard />
          </div>

        </div>
      </main>
    </div>
  );
}
