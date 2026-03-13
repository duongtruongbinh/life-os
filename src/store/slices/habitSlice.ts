import type { StateCreator } from "zustand";
import type { LifeOSStore } from "../types";
import { isTempId } from "./taskSlice";
import { getLocalDateKey, getLogicalDate } from "@/lib/date-utils";
import type { HabitDefinition } from "@/types/database";

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

export const createHabitSlice: StateCreator<
  LifeOSStore,
  [],
  [],
  Pick<
    LifeOSStore,
    | "toggleHabit"
    | "addHabitDefinition"
    | "updateHabitDefinition"
    | "removeHabitDefinition"
  >
> = (set, get) => ({
  toggleHabit: (habitId: string) => {
    const prev = get();
    const calendarToday = getLocalDateKey();
    const effectiveDate = prev.selectedDate === calendarToday
      ? getLogicalDate()
      : prev.selectedDate;

    const baselog = effectiveDate === prev.selectedDate
      ? prev.dailyLog
      : (prev.modifiedLogs[effectiveDate] ?? { ...emptyDailyLog(effectiveDate), date: effectiveDate });

    const habitsStatusVal = baselog.habits_status as Record<string, boolean> | null;
    const current = habitsStatusVal?.[habitId] ?? false;
    const habits_status = { ...(habitsStatusVal ?? {}), [habitId]: !current };
    const next = { ...baselog, date: effectiveDate, habits_status };

    const updates: Partial<LifeOSStore> = {
      modifiedLogs: { ...prev.modifiedLogs, [effectiveDate]: next },
      unsavedChanges: true,
    };
    if (effectiveDate === prev.selectedDate) {
      updates.dailyLog = next as typeof next;
    }
    set(updates);
  },

  addHabitDefinition: (name: string, icon?: string | null, color?: string | null) => {
    const newHabit: HabitDefinition = {
      id: `temp-${crypto.randomUUID()}`,
      user_id: "",
      name,
      icon: icon ?? null,
      color: color ?? null,
      created_at: new Date().toISOString(),
    };
    set((s) => ({ habitDefinitions: [...s.habitDefinitions, newHabit], unsavedChanges: true }));
  },

  updateHabitDefinition: (
    id: string,
    updates: { name?: string; icon?: string | null; color?: string | null }
  ) => {
    set((s) => ({
      habitDefinitions: s.habitDefinitions.map((h) => (h.id === id ? { ...h, ...updates } : h)),
      unsavedChanges: true,
    }));
  },

  removeHabitDefinition: (id: string) => {
    set((s) => {
      const nextStatus = { ...(s.dailyLog.habits_status as Record<string, boolean> | null) };
      delete nextStatus[id];
      const next = { ...s.dailyLog, habits_status: nextStatus };
      return {
        habitDefinitions: s.habitDefinitions.filter((h) => h.id !== id),
        deletedHabitIds: isTempId(id) ? s.deletedHabitIds : [...s.deletedHabitIds, id],
        dailyLog: next,
        modifiedLogs: { ...s.modifiedLogs, [s.selectedDate]: next },
        unsavedChanges: true,
      };
    });
  },
});
