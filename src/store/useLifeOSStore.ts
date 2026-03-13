"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LifeOSStore } from "./types";
import { emptyDailyLog } from "./slices/syncSlice";
import { createTaskSlice } from "./slices/taskSlice";
import { createHabitSlice } from "./slices/habitSlice";
import { createFocusSlice } from "./slices/focusSlice";
import { createSleepSlice } from "./slices/sleepSlice";
import { createPushupSlice } from "./slices/pushupSlice";
import { createSettingsSlice } from "./slices/settingsSlice";
import { createSyncSlice } from "./slices/syncSlice";

export const useLifeOSStore = create<LifeOSStore>()(
  persist(
    (set, get, api) => ({
      // Initial State
      isInitialized: false,
      selectedDate: "",
      dailyLog: emptyDailyLog(""),
      modifiedLogs: {},
      tasks: [],
      deletedTaskIds: [],
      habitDefinitions: [],
      deletedHabitIds: [],
      dailyLogsLast7: [],
      dailyLogsLast28: [],
      dailyLogsLast91: [],
      dailyLogsLast180: [],
      dailyLogsLast365: [],
      userSettings: null,
      unsavedChanges: false,
      loading: false,
      saving: false,
      error: null,
      _dateRequestId: 0,
      _initialLoadRequestId: 0,

      // Composed Slices
      ...createTaskSlice(set, get, api),
      ...createHabitSlice(set, get, api),
      ...createFocusSlice(set, get, api),
      ...createSleepSlice(set, get, api),
      ...createPushupSlice(set, get, api),
      ...createSettingsSlice(set, get, api),
      ...createSyncSlice(set, get, api),
    }),
    {
      name: "life-os-store",
      partialize: (s) => {
        // Exclude transient state from persistence
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { loading, saving, error, _dateRequestId, _initialLoadRequestId, ...rest } = s;
        return rest;
      },
      // Deduplicate habits on rehydrate
      onRehydrateStorage: () => (state) => {
        if (state && state.habitDefinitions.length > 0) {
          const seen = new Set<string>();
          const deduped = state.habitDefinitions.filter(h => {
             const key = h.name.toLowerCase();
             if (seen.has(key)) return false;
             seen.add(key);
             return true;
          });
          if (deduped.length !== state.habitDefinitions.length) {
            useLifeOSStore.setState({ habitDefinitions: deduped });
          }
        }
      },
    }
  )
);
