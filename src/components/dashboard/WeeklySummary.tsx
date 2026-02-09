"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, TrendingDown, Minus, Target, Moon, Dumbbell, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getMergedLogs, useLifeOSStore } from "@/store/useLifeOSStore";
import { getLastNDateStrings, getLocalDateKey, calculateDurationHours } from "@/lib/date-utils";
import { DEFAULT_TARGET_FOCUS_HOURS, DEFAULT_TARGET_SLEEP_HOURS, DEFAULT_PUSHUP_GOAL } from "@/lib/constants";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const WellnessRadar = dynamic(
    () => import("@/components/dashboard/WellnessRadar").then((m) => m.WellnessRadar),
    { ssr: false, loading: () => <Skeleton className="h-full w-full rounded-full" /> }
);

interface WeeklyMetric {
    label: string;
    value: string;
    change: number | null; // Percentage change from last week
    icon: React.ElementType;
    color: string;
}

function TrendIndicator({ change }: { change: number | null }) {
    if (change === null) return null;

    const Icon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;
    const color = change > 0 ? "text-green-500" : change < 0 ? "text-red-500" : "text-muted-foreground";

    return (
        <div className={cn("flex items-center gap-0.5 text-[10px] font-bold", color)}>
            <Icon className="size-3" />
            <span>{change > 0 ? "+" : ""}{change.toFixed(0)}%</span>
        </div>
    );
}

export function WeeklySummary({ className }: { className?: string }) {
    const dailyLogsLast7 = useLifeOSStore((s) => s.dailyLogsLast7);
    const dailyLogsLast28 = useLifeOSStore((s) => s.dailyLogsLast28);
    const modifiedLogs = useLifeOSStore((s) => s.modifiedLogs);
    const dailyLog = useLifeOSStore((s) => s.dailyLog);
    const habitDefinitions = useLifeOSStore((s) => s.habitDefinitions);
    const userSettings = useLifeOSStore((s) => s.userSettings);

    const metrics = useMemo<WeeklyMetric[]>(() => {
        const today = getLocalDateKey();
        const overlay = { ...modifiedLogs, [dailyLog.date]: dailyLog };
        const mergedLast7 = getMergedLogs(dailyLogsLast7, overlay);
        const mergedLast28 = getMergedLogs(dailyLogsLast28, overlay);

        const thisWeekDates = getLastNDateStrings(7);
        const lastWeekDates = getLastNDateStrings(14).slice(0, 7);

        // Focus metrics
        const targetFocusHours = userSettings?.target_focus_hours ?? DEFAULT_TARGET_FOCUS_HOURS;
        let thisWeekFocus = 0;
        let lastWeekFocus = 0;

        thisWeekDates.forEach((dateStr) => {
            const log = mergedLast7.find((l) => l.date === dateStr);
            const minutes = dateStr === dailyLog.date ? dailyLog.focus_minutes : log?.focus_minutes ?? 0;
            thisWeekFocus += minutes;
        });

        lastWeekDates.forEach((dateStr) => {
            const log = mergedLast28.find((l) => l.date === dateStr);
            lastWeekFocus += log?.focus_minutes ?? 0;
        });

        const focusChange = lastWeekFocus > 0
            ? ((thisWeekFocus - lastWeekFocus) / lastWeekFocus) * 100
            : null;

        // Sleep metrics
        const targetSleepHours = userSettings?.target_sleep_hours ?? DEFAULT_TARGET_SLEEP_HOURS;
        let thisWeekSleep = 0;
        let lastWeekSleep = 0;
        let thisWeekSleepDays = 0;
        let lastWeekSleepDays = 0;

        thisWeekDates.forEach((dateStr) => {
            const log = mergedLast7.find((l) => l.date === dateStr);
            const hours = dateStr === dailyLog.date
                ? calculateDurationHours(dailyLog.sleep_start, dailyLog.sleep_end)
                : calculateDurationHours(log?.sleep_start ?? null, log?.sleep_end ?? null);
            if (hours > 0) {
                thisWeekSleep += hours;
                thisWeekSleepDays++;
            }
        });

        lastWeekDates.forEach((dateStr) => {
            const log = mergedLast28.find((l) => l.date === dateStr);
            const hours = calculateDurationHours(log?.sleep_start ?? null, log?.sleep_end ?? null);
            if (hours > 0) {
                lastWeekSleep += hours;
                lastWeekSleepDays++;
            }
        });

        const avgSleepThis = thisWeekSleepDays > 0 ? thisWeekSleep / thisWeekSleepDays : 0;
        const avgSleepLast = lastWeekSleepDays > 0 ? lastWeekSleep / lastWeekSleepDays : 0;
        const sleepChange = avgSleepLast > 0
            ? ((avgSleepThis - avgSleepLast) / avgSleepLast) * 100
            : null;

        // Pushups metrics
        const pushupGoal = userSettings?.pushup_goal ?? DEFAULT_PUSHUP_GOAL;
        let thisWeekPushups = 0;
        let lastWeekPushups = 0;

        thisWeekDates.forEach((dateStr) => {
            const log = mergedLast7.find((l) => l.date === dateStr);
            const count = dateStr === dailyLog.date ? dailyLog.pushup_count : log?.pushup_count ?? 0;
            thisWeekPushups += count;
        });

        lastWeekDates.forEach((dateStr) => {
            const log = mergedLast28.find((l) => l.date === dateStr);
            lastWeekPushups += log?.pushup_count ?? 0;
        });

        const pushupsChange = lastWeekPushups > 0
            ? ((thisWeekPushups - lastWeekPushups) / lastWeekPushups) * 100
            : null;

        // Habits metrics
        let thisWeekHabitsCompleted = 0;
        let thisWeekHabitsTotal = 0;
        let lastWeekHabitsCompleted = 0;
        let lastWeekHabitsTotal = 0;

        if (habitDefinitions.length > 0) {
            thisWeekDates.forEach((dateStr) => {
                const log = mergedLast7.find((l) => l.date === dateStr);
                const status = dateStr === dailyLog.date ? dailyLog.habits_status : log?.habits_status ?? {};
                habitDefinitions.forEach((h) => {
                    thisWeekHabitsTotal++;
                    if (status[h.id]) thisWeekHabitsCompleted++;
                });
            });

            lastWeekDates.forEach((dateStr) => {
                const log = mergedLast28.find((l) => l.date === dateStr);
                const status = log?.habits_status ?? {};
                habitDefinitions.forEach((h) => {
                    lastWeekHabitsTotal++;
                    if (status[h.id]) lastWeekHabitsCompleted++;
                });
            });
        }

        const habitRateThis = thisWeekHabitsTotal > 0 ? (thisWeekHabitsCompleted / thisWeekHabitsTotal) * 100 : 0;
        const habitRateLast = lastWeekHabitsTotal > 0 ? (lastWeekHabitsCompleted / lastWeekHabitsTotal) * 100 : 0;
        const habitsChange = habitRateLast > 0
            ? habitRateThis - habitRateLast
            : null;

        return [
            {
                label: "Focus",
                value: `${(thisWeekFocus / 60).toFixed(1)}h`,
                change: focusChange,
                icon: Target,
                color: "var(--color-focus)",
            },
            {
                label: "Sleep Avg",
                value: `${avgSleepThis.toFixed(1)}h`,
                change: sleepChange,
                icon: Moon,
                color: "var(--color-sleep)",
            },
            {
                label: "Pushups",
                value: thisWeekPushups.toString(),
                change: pushupsChange,
                icon: Dumbbell,
                color: "var(--color-pushup)",
            },
            {
                label: "Habits",
                value: `${habitRateThis.toFixed(0)}%`,
                change: habitsChange,
                icon: CheckCircle2,
                color: "var(--color-habit)",
            },
        ];
    }, [dailyLogsLast7, dailyLogsLast28, modifiedLogs, dailyLog, habitDefinitions, userSettings]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={cn("bento-tile p-4 flex gap-4 overflow-hidden", className)}
        >
            {/* Left Column: Header + Metrics */}
            <div className="w-[52%] flex flex-col gap-3 min-w-0 justify-center">
                <div className="flex items-center gap-2">
                    <BarChart3 className="size-5 text-primary" />
                    <h2 className="text-sm font-bold text-foreground">Weekly Overview</h2>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    {metrics.map((metric) => (
                        <div key={metric.label} className="flex flex-col justify-center p-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-1.5 mb-1">
                                <metric.icon className="size-3" style={{ color: metric.color }} />
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide truncate">
                                    {metric.label}
                                </span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <p className="text-xl font-bold tabular-nums tracking-tight leading-none" style={{ color: metric.color }}>
                                    {metric.value}
                                </p>
                                <TrendIndicator change={metric.change} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Column: Radar Chart (Maximized) */}
            <div className="w-[48%] h-full shrink-0 -my-2">
                <WellnessRadar minimal />
            </div>
        </motion.div>
    );
}
