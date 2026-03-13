"use client";

import { useMemo } from "react";
import { Moon, Zap, AlertTriangle } from "lucide-react";
import { useLifeOSStore } from "@/store/useLifeOSStore";
import { mergeLogs } from "@/lib/log-utils";
import { calculateDurationHours } from "@/lib/date-utils";
import { DEFAULT_TARGET_SLEEP_HOURS } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Shows weekly sleep debt vs target, with actionable advice. */
export function SleepDebtCard() {
    const dailyLogsLast7 = useLifeOSStore((s) => s.dailyLogsLast7);
    const modifiedLogs = useLifeOSStore((s) => s.modifiedLogs);
    const dailyLog = useLifeOSStore((s) => s.dailyLog);
    const userSettings = useLifeOSStore((s) => s.userSettings);

    const targetHours = userSettings?.target_sleep_hours ?? DEFAULT_TARGET_SLEEP_HOURS;

    const { totalSleep, avgSleep, debt } = useMemo(() => {
        const merged = mergeLogs(dailyLogsLast7, { ...modifiedLogs, [dailyLog.date]: dailyLog });
        const daysWithData = merged.filter((l) => l.sleep_start && l.sleep_end);

        let totalSleep = 0;
        for (const log of daysWithData) {
            totalSleep += calculateDurationHours(log.sleep_start, log.sleep_end);
        }

        const avgSleep = daysWithData.length > 0 ? totalSleep / daysWithData.length : 0;
        const expectedSleep = targetHours * Math.max(1, daysWithData.length);
        const debt = expectedSleep - totalSleep;

        return { totalSleep, avgSleep, debt };
    }, [dailyLogsLast7, modifiedLogs, dailyLog, targetHours]);

    const hasDebt = debt > 0;
    const Icon = hasDebt ? AlertTriangle : Zap;

    return (
        <div
            className={cn(
                "flex items-start gap-4 rounded-xl border px-4 py-4",
                hasDebt
                    ? "border-amber-500/20 bg-amber-500/10"
                    : "border-emerald-500/20 bg-emerald-500/10"
            )}
        >
            <Icon
                className={cn(
                    "mt-0.5 size-5 shrink-0",
                    hasDebt ? "text-amber-500" : "text-emerald-500"
                )}
            />
            <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-foreground">
                    {hasDebt
                        ? `Sleep Debt: ${debt.toFixed(1)}h`
                        : "Well Rested! Battery Full ⚡"}
                </span>
                <span className="text-xs text-muted-foreground">
                    {hasDebt
                        ? "Try sleeping 30m earlier tonight."
                        : `Averaging ${avgSleep.toFixed(1)}h/night this week.`}
                </span>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Moon className="size-3" />
                        Total: {totalSleep.toFixed(1)}h
                    </span>
                    <span>Avg: {avgSleep.toFixed(1)}h/night</span>
                    <span>Target: {targetHours}h/night</span>
                </div>
            </div>
        </div>
    );
}
