import type { StateCreator } from "zustand";
import type { LifeOSStore } from "../types";

export const DEFAULT_USER_SETTINGS = {
  user_id: "",
  pushup_goal: 50,
  target_sleep_hours: 8,
  target_focus_hours: 4,
  created_at: "",
};

export const createSettingsSlice: StateCreator<
  LifeOSStore,
  [],
  [],
  Pick<LifeOSStore, "updateUserSettings" | "setNotes">
> = (set) => ({
  setNotes: (notes: string | null) => {
    set((s) => {
      const next = { ...s.dailyLog, notes };
      return {
        dailyLog: next,
        modifiedLogs: { ...s.modifiedLogs, [s.selectedDate]: next },
        unsavedChanges: true,
      };
    });
  },

  updateUserSettings: (updates) => {
    set((s) => ({
      userSettings: s.userSettings
        ? { ...s.userSettings, ...updates }
        : { ...DEFAULT_USER_SETTINGS, ...updates },
      unsavedChanges: true,
    }));
  },
});
