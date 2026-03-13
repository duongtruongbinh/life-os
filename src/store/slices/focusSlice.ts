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

export const createFocusSlice: StateCreator<
  LifeOSStore,
  [],
  [],
  Pick<LifeOSStore, "setFocusStart" | "setFocusEnd" | "addFocusMinutes" | "setFocusMinutesForDate">
> = (set) => ({
  setFocusStart: () => {
    const now = new Date().toISOString();
    set((s) => {
      const next = { ...s.dailyLog, focus_start: now };
      return {
        dailyLog: next,
        modifiedLogs: { ...s.modifiedLogs, [s.selectedDate]: next },
        unsavedChanges: true,
      };
    });
  },

  setFocusEnd: () => {
    const now = new Date();
    set((s) => {
      let minutes = 0;
      if (s.dailyLog.focus_start) {
        const start = new Date(s.dailyLog.focus_start);
        const diffMs = now.getTime() - start.getTime();
        minutes = Math.floor(diffMs / 60000);
      }

      const next = {
        ...s.dailyLog,
        focus_start: null,
        focus_end: null,
        focus_minutes: (s.dailyLog.focus_minutes || 0) + minutes
      };
      return {
        dailyLog: next,
        modifiedLogs: { ...s.modifiedLogs, [s.selectedDate]: next },
        unsavedChanges: true,
      };
    });
  },

  addFocusMinutes: (n: number) => {
    set((s) => {
      const next = { ...s.dailyLog, focus_minutes: Math.max(0, (s.dailyLog.focus_minutes || 0) + n) };
      return {
        dailyLog: next,
        modifiedLogs: { ...s.modifiedLogs, [s.selectedDate]: next },
        unsavedChanges: true,
      };
    });
  },

  setFocusMinutesForDate: (date: string, minutes: number) => {
    set((s) => {
      if (date === s.selectedDate) {
        const next = { ...s.dailyLog, focus_minutes: minutes };
        return {
          dailyLog: next,
          modifiedLogs: { ...s.modifiedLogs, [date]: next },
          unsavedChanges: true,
        };
      }
      const existing = s.modifiedLogs[date] ||
        s.dailyLogsLast365.find(l => l.date === date) ||
        s.dailyLogsLast28.find(l => l.date === date) ||
        s.dailyLogsLast7.find(l => l.date === date);
      const next = { ...emptyDailyLog(date), ...existing, focus_minutes: minutes };
      return {
        modifiedLogs: { ...s.modifiedLogs, [date]: next },
        unsavedChanges: true,
      };
    });
  },
});
