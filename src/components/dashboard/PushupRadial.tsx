"use client";

import { useMemo, useEffect, useRef } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
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
    () => (goal > 0 ? Math.min(100, (current / goal) * 100) : 0),
    [current, goal]
  );

  const r = compact ? 20 : 36;
  const circumference = 2 * Math.PI * r;
  const strokeDashoffset = circumference - (pct / 100) * circumference;
  const size = compact ? 56 : 96;

  // Animated counter
  const springValue = useSpring(0, { stiffness: 100, damping: 30 });
  const displayValue = useTransform(springValue, (v) => Math.round(v));

  // Track previous value for confetti trigger
  const prevPctRef = useRef(pct);

  useEffect(() => {
    springValue.set(current);
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
    <div className={compact ? "flex shrink-0" : "flex flex-col items-center gap-2"}>
      <div
        className={`relative ${compact ? "size-14" : "size-24"} ${isComplete && !compact ? "animate-pulse-soft" : ""
          }`}
      >
        {/* Glow effect when complete */}
        {isComplete && !compact && (
          <div
            className="absolute inset-0 rounded-full blur-xl opacity-30"
            style={{ backgroundColor: "var(--color-pushup)" }}
          />
        )}

        <svg className="size-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--muted)"
            strokeWidth={compact ? 5 : 8}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--color-pushup)"
            strokeWidth={compact ? 5 : 8}
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
            <motion.span
              className="text-2xl font-bold tabular-nums text-foreground"
              style={{
                color: isComplete ? "var(--color-pushup)" : undefined
              }}
            >
              {displayValue}
            </motion.span>
            <span className="text-muted-foreground text-sm">/ {goal}</span>
          </div>
        )}
      </div>

      {!compact && (
        <p className={`text-xs ${isComplete ? "text-[var(--color-pushup)] font-semibold" : "text-muted-foreground"}`}>
          {isComplete ? "🎉 Goal reached!" : `${goal - current} to go`}
        </p>
      )}
    </div>
  );
}

