import type { StateCreator } from "zustand";
import type { LifeOSStore } from "../types";
import { getDailyLogsLastNDays, saveDailyLogsBulk, getLogForDate } from "@/app/actions/daily-logs";
import { syncTasks, type TaskInsert, type TaskUpdate } from "@/app/actions/tasks";
import { syncHabits, type HabitInsert, type HabitUpdate } from "@/app/actions/habits";
import { fetchFullDashboardData } from "@/app/actions/dashboard";
import { upsertUserSettings } from "@/app/actions/user-settings";
import { getLogicalDate } from "@/lib/date-utils";
import { isTempId } from "./taskSlice";
import type { DailyLog, HabitDefinition, TaskPriority } from "@/types/database";

const DEFAULT_HABITS: Omit<HabitDefinition, "user_id">[] = [
  { id: "", name: "Exercise", icon: "Dumbbell", color: null, created_at: "" },
  { id: "", name: "English", icon: "Languages", color: null, created_at: "" },
];

function dedupeHabits(habits: HabitDefinition[]): HabitDefinition[] {
  const seen = new Map<string, HabitDefinition>();
  for (const h of habits) {
    const key = h.name.toLowerCase();
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, h);
    } else if (isTempId(existing.id) && !isTempId(h.id)) {
      seen.set(key, h);
    }
  }
  return Array.from(seen.values());
}

export const emptyDailyLog = (date: string): DailyLog => ({
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

const todayKey = () => (typeof window !== "undefined" ? getLogicalDate() : "");

export const createSyncSlice: StateCreator<
  LifeOSStore,
  [],
  [],
  Pick<LifeOSStore, "loadInitialData" | "setSelectedDate" | "saveData" | "setError">
> = (set, get) => ({
  setError: (error: string | null) => set({ error }),

  setSelectedDate: (date: string) => {
    const prev = get();
    const requestId = Date.now();
    set({ selectedDate: date, _dateRequestId: requestId });

    if (!prev.isInitialized || date === prev.dailyLog.date) return;

    const modified = prev.modifiedLogs[date];
    if (modified) {
      set({ dailyLog: { ...modified, date } });
      return;
    }

    const findIn = (arr: DailyLog[]) => arr.find((l) => l.date === date);
    const cached =
      findIn(prev.dailyLogsLast365) ??
      findIn(prev.dailyLogsLast91) ??
      findIn(prev.dailyLogsLast28) ??
      findIn(prev.dailyLogsLast7);

    if (cached) {
      set({ dailyLog: { ...cached, date } });
      return;
    }

    getLogForDate(date).then(({ data, error }) => {
      if (get()._dateRequestId !== requestId) return;
      if (error) return;
      set({ dailyLog: data ?? emptyDailyLog(date) });
    });
  },

  loadInitialData: async () => {
    const prevState = get();
    let { selectedDate } = prevState;
    if (!selectedDate) {
      selectedDate = todayKey();
      set({ selectedDate, dailyLog: emptyDailyLog(selectedDate) });
    }

    if (prevState.loading) return;

    const requestId = Date.now();
    set({ loading: true, error: null, _initialLoadRequestId: requestId });

    try {
      const { data, error } = await fetchFullDashboardData(selectedDate);
      if (get()._initialLoadRequestId !== requestId) return;

      const currentState = get();
      const hasUnsavedChanges = currentState.unsavedChanges && currentState.isInitialized;
      const serverHabits = dedupeHabits(data?.habitDefinitions ?? []);
      let finalHabitDefinitions: HabitDefinition[];

      if (serverHabits.length > 0) {
        if (hasUnsavedChanges) {
          const serverNames = new Set(serverHabits.map((h) => h.name.toLowerCase()));
          const localTempHabits = currentState.habitDefinitions.filter(
            (h) => isTempId(h.id) && !serverNames.has(h.name.toLowerCase())
          );
          finalHabitDefinitions = dedupeHabits([...serverHabits, ...localTempHabits]);
        } else {
          finalHabitDefinitions = serverHabits;
        }
      } else if (currentState.isInitialized && currentState.habitDefinitions.length > 0) {
        finalHabitDefinitions = dedupeHabits(currentState.habitDefinitions);
      } else {
        finalHabitDefinitions = DEFAULT_HABITS.map((h) => ({
          ...h,
          id: `temp-${crypto.randomUUID()}`,
          user_id: "",
          created_at: new Date().toISOString(),
        }));
      }

      const userSettings = data?.userSettings ?? null;
      const needsDefaults = finalHabitDefinitions.some((h) => isTempId(h.id)) || !data?.userSettings;

      const serverDailyLog = data?.dailyLog ?? emptyDailyLog(selectedDate);
      const localModifiedLog = currentState.modifiedLogs[selectedDate];
      let finalDailyLog = hasUnsavedChanges && localModifiedLog ? localModifiedLog : serverDailyLog;

      if (currentState.selectedDate !== selectedDate) {
        finalDailyLog = currentState.dailyLog;
      }

      let finalTasks = data?.tasks ?? [];
      if (hasUnsavedChanges) {
        const localTempTasks = currentState.tasks.filter((t) => isTempId(t.id));
        finalTasks = [...finalTasks, ...localTempTasks];
      }

      set({
        dailyLog: finalDailyLog,
        tasks: finalTasks,
        deletedTaskIds: hasUnsavedChanges ? currentState.deletedTaskIds : [],
        habitDefinitions: finalHabitDefinitions,
        deletedHabitIds: hasUnsavedChanges ? currentState.deletedHabitIds : [],
        dailyLogsLast7: data?.dailyLogsLast7 ?? [],
        dailyLogsLast28: data?.dailyLogsLast28 ?? [],
        dailyLogsLast91: data?.dailyLogsLast91 ?? [],
        dailyLogsLast180: data?.dailyLogsLast180 ?? [],
        dailyLogsLast365: data?.dailyLogsLast365 ?? [],
        userSettings,
        unsavedChanges: hasUnsavedChanges || needsDefaults,
        modifiedLogs: hasUnsavedChanges ? currentState.modifiedLogs : {},
        loading: false,
        isInitialized: true,
        error: error ?? null,
      });
    } catch (e) {
      set({ loading: false, isInitialized: true, error: e instanceof Error ? e.message : "Failed to load" });
    }
  },

  saveData: async () => {
    const state = get();
    if (state.saving) return false;

    const { modifiedLogs, tasks, deletedTaskIds, habitDefinitions, deletedHabitIds } = state;
    const modifiedLogKeys = Object.keys(modifiedLogs);

    set({ saving: true, error: null });

    try {
      const habitToInsert: HabitInsert[] = [];
      const habitToUpdate: HabitUpdate[] = [];
      const habitTempOrder: string[] = [];

      for (const h of habitDefinitions) {
        if (isTempId(h.id)) {
          habitTempOrder.push(h.id);
          habitToInsert.push({ name: h.name, icon: h.icon, color: h.color });
        } else if (!deletedHabitIds.includes(h.id)) {
          habitToUpdate.push({ id: h.id, name: h.name, icon: h.icon, color: h.color });
        }
      }

      const { inserted: habitInserted, error: habitsError } = await syncHabits(deletedHabitIds, habitToInsert, habitToUpdate);
      if (habitsError) {
        set({ saving: false, error: habitsError.message });
        return false;
      }

      const habitIdMap: Record<string, string> = {};
      habitTempOrder.forEach((tempId, i) => {
        if (habitInserted[i]) habitIdMap[tempId] = habitInserted[i].id;
      });

      const remapHabits = (status: Record<string, boolean>) => {
        const out: Record<string, boolean> = {};
        for (const [k, v] of Object.entries(status)) {
          const realId = habitIdMap[k] ?? k;
          if (!deletedHabitIds.includes(realId)) out[realId] = v;
        }
        return out;
      };

      const bulkEntries = Object.entries(modifiedLogs).map(([date, log]) => ({
        date,
        log: {
          sleep_start: log.sleep_start,
          sleep_end: log.sleep_end,
          habits_status: remapHabits((log.habits_status as Record<string, boolean>) ?? {}),
          pushup_count: log.pushup_count ?? 0,
          notes: log.notes,
          focus_start: log.focus_start,
          focus_end: log.focus_end,
          focus_minutes: log.focus_minutes ?? 0,
        },
      }));

      const { error: logsError } = await saveDailyLogsBulk(bulkEntries);
      if (logsError) {
        set({ saving: false, error: `Logs save failed: ${logsError.message}` });
        return false;
      }

      const toInsert: TaskInsert[] = [];
      const toUpdate: TaskUpdate[] = [];
      const tempOrder: string[] = [];

      for (const t of tasks) {
        if (isTempId(t.id)) {
          tempOrder.push(t.id);
          toInsert.push({
            title: t.title,
            is_completed: t.is_completed ?? false,
            priority: t.priority as TaskPriority | null,
            due_date: t.due_date,
            created_at: t.created_at ?? new Date().toISOString(),
            completed_at: t.completed_at ?? null,
          });
        } else if (!deletedTaskIds.includes(t.id)) {
          toUpdate.push({
            id: t.id,
            title: t.title,
            is_completed: t.is_completed ?? false,
            priority: t.priority as TaskPriority | null,
            due_date: t.due_date,
            completed_at: t.completed_at ?? null,
          });
        }
      }

      const { inserted, error: tasksError } = await syncTasks(deletedTaskIds, toInsert, toUpdate);
      if (tasksError) {
        set({ saving: false, error: tasksError.message });
        return false;
      }

      const { userSettings } = get();
      if (userSettings) {
        const { error: settingsError } = await upsertUserSettings({
          pushup_goal: userSettings.pushup_goal ?? 50,
          target_sleep_hours: userSettings.target_sleep_hours ?? 8,
          target_focus_hours: userSettings.target_focus_hours ?? 9,
        });
        if (settingsError) {
          set({ saving: false, error: settingsError.message });
          return false;
        }
      }

      let allLogs = [];
      try {
        const logs365Res = await getDailyLogsLastNDays(365, todayKey());
        if (logs365Res.error) throw new Error(`Refresh failed: ${logs365Res.error.message}`);
        allLogs = [...(logs365Res.data ?? [])].sort((a, b) => a.date.localeCompare(b.date));
      } catch (refreshErr: unknown) {
        const msg = refreshErr instanceof Error ? refreshErr.message : String(refreshErr);
        set({ saving: false, error: `Saved, but sync failed: ${msg}` });
        return false;
      }

      set((s) => {
        const nextTasks = s.tasks.map((t) => {
          if (!isTempId(t.id)) return t;
          const idx = tempOrder.indexOf(t.id);
          if (idx < 0 || !inserted[idx]) return t;
          return { ...t, id: inserted[idx].id, user_id: inserted[idx].user_id };
        });

        const nextHabits = s.habitDefinitions.map((h) => {
          if (!isTempId(h.id)) return h;
          const idx = habitTempOrder.indexOf(h.id);
          if (idx < 0 || !habitInserted[idx]) return h;
          return { ...h, id: habitInserted[idx].id, user_id: habitInserted[idx].user_id };
        });

        const remainingModified: Record<string, DailyLog> = {};
        for (const [date, log] of Object.entries(s.modifiedLogs)) {
          if (!modifiedLogKeys.includes(date)) remainingModified[date] = log;
        }

        return {
          tasks: nextTasks,
          habitDefinitions: nextHabits,
          deletedTaskIds: [],
          deletedHabitIds: [],
          dailyLogsLast7: allLogs.slice(-7),
          dailyLogsLast28: allLogs.slice(-28),
          dailyLogsLast91: allLogs.slice(-91),
          dailyLogsLast180: allLogs.slice(-180),
          dailyLogsLast365: allLogs,
          modifiedLogs: remainingModified,
          unsavedChanges: Object.keys(remainingModified).length > 0,
          saving: false,
        };
      });

      return true;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      set({ saving: false, error: msg || "Save failed (Unknown error)" });
      return false;
    }
  },
});
