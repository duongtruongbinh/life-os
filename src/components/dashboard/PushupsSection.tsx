"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Dumbbell, Plus, Video } from "lucide-react";
import { useLifeOSStore } from "@/store/useLifeOSStore";
import { PushupsChart } from "@/components/dashboard/PushupsChart";
import { PushupRadial } from "@/components/dashboard/PushupRadial";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Lazy load the detector to reduce initial bundle size
const PushupDetector = dynamic(
  () => import("@/components/pushups/PushupDetector").then((m) => m.PushupDetector),
  { ssr: false }
);

/** Push-ups: hero radial (centered), quick-add below, AI counter, chart, manual log. */
export function PushupsSection() {
  const addPushupCount = useLifeOSStore((s) => s.addPushupCount);
  const [count, setCount] = useState("");
  const [showDetector, setShowDetector] = useState(false);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const n = parseInt(count, 10);
    if (Number.isNaN(n) || n < 1) return;
    addPushupCount(n);
    setCount("");
  }

  function handleDetectorFinish(reps: number) {
    if (reps > 0) {
      addPushupCount(reps);
    }
    setShowDetector(false);
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            <Dumbbell className="size-5 text-[var(--color-pushup)]" />
            Push-ups
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetector(true)}
            className="gap-1.5 rounded-xl border-[var(--color-pushup)]/30 text-[var(--color-pushup)] hover:bg-[var(--color-pushup)]/10 hover:text-[var(--color-pushup)]"
          >
            <Video className="size-4" />
            AI Counter
          </Button>
        </div>

        {/* Hero: centered radial + quick-add below */}
        <div className="flex flex-col items-center gap-4">
          <PushupRadial />
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => addPushupCount(10)}
              className="min-h-[44px] min-w-[80px] rounded-xl border-slate-200 dark:border-white/10 dark:hover:bg-white/5"
            >
              +10
            </Button>
            <Button
              variant="outline"
              onClick={() => addPushupCount(20)}
              className="min-h-[44px] min-w-[80px] rounded-xl border-slate-200 dark:border-white/10 dark:hover:bg-white/5"
            >
              +20
            </Button>
            <Button
              variant="outline"
              onClick={() => addPushupCount(50)}
              className="min-h-[44px] min-w-[80px] rounded-xl border-slate-200 dark:border-white/10 dark:hover:bg-white/5"
            >
              +50
            </Button>
          </div>
        </div>

        {/* Chart */}
        <div className="min-w-0">
          <PushupsChart />
        </div>

        {/* Manual log at bottom */}
        <form
          onSubmit={handleAdd}
          className="flex h-12 min-w-0 items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
        >
          <Input
            type="number"
            min={1}
            placeholder="Count"
            value={count}
            onChange={(e) => setCount(e.target.value)}
            className="h-full min-w-0 flex-1 rounded-l-xl rounded-r-none border-0 bg-transparent px-4 text-center text-base shadow-none focus-visible:ring-0"
          />
          <Button
            type="submit"
            className="h-full shrink-0 rounded-l-none rounded-r-xl px-6"
          >
            <Plus className="mr-1 size-4" />
            Log
          </Button>
        </form>
      </div>

      {/* AI Push-up Detector Overlay */}
      {showDetector && (
        <PushupDetector
          onFinish={handleDetectorFinish}
          onClose={() => setShowDetector(false)}
        />
      )}
    </>
  );
}
