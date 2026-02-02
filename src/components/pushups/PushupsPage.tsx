"use client";

import { useEffect } from "react";
import { useLifeOSStore } from "@/store/useLifeOSStore";
import { DateNav } from "@/components/dashboard/DateNav";
import { PushupsSection } from "@/components/dashboard/PushupsSection";

/** Dedicated push-ups tracking: radial progress, chart, manual logging. */
export function PushupsPage() {
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
      <main className="mx-auto flex min-h-0 max-w-4xl flex-col p-4 md:p-6">
        <DateNav value={selectedDate} onChange={setSelectedDate} />

        {error && (
          <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2 text-destructive text-sm backdrop-blur">
            {error}
          </div>
        )}
        {loading && (
          <div className="mb-4 text-muted-foreground text-sm">Loading…</div>
        )}

        <div className="bento-tile min-h-0 flex-1">
          <PushupsSection />
        </div>
      </main>
    </div>
  );
}
