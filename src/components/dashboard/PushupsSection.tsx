"use client";

import { useState } from "react";
import { Dumbbell, Plus } from "lucide-react";
import { useLifeOSStore } from "@/store/useLifeOSStore";
import { PushupsChart } from "@/components/dashboard/PushupsChart";
import { PushupRadial } from "@/components/dashboard/PushupRadial";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Push-ups: hero radial (centered), quick-add below, chart, manual log at bottom. */
export function PushupsSection() {
  const addPushupCount = useLifeOSStore((s) => s.addPushupCount);
  const dailyLog = useLifeOSStore((s) => s.dailyLog);
  const [count, setCount] = useState("");

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const n = parseInt(count, 10);
    if (Number.isNaN(n) || n < 1) return;
    addPushupCount(n);
    setCount("");
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900 dark:text-white">
        <Dumbbell className="size-5 text-[var(--color-pushup)]" />
        Push-ups
      </h2>

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

      {/* Manual log at bottom - same bar style as task add form */}
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
  );
}
