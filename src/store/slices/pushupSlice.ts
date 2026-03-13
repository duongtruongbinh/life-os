import type { StateCreator } from "zustand";
import type { LifeOSStore } from "../types";
import { getLocalDateKey, getLogicalDate } from "@/lib/date-utils";

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

export const createPushupSlice: StateCreator<
  LifeOSStore,
  [],
  [],
  Pick<LifeOSStore, "addPushupCount" | "setPushupCountForDate">
> = (set) => ({
  addPushupCount: (n: number) => {
    set((s) => {
      const calendarToday = getLocalDateKey();
      const effectiveDate = s.selectedDate === calendarToday
        ? getLogicalDate()
        : s.selectedDate;

      const baselog = effectiveDate === s.selectedDate
        ? s.dailyLog
        : (s.modifiedLogs[effectiveDate] ?? { ...emptyDailyLog(effectiveDate), date: effectiveDate });

      const next = { ...baselog, date: effectiveDate, pushup_count: (baselog.pushup_count ?? 0) + n };
      const updates: Partial<LifeOSStore> = {
        modifiedLogs: { ...s.modifiedLogs, [effectiveDate]: next },
        unsavedChanges: true,
      };
      if (effectiveDate === s.selectedDate) {
        updates.dailyLog = next;
      }
      return updates;
    });
  },

  setPushupCountForDate: (date: string, count: number) => {
    set((s) => {
      if (date === s.selectedDate) {
        const next = { ...s.dailyLog, pushup_count: count };
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
      const next = { ...emptyDailyLog(date), ...existing, pushup_count: count };
      return {
        modifiedLogs: { ...s.modifiedLogs, [date]: next },
        unsavedChanges: true,
      };
    });
  },
});
