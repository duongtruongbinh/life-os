import type { StateCreator } from "zustand";
import type { LifeOSStore } from "../types";

const emptyDailyLog = (date: string) => ({
  user_id: "",
  date,
  sleep_start: null,
  sleep_end: null,
  focus_start: null,
  focus_end: null,
  focus_minutes: 0,
  habits_status: {},
  pushup_count: 0,
  notes: null,
});

export const createSleepSlice: StateCreator<
  LifeOSStore,
  [],
  [],
  Pick<LifeOSStore, "setSleepStart" | "setSleepEnd" | "setSleepStartAt" | "setSleepEndAt">
> = (set) => ({
  setSleepStart: (date?: string) => {
    const now = new Date().toISOString();
    set((s) => {
      const targetDate = date || s.selectedDate;
      const existing = s.modifiedLogs[targetDate] ||
        (targetDate === s.dailyLog.date ? s.dailyLog : null) ||
        s.dailyLogsLast365.find(l => l.date === targetDate) ||
        emptyDailyLog(targetDate);

      const next = { ...existing, sleep_start: now };

      return {
        dailyLog: targetDate === s.selectedDate ? next : s.dailyLog,
        modifiedLogs: { ...s.modifiedLogs, [targetDate]: next },
        unsavedChanges: true,
      };
    });
  },

  setSleepEnd: (date?: string) => {
    const now = new Date().toISOString();
    set((s) => {
      const targetDate = date || s.selectedDate;
      const existing = s.modifiedLogs[targetDate] ||
        (targetDate === s.dailyLog.date ? s.dailyLog : null) ||
        s.dailyLogsLast365.find(l => l.date === targetDate) ||
        emptyDailyLog(targetDate);

      const next = { ...existing, sleep_end: now };

      return {
        dailyLog: targetDate === s.selectedDate ? next : s.dailyLog,
        modifiedLogs: { ...s.modifiedLogs, [targetDate]: next },
        unsavedChanges: true,
      };
    });
  },

  setSleepStartAt: (iso: string, date?: string) => {
    set((s) => {
      const targetDate = date || s.selectedDate;
      const existing = s.modifiedLogs[targetDate] ||
        (targetDate === s.dailyLog.date ? s.dailyLog : null) ||
        s.dailyLogsLast365.find(l => l.date === targetDate) ||
        emptyDailyLog(targetDate);

      const next = { ...existing, sleep_start: iso };
      return {
        dailyLog: targetDate === s.selectedDate ? next : s.dailyLog,
        modifiedLogs: { ...s.modifiedLogs, [targetDate]: next },
        unsavedChanges: true,
      };
    });
  },

  setSleepEndAt: (iso: string, date?: string) => {
    set((s) => {
      const targetDate = date || s.selectedDate;
      const existing = s.modifiedLogs[targetDate] ||
        (targetDate === s.dailyLog.date ? s.dailyLog : null) ||
        s.dailyLogsLast365.find(l => l.date === targetDate) ||
        emptyDailyLog(targetDate);

      const next = { ...existing, sleep_end: iso };
      return {
        dailyLog: targetDate === s.selectedDate ? next : s.dailyLog,
        modifiedLogs: { ...s.modifiedLogs, [targetDate]: next },
        unsavedChanges: true,
      };
    });
  },
});
