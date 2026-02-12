"use client";

import { useMemo } from "react";
import { format, parseISO, startOfWeek, endOfWeek } from "date-fns";
import { Timer, TrendingUp, Calendar, Flame } from "lucide-react";
import { useLifeOSStore } from "@/store/useLifeOSStore";
import { mergeLogs } from "@/lib/log-utils";
import { FocusDurationChart } from "@/components/focus/FocusDurationChart";
import { getLastNDateStrings, getLocalDateKey } from "@/lib/date-utils";
import { DEFAULT_TARGET_FOCUS_HOURS } from "@/lib/constants";

/** Stats card component */
function StatCard({
    icon: Icon,
    label,
    value,
    subValue,
    color,
}: {
    icon: React.ElementType;
    label: string;
    value: string;
    subValue?: string;
    color: string;
}) {
    return (
        <div className="stat-card flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="size-4" style={{ color }} />
                <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
            </div>
            <p className="text-2xl font-bold tabular-nums" style={{ color }}>
                {value}
            </p>
            {subValue && (
                <p className="text-xs text-muted-foreground">{subValue}</p>
            )}
        </div>
    );
}

/** Focus Analysis component with stats and duration chart */
export function FocusAnalysis() {
    const dailyLogsLast7 = useLifeOSStore((s) => s.dailyLogsLast7);
    const dailyLogsLast28 = useLifeOSStore((s) => s.dailyLogsLast28);
    const modifiedLogs = useLifeOSStore((s) => s.modifiedLogs);
    const dailyLog = useLifeOSStore((s) => s.dailyLog);
    const userSettings = useLifeOSStore((s) => s.userSettings);

    const targetHours = userSettings?.target_focus_hours ?? DEFAULT_TARGET_FOCUS_HOURS;

    const stats = useMemo(() => {
        // Merge local modifications with server logs
        const mergedLast7 = mergeLogs(dailyLogsLast7, { ...modifiedLogs, [dailyLog.date]: dailyLog });
        const mergedLast28 = mergeLogs(dailyLogsLast28, { ...modifiedLogs, [dailyLog.date]: dailyLog });

        // This week total
        const today = new Date();
        const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
        const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
        const thisWeekDates = getLastNDateStrings(7).filter((d) => {
            const date = parseISO(d);
            return date >= weekStart && date <= weekEnd;
        });

        let weekTotal = 0;
        thisWeekDates.forEach((dateStr) => {
            if (dateStr === dailyLog.date) {
                weekTotal += dailyLog.focus_minutes || 0;
            } else {
                const log = mergedLast7.find((l) => l.date === dateStr);
                weekTotal += log?.focus_minutes || 0;
            }
        });

        // Daily average (last 7 days)
        const last7Days = getLastNDateStrings(7);
        let totalMinutes7 = 0;
        let daysWithData7 = 0;
        last7Days.forEach((dateStr) => {
            const log = mergedLast7.find((l) => l.date === dateStr);
            const isToday = dateStr === dailyLog.date;
            const minutes = isToday ? (dailyLog.focus_minutes ?? 0) : (log?.focus_minutes ?? 0);
            if (minutes > 0) {
                totalMinutes7 += minutes;
                daysWithData7++;
            }
        });
        const dailyAvg = daysWithData7 > 0 ? totalMinutes7 / daysWithData7 : 0;

        // Best day this month
        const last28Days = getLastNDateStrings(28);
        let bestDay: { date: string; minutes: number } = { date: "", minutes: 0 };
        last28Days.forEach((dateStr) => {
            const log = mergedLast28.find((l) => l.date === dateStr);
            const isToday = dateStr === dailyLog.date;
            const minutes = isToday ? (dailyLog.focus_minutes ?? 0) : (log?.focus_minutes ?? 0);
            if (minutes > bestDay.minutes) {
                bestDay = { date: dateStr, minutes };
            }
        });

        // Current streak (consecutive days meeting goal)
        let streak = 0;
        const sortedDates = [...last28Days].reverse(); // Start from today
        for (const dateStr of sortedDates) {
            const log = mergedLast28.find((l) => l.date === dateStr);
            const isToday = dateStr === dailyLog.date;
            const minutes = isToday ? (dailyLog.focus_minutes ?? 0) : (log?.focus_minutes ?? 0);
            const hours = minutes / 60;
            if (hours >= targetHours) {
                streak++;
            } else if (dateStr !== getLocalDateKey()) {
                // Break streak if not today and didn't meet goal
                break;
            }
        }

        return {
            weekTotalHours: Math.round((weekTotal / 60) * 10) / 10,
            dailyAvgHours: Math.round((dailyAvg / 60) * 10) / 10,
            bestDayDate: bestDay.date ? format(parseISO(bestDay.date), "EEE, MMM d") : "-",
            bestDayHours: Math.round((bestDay.minutes / 60) * 10) / 10,
            streak,
        };
    }, [dailyLogsLast7, dailyLogsLast28, modifiedLogs, dailyLog, targetHours]);

    const focusColor = "var(--color-focus)";

    return (
        <div className="space-y-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
                <StatCard
                    icon={Timer}
                    label="This Week"
                    value={`${stats.weekTotalHours}h`}
                    subValue={`Goal: ${targetHours * 7}h`}
                    color={focusColor}
                />
                <StatCard
                    icon={TrendingUp}
                    label="Daily Avg"
                    value={`${stats.dailyAvgHours}h`}
                    subValue={`Goal: ${targetHours}h`}
                    color={focusColor}
                />
                <StatCard
                    icon={Calendar}
                    label="Best Day"
                    value={`${stats.bestDayHours}h`}
                    subValue={stats.bestDayDate}
                    color={focusColor}
                />
                <StatCard
                    icon={Flame}
                    label="Streak"
                    value={stats.streak.toString()}
                    subValue={stats.streak === 1 ? "day" : "days"}
                    color={focusColor}
                />
            </div>

            {/* Duration Chart */}
            <div className="bento-tile space-y-4">
                <h3 className="text-xl font-bold tracking-tight">Focus Duration</h3>
                <FocusDurationChart />
            </div>
        </div>
    );
}
