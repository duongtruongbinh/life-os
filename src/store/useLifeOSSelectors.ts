"use client";

import { useMemo } from "react";
import { useLifeOSStore } from "@/store/useLifeOSStore";
import { mergeLogs, buildLogMap } from "@/lib/log-utils";
import { calculateCurrentStreak } from "@/lib/streak-utils";
import { getLastNDateStrings, getLocalDateKey, calculateDurationHours } from "@/lib/date-utils";
import { DEFAULT_TARGET_FOCUS_HOURS, DEFAULT_TARGET_SLEEP_HOURS, DEFAULT_PUSHUP_GOAL } from "@/lib/constants";
import { isHabitDone } from "@/lib/habit-utils";

/**
 * These derive data from local store without additional network requests.
 * Use these instead of computing in components to prevent unnecessary re-renders.
 */

/** Check for any unclosed sleep session across the last 3 days (robust against long sleeps) */
export function useActiveSleepSession() {
    const dailyLogsLast7 = useLifeOSStore((s) => s.dailyLogsLast7);
    const modifiedLogs = useLifeOSStore((s) => s.modifiedLogs);
    const dailyLog = useLifeOSStore((s) => s.dailyLog);

    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    return useMemo(() => {
        const overlay = { ...modifiedLogs, [dailyLog.date]: dailyLog };
        const logMap = buildLogMap(mergeLogs(dailyLogsLast7, overlay));

        // Check the last 3 days for an open session
        const dates = getLastNDateStrings(3);

        // Search backwards from today
        for (let i = 2; i >= 0; i--) {
            const dateStr = dates[i];
            const log = logMap.get(dateStr);
            if (log?.sleep_start && !log?.sleep_end) {
                return { date: dateStr, log };
            }
        }
        return null;
    }, [dailyLogsLast7, modifiedLogs, dailyLog]);
}

/** Get total focus minutes for the current week (local data only) */
export function useWeeklyFocusTotal() {
    const dailyLogsLast7 = useLifeOSStore((s) => s.dailyLogsLast7);
    const modifiedLogs = useLifeOSStore((s) => s.modifiedLogs);
    const dailyLog = useLifeOSStore((s) => s.dailyLog);

    return useMemo(() => {
        const overlay = { ...modifiedLogs, [dailyLog.date]: dailyLog };
        const logMap = buildLogMap(mergeLogs(dailyLogsLast7, overlay));
        const thisWeekDates = getLastNDateStrings(7);

        let total = 0;
        for (const dateStr of thisWeekDates) {
            const log = logMap.get(dateStr);
            const isToday = dateStr === dailyLog.date;
            total += isToday ? (dailyLog.focus_minutes ?? 0) : (log?.focus_minutes ?? 0);
        }

        return total;
    }, [dailyLogsLast7, modifiedLogs, dailyLog]);
}

/** Get daily average focus hours for the last 7 days */
export function useDailyFocusAverage() {
    const weeklyTotal = useWeeklyFocusTotal();
    return useMemo(() => weeklyTotal / 60 / 7, [weeklyTotal]);
}

/** Get average sleep hours for the last 7 days */
export function useWeeklySleepAverage() {
    const dailyLogsLast7 = useLifeOSStore((s) => s.dailyLogsLast7);
    const modifiedLogs = useLifeOSStore((s) => s.modifiedLogs);
    const dailyLog = useLifeOSStore((s) => s.dailyLog);

    return useMemo(() => {
        const overlay = { ...modifiedLogs, [dailyLog.date]: dailyLog };
        const logMap = buildLogMap(mergeLogs(dailyLogsLast7, overlay));
        const thisWeekDates = getLastNDateStrings(7);

        let totalHours = 0;
        let daysWithData = 0;

        for (const dateStr of thisWeekDates) {
            const log = logMap.get(dateStr);
            const isToday = dateStr === dailyLog.date;
            const start = isToday ? dailyLog.sleep_start : log?.sleep_start;
            const end = isToday ? dailyLog.sleep_end : log?.sleep_end;
            const hours = calculateDurationHours(start ?? null, end ?? null);

            if (hours > 0) {
                totalHours += hours;
                daysWithData++;
            }
        }

        return daysWithData > 0 ? totalHours / daysWithData : 0;
    }, [dailyLogsLast7, modifiedLogs, dailyLog]);
}

/** Get weekly pushup total */
export function useWeeklyPushupTotal() {
    const dailyLogsLast7 = useLifeOSStore((s) => s.dailyLogsLast7);
    const modifiedLogs = useLifeOSStore((s) => s.modifiedLogs);
    const dailyLog = useLifeOSStore((s) => s.dailyLog);

    return useMemo(() => {
        const overlay = { ...modifiedLogs, [dailyLog.date]: dailyLog };
        const logMap = buildLogMap(mergeLogs(dailyLogsLast7, overlay));
        const thisWeekDates = getLastNDateStrings(7);

        let total = 0;
        for (const dateStr of thisWeekDates) {
            const log = logMap.get(dateStr);
            const isToday = dateStr === dailyLog.date;
            total += isToday ? (dailyLog.pushup_count ?? 0) : (log?.pushup_count ?? 0);
        }

        return total;
    }, [dailyLogsLast7, modifiedLogs, dailyLog]);
}

/** Get habit completion rate for the last 7 days */
export function useWeeklyHabitRate() {
    const dailyLogsLast7 = useLifeOSStore((s) => s.dailyLogsLast7);
    const modifiedLogs = useLifeOSStore((s) => s.modifiedLogs);
    const dailyLog = useLifeOSStore((s) => s.dailyLog);
    const habitDefinitions = useLifeOSStore((s) => s.habitDefinitions);

    return useMemo(() => {
        if (habitDefinitions.length === 0) return 0;

        const overlay = { ...modifiedLogs, [dailyLog.date]: dailyLog };
        const logMap = buildLogMap(mergeLogs(dailyLogsLast7, overlay));
        const thisWeekDates = getLastNDateStrings(7);

        let completed = 0;
        let total = 0;

        for (const dateStr of thisWeekDates) {
            const log = logMap.get(dateStr);
            const isToday = dateStr === dailyLog.date;
            const status = isToday ? dailyLog.habits_status : log?.habits_status;

            for (const h of habitDefinitions) {
                total++;
                if (isHabitDone(status, h.id)) completed++;
            }
        }

        return total > 0 ? (completed / total) * 100 : 0;
    }, [dailyLogsLast7, modifiedLogs, dailyLog, habitDefinitions]);
}

/** Get current streak for a specific habit */
export function useHabitStreak(habitId: string) {
    const dailyLogsLast365 = useLifeOSStore((s) => s.dailyLogsLast365);
    const modifiedLogs = useLifeOSStore((s) => s.modifiedLogs);
    const dailyLog = useLifeOSStore((s) => s.dailyLog);
    const todayKey = getLocalDateKey();

    return useMemo(() => {
        // Merge the most up-to-date active context on top of the historical data
        const overlay = { ...modifiedLogs, [dailyLog.date]: dailyLog };
        const combined = mergeLogs(dailyLogsLast365, overlay);
        return calculateCurrentStreak(habitId, combined, todayKey);
    }, [habitId, dailyLogsLast365, modifiedLogs, dailyLog, todayKey]);
}

/** Check if today's goals are met */
export function useTodayGoalStatus() {
    const dailyLog = useLifeOSStore((s) => s.dailyLog);
    const habitDefinitions = useLifeOSStore((s) => s.habitDefinitions);
    const userSettings = useLifeOSStore((s) => s.userSettings);

    return useMemo(() => {
        const targetFocus = userSettings?.target_focus_hours ?? DEFAULT_TARGET_FOCUS_HOURS;
        const targetSleep = userSettings?.target_sleep_hours ?? DEFAULT_TARGET_SLEEP_HOURS;
        const pushupGoal = userSettings?.pushup_goal ?? DEFAULT_PUSHUP_GOAL;

        const focusMet = ((dailyLog.focus_minutes ?? 0) / 60) >= targetFocus;
        const sleepMet = calculateDurationHours(dailyLog.sleep_start, dailyLog.sleep_end) >= targetSleep;
        const pushupsMet = (dailyLog.pushup_count ?? 0) >= pushupGoal;

        const habitsCompleted = habitDefinitions.filter(
            (h) => isHabitDone(dailyLog.habits_status, h.id)
        ).length;
        const habitsMet = habitDefinitions.length > 0 && habitsCompleted === habitDefinitions.length;

        return {
            focus: focusMet,
            sleep: sleepMet,
            pushups: pushupsMet,
            habits: habitsMet,
            allMet: focusMet && sleepMet && pushupsMet && habitsMet,
        };
    }, [dailyLog, habitDefinitions, userSettings]);
}

