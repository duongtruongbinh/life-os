"use client";

import { useEffect, useState } from "react";
import { m } from "framer-motion";

import { useLifeOSStore } from "@/store/useLifeOSStore";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { WeeklySummary } from "@/components/dashboard/WeeklySummary";
import { WellnessCard } from "@/components/dashboard/WellnessCard";
import { TasksCard } from "@/components/dashboard/TasksCard";
import { FocusCard } from "@/components/dashboard/FocusCard";
import { SleepCard } from "@/components/dashboard/SleepCard";
import { getLogicalDate } from "@/lib/date-utils";

// Lazy load heavy chart components

export function Dashboard() {
  const loadInitialData = useLifeOSStore((s) => s.loadInitialData);
  const error = useLifeOSStore((s) => s.error);
  const loading = useLifeOSStore((s) => s.loading);
  const isInitialized = useLifeOSStore((s) => s.isInitialized);

  // Prevent hydration mismatch by mounting only on client
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setTimeout(() => setMounted(true), 0);
    if (!useLifeOSStore.getState().isInitialized) {
      loadInitialData();
    }
    // Always reset dashboard to today's view (logical day)
    useLifeOSStore.getState().setSelectedDate(getLogicalDate());
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

        {/* Main Grid Layout - Staggered Entry */}
        <m.div
          className="grid grid-cols-1 gap-4 lg:grid-cols-12 flex-1 animate-stagger"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1 }
            }
          }}
        >

          {/* --- LEFT COLUMN (Main Content) --- */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            {/* Merged Weekly Overview (Stats + Radar) */}
            <WeeklySummary className="h-[250px] shrink-0" />

            {/* Tasks List */}
            <div className="flex-1 min-h-[500px]">
              <TasksCard />
            </div>
          </div>

          {/* --- RIGHT COLUMN (Sidebar Widgets) --- */}
          <div className="lg:col-span-4 flex flex-col gap-4 h-full">
            {/* Habits/Wellness */}
            <div className="flex-none">
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

        </m.div>
      </main>
    </div>
  );
}
