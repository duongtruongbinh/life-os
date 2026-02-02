"use server";

import { getLogForDate } from "@/app/actions/daily-logs";
import { getDailyLogsLastNDays } from "@/app/actions/daily-logs";
import { getTasks } from "@/app/actions/tasks";
import { getHabitDefinitions } from "@/app/actions/habits";
import { getUserSettings } from "@/app/actions/user-settings";
import type { DailyLog, Task, HabitDefinition, UserSettings } from "@/types/database";

export type FullDashboardData = {
  dailyLog: DailyLog;
  tasks: Task[];
  habitDefinitions: HabitDefinition[];
  dailyLogsLast7: DailyLog[];
  dailyLogsLast28: DailyLog[];
  dailyLogsLast91: DailyLog[];
  dailyLogsLast180: DailyLog[];
  dailyLogsLast365: DailyLog[];
  userSettings: UserSettings | null;
};

const emptyDailyLog = (date: string): DailyLog => ({
  user_id: "",
  date,
  sleep_start: null,
  sleep_end: null,
  habits_status: {},
  pushup_count: 0,
  notes: null,
});

/**
 * Single server-side aggregation: fetches user, settings, habits, tasks,
 * today log, and last 7 days. Read-only; no INSERT/UPDATE.
 */
export async function fetchFullDashboardData(
  date?: string
): Promise<{
  data: FullDashboardData | null;
  error: string | null;
}> {
  const targetDate = date ?? new Date().toISOString().slice(0, 10);
  try {
    const [logRes, tasksRes, habitsRes, logs7Res, logs28Res, logs91Res, logs180Res, logs365Res, settingsRes] =
      await Promise.all([
        getLogForDate(targetDate),
        getTasks(),
        getHabitDefinitions(),
        getDailyLogsLastNDays(7),
        getDailyLogsLastNDays(28),
        getDailyLogsLastNDays(91),
        getDailyLogsLastNDays(180),
        getDailyLogsLastNDays(365),
        getUserSettings(),
      ]);

    if (logRes.error || tasksRes.error || habitsRes.error || logs7Res.error || logs28Res.error || logs91Res.error || logs180Res.error || logs365Res.error || settingsRes.error) {
      const err =
        logRes.error ?? tasksRes.error ?? habitsRes.error ?? logs7Res.error ?? logs28Res.error ?? logs91Res.error ?? logs180Res.error ?? logs365Res.error ?? settingsRes.error;
      return { data: null, error: err?.message ?? "Failed to load" };
    }

    const habitDefinitions = habitsRes.data ?? [];
    const dailyLog = logRes.data ?? emptyDailyLog(targetDate);

    const data: FullDashboardData = {
      dailyLog: { ...dailyLog, date: targetDate },
      tasks: tasksRes.data ?? [],
      habitDefinitions,
      dailyLogsLast7: logs7Res.data ?? [],
      dailyLogsLast28: logs28Res.data ?? [],
      dailyLogsLast91: logs91Res.data ?? [],
      dailyLogsLast180: logs180Res.data ?? [],
      dailyLogsLast365: logs365Res.data ?? [],
      userSettings: settingsRes.data ?? null,
    };

    return { data, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Failed to load",
    };
  }
}
