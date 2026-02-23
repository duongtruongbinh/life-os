/**
 * Pure computation utilities for dashboard analytics.
 * Separated from UI components for testability and cleaner components.
 */

import type { DailyLog, HabitDefinition } from "@/types/database";
import { mergeLogs, buildLogMap } from "@/lib/log-utils";
import { getLastNDateStrings, calculateDurationHours } from "@/lib/date-utils";

/** Shape returned by calculateWeeklyMetrics (icon/color added by the component). */
export interface WeeklyMetricData {
    label: string;
    value: string;
    change: number | null; // percentage change from last week
}

/**
 * Calculate weekly overview metrics: Focus, Sleep, Pushups, Habits.
 * Each metric includes a value string and week-over-week percentage change.
 */
export function calculateWeeklyMetrics(input: {
    dailyLogsLast7: DailyLog[];
    dailyLogsLast28: DailyLog[];
    modifiedLogs: Record<string, DailyLog>;
    dailyLog: DailyLog;
    habitDefinitions: HabitDefinition[];
}): WeeklyMetricData[] {
    const { dailyLogsLast7, dailyLogsLast28, modifiedLogs, dailyLog, habitDefinitions } = input;

    const overlay = { ...modifiedLogs, [dailyLog.date]: dailyLog };
    const mapLast7 = buildLogMap(mergeLogs(dailyLogsLast7, overlay));
    const mapLast28 = buildLogMap(mergeLogs(dailyLogsLast28, overlay));

    const thisWeekDates = getLastNDateStrings(7);
    const lastWeekDates = getLastNDateStrings(14).slice(0, 7);

    // ── Focus ─────────────────────────────────────────────────────────────
    let thisWeekFocus = 0;
    let lastWeekFocus = 0;

    // ── Single Pass Over Dates ────────────────────────────────────────────

    let thisWeekSleep = 0;
    let lastWeekSleep = 0;
    let thisWeekSleepDays = 0;
    let lastWeekSleepDays = 0;

    let thisWeekPushups = 0;
    let lastWeekPushups = 0;

    let thisWeekHabitsCompleted = 0;
    let thisWeekHabitsTotal = 0;
    let lastWeekHabitsCompleted = 0;
    let lastWeekHabitsTotal = 0;

    for (const dateStr of thisWeekDates) {
        const log = mapLast7.get(dateStr);
        const isToday = dateStr === dailyLog.date;

        // Focus
        const minutes = isToday ? (dailyLog.focus_minutes ?? 0) : (log?.focus_minutes ?? 0);
        thisWeekFocus += minutes;

        // Sleep
        const hours = isToday
            ? calculateDurationHours(dailyLog.sleep_start, dailyLog.sleep_end)
            : calculateDurationHours(log?.sleep_start ?? null, log?.sleep_end ?? null);
        if (hours > 0) {
            thisWeekSleep += hours;
            thisWeekSleepDays++;
        }

        // Pushups
        const count = isToday ? (dailyLog.pushup_count ?? 0) : (log?.pushup_count ?? 0);
        thisWeekPushups += count;

        // Habits
        if (habitDefinitions.length > 0) {
            const status = isToday ? (dailyLog.habits_status ?? {}) : (log?.habits_status ?? {});
            thisWeekHabitsTotal += habitDefinitions.length;
            for (const h of habitDefinitions) {
                if (status[h.id]) thisWeekHabitsCompleted++;
            }
        }
    }

    for (const dateStr of lastWeekDates) {
        const log = mapLast28.get(dateStr);

        // Focus
        lastWeekFocus += log?.focus_minutes ?? 0;

        // Sleep
        const hours = calculateDurationHours(log?.sleep_start ?? null, log?.sleep_end ?? null);
        if (hours > 0) {
            lastWeekSleep += hours;
            lastWeekSleepDays++;
        }

        // Pushups
        lastWeekPushups += log?.pushup_count ?? 0;

        // Habits
        if (habitDefinitions.length > 0) {
            const status = log?.habits_status ?? {};
            lastWeekHabitsTotal += habitDefinitions.length;
            for (const h of habitDefinitions) {
                if (status[h.id]) lastWeekHabitsCompleted++;
            }
        }
    }

    const focusChange = lastWeekFocus > 0
        ? ((thisWeekFocus - lastWeekFocus) / lastWeekFocus) * 100
        : null;

    const avgSleepThis = thisWeekSleepDays > 0 ? thisWeekSleep / thisWeekSleepDays : 0;
    const avgSleepLast = lastWeekSleepDays > 0 ? lastWeekSleep / lastWeekSleepDays : 0;
    const sleepChange = avgSleepLast > 0
        ? ((avgSleepThis - avgSleepLast) / avgSleepLast) * 100
        : null;

    const pushupsChange = lastWeekPushups > 0
        ? ((thisWeekPushups - lastWeekPushups) / lastWeekPushups) * 100
        : null;

    const habitRateThis = thisWeekHabitsTotal > 0 ? (thisWeekHabitsCompleted / thisWeekHabitsTotal) * 100 : 0;
    const habitRateLast = lastWeekHabitsTotal > 0 ? (lastWeekHabitsCompleted / lastWeekHabitsTotal) * 100 : 0;
    const habitsChange = habitRateLast > 0
        ? habitRateThis - habitRateLast
        : null;

    // ── Result ────────────────────────────────────────────────────────────
    return [
        { label: "Focus", value: `${(thisWeekFocus / 60).toFixed(1)}h`, change: focusChange },
        { label: "Sleep Avg", value: `${avgSleepThis.toFixed(1)}h`, change: sleepChange },
        { label: "Pushups", value: thisWeekPushups.toString(), change: pushupsChange },
        { label: "Habits", value: `${habitRateThis.toFixed(0)}%`, change: habitsChange },
    ];
}

