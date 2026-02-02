"use client";

import { useMemo } from "react";
import { useLifeOSStore } from "@/store/useLifeOSStore";
import { DEFAULT_PUSHUP_GOAL } from "@/lib/constants";

type PushupRadialProps = { compact?: boolean };

/** Radial progress: current / goal (e.g. 30/50). */
export function PushupRadial({ compact = false }: PushupRadialProps) {
  const dailyLog = useLifeOSStore((s) => s.dailyLog);
  const userSettings = useLifeOSStore((s) => s.userSettings);
  const goal = userSettings?.pushup_goal ?? DEFAULT_PUSHUP_GOAL;
  const current = dailyLog.pushup_count;
  const pct = useMemo(
    () => (goal > 0 ? Math.min(100, (current / goal) * 100) : 0),
    [current, goal]
  );
  const r = compact ? 20 : 36;
  const circumference = 2 * Math.PI * r;
  const strokeDashoffset = circumference - (pct / 100) * circumference;
  const size = compact ? 56 : 96;

  return (
    <div className={compact ? "flex shrink-0" : "flex flex-col items-center gap-2"}>
      <div className={`relative ${compact ? "size-14" : "size-24"}`}>
        <svg className="size-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--muted)"
            strokeWidth={compact ? 5 : 8}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--color-pushup)"
            strokeWidth={compact ? 5 : 8}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-[stroke-dashoffset] duration-500"
          />
        </svg>
        {!compact && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-bold tabular-nums text-foreground">{current}</span>
            <span className="text-muted-foreground text-sm">/ {goal}</span>
          </div>
        )}
      </div>
      {!compact && (
        <p className="text-muted-foreground text-xs">
          {pct >= 100 ? "Goal reached" : `${goal - current} to go`}
        </p>
      )}
    </div>
  );
}
