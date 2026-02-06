"use client";

import { useMemo } from "react";
import { useLifeOSStore } from "@/store/useLifeOSStore";
import { DEFAULT_TARGET_FOCUS_HOURS } from "@/lib/constants";

type FocusRadialProps = { compact?: boolean };

/** Radial progress: current minutes / goal minutes (calculated from hours). */
export function FocusRadial({ compact = false }: FocusRadialProps) {
    const dailyLog = useLifeOSStore((s) => s.dailyLog);
    const userSettings = useLifeOSStore((s) => s.userSettings);

    const goalHours = userSettings?.target_focus_hours ?? DEFAULT_TARGET_FOCUS_HOURS;
    const goalMinutes = goalHours * 60;

    // Use focus_minutes directly
    const currentMinutes = dailyLog.focus_minutes || 0;

    const pct = useMemo(
        () => (goalMinutes > 0 ? Math.min(100, (currentMinutes / goalMinutes) * 100) : 0),
        [currentMinutes, goalMinutes]
    );

    const r = compact ? 20 : 36;
    const circumference = 2 * Math.PI * r;
    const strokeDashoffset = circumference - (pct / 100) * circumference;
    const size = compact ? 56 : 96;

    // Format display
    const hours = Math.floor(currentMinutes / 60);
    const minutes = currentMinutes % 60;
    const displayValue = `${hours}h ${minutes}m`;

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
                        stroke="var(--color-focus)"
                        strokeWidth={compact ? 5 : 8}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-[stroke-dashoffset] duration-500"
                    />
                </svg>
                {!compact && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-xl font-bold tabular-nums text-foreground">{hours}h</span>
                        <span className="text-muted-foreground text-xs">{minutes}m / {goalHours}h</span>
                    </div>
                )}
            </div>
            {!compact && (
                <p className="text-muted-foreground text-xs">
                    {pct >= 100 ? "Goal reached!" : `${((goalMinutes - currentMinutes) / 60).toFixed(1)}h left`}
                </p>
            )}
        </div>
    );
}
