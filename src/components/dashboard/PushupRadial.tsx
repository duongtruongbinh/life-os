"use client";

import { useMemo, useEffect, useRef } from "react";
import { m, useSpring, useTransform } from "framer-motion";
import confetti from "canvas-confetti";
import { useLifeOSStore } from "@/store/useLifeOSStore";
import { DEFAULT_PUSHUP_GOAL } from "@/lib/constants";

type PushupRadialProps = { compact?: boolean };

/** Radial progress with animated counter and celebration effects. */
export function PushupRadial({ compact = false }: PushupRadialProps) {
  const dailyLog = useLifeOSStore((s) => s.dailyLog);
  const userSettings = useLifeOSStore((s) => s.userSettings);
  const goal = userSettings?.pushup_goal ?? DEFAULT_PUSHUP_GOAL;
  const current = dailyLog.pushup_count;

  const pct = useMemo(
    () => (goal > 0 ? Math.min(100, ((current ?? 0) / goal) * 100) : 0),
    [current, goal]
  );

  const r = compact ? 20 : 40; // Increased radius
  const circumference = 2 * Math.PI * r;
  const strokeDashoffset = circumference - (pct / 100) * circumference;
  const size = compact ? 56 : 120; // Increased container size

  // Animated counter
  const springValue = useSpring(0, { stiffness: 100, damping: 30 });
  const displayValue = useTransform(springValue, (v) => Math.round(v));

  // Track previous value for confetti trigger
  const prevPctRef = useRef(pct);

  useEffect(() => {
    springValue.set(current ?? 0);
  }, [current, springValue]);

  // Celebrate when goal is reached
  useEffect(() => {
    if (pct >= 100 && prevPctRef.current < 100) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#f97316", "#ea580c", "#fb923c", "#fdba74"],
      });
    }
    prevPctRef.current = pct;
  }, [pct]);

  const isComplete = pct >= 100;

  return (
    <div className={compact ? "flex shrink-0" : "flex flex-col items-center justify-center p-2"}>
      <div
        className={`relative ${compact ? "size-14" : "size-32"} ${isComplete && !compact ? "animate-pulse-soft" : ""
          }`}
      >
        {/* Glow effect when complete */}
        {isComplete && !compact && (
          <div
            className="absolute inset-0 rounded-full blur-2xl opacity-40"
            style={{ backgroundColor: "var(--color-pushup)" }}
          />
        )}

        <svg className="size-full -rotate-90 overflow-visible" viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--muted)"
            strokeWidth={compact ? 5 : 10}
            className="opacity-30"
          />
          <m.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--color-pushup)"
            strokeWidth={compact ? 5 : 10}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{
              filter: isComplete ? "drop-shadow(0 0 6px var(--color-pushup))" : "none",
            }}
          />
        </svg>

        {!compact && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <m.span
              className="text-3xl font-bold tabular-nums tracking-tight"
              style={{
                color: isComplete ? "var(--color-pushup)" : "var(--foreground)"
              }}
            >
              {displayValue}
            </m.span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              / {goal}
            </span>
          </div>
        )}
      </div>

      {!compact && (
        <p className={`mt-2 text-xs font-medium ${isComplete ? "text-[var(--color-pushup)]" : "text-muted-foreground"}`}
        >
          {isComplete ? "🎉 Goal reached!" : `${goal - (current ?? 0)} to go`}
        </p>
      )}
    </div>
  );
}

