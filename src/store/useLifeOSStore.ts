"use client";

/**
 * Local-first store: mutations update local state and modifiedLogs; saveData() bulk-upserts logs and syncs tasks/habits/settings.
 * Persisted to localStorage so data survives reload. No navigation guards.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DailyLog, Task, HabitDefinition, UserSettings } from "@/types/database";
import { getDailyLogsLastNDays, saveDailyLogsBulk, getLogForDate } from "@/app/actions/daily-logs";
import { syncTasks } from "@/app/actions/tasks";
import type { TaskInsert, TaskUpdate } from "@/app/actions/tasks";
import { syncHabits } from "@/app/actions/habits";
import type { HabitInsert, HabitUpdate } from "@/app/actions/habits";
import { fetchFullDashboardData } from "@/app/actions/dashboard";
import { upsertUserSettings } from "@/app/actions/user-settings";
import type { TaskPriority } from "@/types/database";
import { getLocalDateKey } from "@/lib/date-utils";

const TEMP_PREFIX = "temp-";
const isTempId = (id: string) => id.startsWith(TEMP_PREFIX);

/**
 * Merged view for visualizations: overlay local drafts (`modifiedLogs`) onto server logs.
 * - If a date exists in `modifiedLogs`, the modified version wins.
 * - Dates that exist only locally are included as well.
 */
export function getMergedLogs(
  serverLogs: DailyLog[],
  modifiedLogs: Record<string, DailyLog>
): DailyLog[] {
  const byDate = new Map<string, DailyLog>();
  for (const l of serverLogs) byDate.set(l.date, l);
  for (const [date, l] of Object.entries(modifiedLogs)) byDate.set(date, l);
  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

const DEFAULT_USER_SETTINGS: UserSettings = {
  user_id: "",
  pushup_goal: 50,
  target_sleep_hours: 8,
  created_at: "",
};

const DEFAULT_HABITS: Omit<HabitDefinition, "user_id">[] = [
  { id: "", name: "Exercise", icon: "Dumbbell", color: null, created_at: "" },
  { id: "", name: "English", icon: "Languages", color: null, created_at: "" },
];

/**
 * Deduplicate habits by name (case-insensitive).
 * Prefers real IDs over temp IDs, and earlier created_at over later.
 */
function dedupeHabits(habits: HabitDefinition[]): HabitDefinition[] {
  const seen = new Map<string, HabitDefinition>();
  for (const h of habits) {
    const key = h.name.toLowerCase();
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, h);
    } else if (isTempId(existing.id) && !isTempId(h.id)) {
      // Prefer real ID over temp ID
      seen.set(key, h);
    }
    // else: keep existing (first occurrence with real ID)
  }
  return Array.from(seen.values());
}

const emptyDailyLog = (date: string): DailyLog => ({
  user_id: "",
  date,
  sleep_start: null,
  sleep_end: null,
  habits_status: {},
  pushup_count: 0,
  notes: null,
});

type LifeOSState = {
  isInitialized: boolean;
  selectedDate: string;
  dailyLog: DailyLog;
  modifiedLogs: Record<string, DailyLog>;
  tasks: Task[];
  deletedTaskIds: string[];
  habitDefinitions: HabitDefinition[];
  deletedHabitIds: string[];
  dailyLogsLast7: DailyLog[];
  dailyLogsLast28: DailyLog[];
  dailyLogsLast91: DailyLog[];
  dailyLogsLast180: DailyLog[];
  dailyLogsLast365: DailyLog[];
  userSettings: UserSettings | null;
  unsavedChanges: boolean;
  loading: boolean;
  error: string | null;
};

type LifeOSActions = {
  loadInitialData: () => Promise<void>;
  setSelectedDate: (date: string) => void;
  setSleepStart: () => void;
  setSleepEnd: () => void;
  setSleepStartAt: (iso: string) => void;
  setSleepEndAt: (iso: string) => void;
  toggleHabit: (habitId: string) => void;
  addPushupCount: (n: number) => void;
  setNotes: (notes: string | null) => void;
  saveData: () => Promise<boolean>;
  addTask: (title: string, priority: TaskPriority | null) => void;
  updateTaskPriority: (id: string, priority: TaskPriority) => void;
  updateTaskTitle: (id: string, newTitle: string) => void;
  toggleTaskCompletion: (id: string, isCompleted: boolean) => void;
  removeTask: (id: string) => void;
  addHabitDefinition: (name: string, icon?: string | null, color?: string | null) => void;
  updateHabitDefinition: (
    id: string,
    updates: { name?: string; icon?: string | null; color?: string | null }
  ) => void;
  removeHabitDefinition: (id: string) => void;
  updateUserSettings: (updates: {
    pushup_goal?: number;
    target_sleep_hours?: number;
  }) => void;
  setError: (error: string | null) => void;
};

const todayKey = () => (typeof window !== "undefined" ? getLocalDateKey() : "");

export const useLifeOSStore = create<LifeOSState & LifeOSActions>()(
  persist(
    (set, get) => ({
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
      error: null,

      setSelectedDate: (date: string) => {
        const prev = get();
        set({ selectedDate: date });
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
          if (error) return;
          set((s) => ({
            dailyLog: data ?? emptyDailyLog(date),
          }));
        });
      },

      loadInitialData: async () => {
        // Always fetch fresh data from server, but preserve local unsaved changes
        const prevState = get();
        let { selectedDate } = prevState;
        if (!selectedDate) {
          selectedDate = todayKey();
          set({ selectedDate, dailyLog: emptyDailyLog(selectedDate) });
        }

        // If already loading, don't start another request
        if (prevState.loading) return;

        set({ loading: true, error: null });
        try {
          const { data, error } = await fetchFullDashboardData(selectedDate);

          const currentState = get();
          const hasUnsavedChanges = currentState.unsavedChanges && currentState.isInitialized;

          // Deduplicate server habits first (in case DB has duplicates)
          const serverHabits = dedupeHabits(data?.habitDefinitions ?? []);

          // Habit logic: Server habits take priority, only add temp habits that don't exist on server
          let finalHabitDefinitions: HabitDefinition[];
          if (serverHabits.length > 0) {
            // Server has habits - use them as base
            if (hasUnsavedChanges) {
              // Add only local temp habits that weren't saved yet (by name dedup)
              const serverNames = new Set(serverHabits.map(h => h.name.toLowerCase()));
              const localTempHabits = currentState.habitDefinitions.filter(
                h => isTempId(h.id) && !serverNames.has(h.name.toLowerCase())
              );
              finalHabitDefinitions = dedupeHabits([...serverHabits, ...localTempHabits]);
            } else {
              finalHabitDefinitions = serverHabits;
            }
          } else if (currentState.isInitialized && currentState.habitDefinitions.length > 0) {
            // Server empty but we have local habits (temp or cached) - keep local, dedupe
            finalHabitDefinitions = dedupeHabits(currentState.habitDefinitions);
          } else {
            // First time load with no server data - create defaults
            finalHabitDefinitions = DEFAULT_HABITS.map((h) => ({
              ...h,
              id: `${TEMP_PREFIX}${crypto.randomUUID()}`,
              user_id: "",
              created_at: new Date().toISOString(),
            }));
          }

          const userSettings = data?.userSettings ?? DEFAULT_USER_SETTINGS;
          const needsDefaults = finalHabitDefinitions.some(h => isTempId(h.id)) || !data?.userSettings;

          // For dailyLog: if we have unsaved local changes for this date, keep them
          const serverDailyLog = data?.dailyLog ?? emptyDailyLog(selectedDate);
          const localModifiedLog = currentState.modifiedLogs[selectedDate];
          const finalDailyLog = hasUnsavedChanges && localModifiedLog
            ? localModifiedLog
            : serverDailyLog;

          // For tasks: if unsaved, merge local temp tasks with server tasks
          let finalTasks = data?.tasks ?? [];
          if (hasUnsavedChanges) {
            // Keep local temp tasks (not yet saved to server)
            const localTempTasks = currentState.tasks.filter(t => isTempId(t.id));
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
          set({
            loading: false,
            isInitialized: true,
            error: e instanceof Error ? e.message : "Failed to load",
          });
        }
      },

      setSleepStart: () => {
        const now = new Date().toISOString();
        set((s) => {
          const next = { ...s.dailyLog, sleep_start: now };
          const mod = { ...s.modifiedLogs, [s.selectedDate]: next };
          return { dailyLog: next, modifiedLogs: mod, unsavedChanges: true };
        });
      },

      setSleepEnd: () => {
        const now = new Date().toISOString();
        set((s) => {
          const next = { ...s.dailyLog, sleep_end: now };
          const mod = { ...s.modifiedLogs, [s.selectedDate]: next };
          return { dailyLog: next, modifiedLogs: mod, unsavedChanges: true };
        });
      },

      setSleepStartAt: (iso: string) => {
        set((s) => {
          const next = { ...s.dailyLog, sleep_start: iso };
          const mod = { ...s.modifiedLogs, [s.selectedDate]: next };
          return { dailyLog: next, modifiedLogs: mod, unsavedChanges: true };
        });
      },

      setSleepEndAt: (iso: string) => {
        set((s) => {
          const next = { ...s.dailyLog, sleep_end: iso };
          const mod = { ...s.modifiedLogs, [s.selectedDate]: next };
          return { dailyLog: next, modifiedLogs: mod, unsavedChanges: true };
        });
      },

      toggleHabit: (habitId: string) => {
        set((s) => {
          const current = s.dailyLog.habits_status[habitId] ?? false;
          const habits_status = { ...s.dailyLog.habits_status, [habitId]: !current };
          const next = { ...s.dailyLog, habits_status };
          const mod = { ...s.modifiedLogs, [s.selectedDate]: next };
          return { dailyLog: next, modifiedLogs: mod, unsavedChanges: true };
        });
      },

      addPushupCount: (n: number) => {
        set((s) => {
          const newCount = s.dailyLog.pushup_count + n;
          const next = { ...s.dailyLog, pushup_count: newCount };
          const mod = { ...s.modifiedLogs, [s.selectedDate]: next };
          return { dailyLog: next, modifiedLogs: mod, unsavedChanges: true };
        });
      },

      setNotes: (notes: string | null) => {
        set((s) => {
          const next = { ...s.dailyLog, notes };
          const mod = { ...s.modifiedLogs, [s.selectedDate]: next };
          return { dailyLog: next, modifiedLogs: mod, unsavedChanges: true };
        });
      },

      saveData: async () => {
        const {
          modifiedLogs,
          tasks,
          deletedTaskIds,
          habitDefinitions,
          deletedHabitIds,
        } = get();
        const modifiedLogKeys = Object.keys(modifiedLogs);
        set({ loading: true, error: null });
        try {
          const habitToInsert: HabitInsert[] = [];
          const habitToUpdate: HabitUpdate[] = [];
          const habitTempOrder: string[] = [];
          for (const h of habitDefinitions) {
            if (isTempId(h.id)) {
              habitTempOrder.push(h.id);
              habitToInsert.push({ name: h.name, icon: h.icon, color: h.color });
            } else if (!deletedHabitIds.includes(h.id)) {
              habitToUpdate.push({
                id: h.id,
                name: h.name,
                icon: h.icon,
                color: h.color,
              });
            }
          }

          const { inserted: habitInserted, error: habitsError } = await syncHabits(
            deletedHabitIds,
            habitToInsert,
            habitToUpdate
          );
          if (habitsError) {
            set({ loading: false, error: habitsError.message });
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
              habits_status: remapHabits(log.habits_status),
              pushup_count: log.pushup_count,
              notes: log.notes,
            },
          }));
          const { error: logsError } = await saveDailyLogsBulk(bulkEntries);
          if (logsError) {
            set({ loading: false, error: logsError.message });
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
                is_completed: t.is_completed,
                priority: t.priority,
                due_date: t.due_date,
                created_at: t.created_at,
                completed_at: t.completed_at ?? null,
              });
            } else if (!deletedTaskIds.includes(t.id)) {
              toUpdate.push({
                id: t.id,
                title: t.title,
                is_completed: t.is_completed,
                priority: t.priority,
                due_date: t.due_date,
                completed_at: t.completed_at ?? null,
              });
            }
          }

          const { inserted, error: tasksError } = await syncTasks(
            deletedTaskIds,
            toInsert,
            toUpdate
          );
          if (tasksError) {
            set({ loading: false, error: tasksError.message });
            return false;
          }

          const { userSettings } = get();
          if (userSettings) {
            const { error: settingsError } = await upsertUserSettings({
              pushup_goal: userSettings.pushup_goal,
              target_sleep_hours: userSettings.target_sleep_hours ?? 8,
            });
            if (settingsError) {
              set({ loading: false, error: settingsError.message });
              return false;
            }
          }

          // Optimized: Fetch only 365 days, then slice in memory to reduce DB queries by 80%.
          const logs365Res = await getDailyLogsLastNDays(365, todayKey());
          const allLogs = logs365Res.data ?? [];
          const sortedLogs = [...allLogs].sort((a, b) => a.date.localeCompare(b.date));

          // Slice in memory to generate date ranges.
          const logs7Data = { data: sortedLogs.slice(-7) };
          const logs28Data = { data: sortedLogs.slice(-28) };
          const logs91Data = { data: sortedLogs.slice(-91) };
          const logs180Data = { data: sortedLogs.slice(-180) };
          const logs365Data = { data: sortedLogs };

          // Prevent UI flicker: ensure server-cached arrays reflect what we just saved,
          // then clear modifiedLogs. If refetch returns null, fall back to local-merged arrays.
          const cur = get();
          const merged7 = getMergedLogs(cur.dailyLogsLast7, modifiedLogs);
          const merged28 = getMergedLogs(cur.dailyLogsLast28, modifiedLogs);
          const merged91 = getMergedLogs(cur.dailyLogsLast91, modifiedLogs);
          const merged180 = getMergedLogs(cur.dailyLogsLast180, modifiedLogs);
          const merged365 = getMergedLogs(cur.dailyLogsLast365, modifiedLogs);

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
              return {
                ...h,
                id: habitInserted[idx].id,
                user_id: habitInserted[idx].user_id,
              };
            });
            // Snapshot pattern: Only remove keys that were captured before the async save.
            const remainingModified: Record<string, DailyLog> = {};
            for (const [date, log] of Object.entries(s.modifiedLogs)) {
              if (!modifiedLogKeys.includes(date)) {
                remainingModified[date] = log;
              }
            }
            return {
              tasks: nextTasks,
              habitDefinitions: nextHabits,
              deletedTaskIds: [],
              deletedHabitIds: [],
              dailyLogsLast7: logs7Data.data ?? merged7,
              dailyLogsLast28: logs28Data.data ?? merged28,
              dailyLogsLast91: logs91Data.data ?? merged91,
              dailyLogsLast180: logs180Data.data ?? merged180,
              dailyLogsLast365: logs365Data.data ?? merged365,
              modifiedLogs: remainingModified,
              unsavedChanges: false,
              loading: false,
            };
          });
          return true;
        } catch (e) {
          set({
            loading: false,
            error: e instanceof Error ? e.message : "Save failed",
          });
          return false;
        }
      },

      addTask: (title: string, priority: TaskPriority | null) => {
        const newTask: Task = {
          id: `${TEMP_PREFIX}${crypto.randomUUID()}`,
          user_id: "",
          title,
          is_completed: false,
          priority,
          due_date: null,
          created_at: new Date().toISOString(),
          completed_at: null,
        };
        set((s) => ({
          tasks: [newTask, ...s.tasks],
          unsavedChanges: true,
        }));
      },

      updateTaskPriority: (id: string, priority: TaskPriority) => {
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, priority } : t)),
          unsavedChanges: true,
        }));
      },

      updateTaskTitle: (id: string, newTitle: string) => {
        const trimmed = newTitle.trim();
        if (!trimmed) return;
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, title: trimmed } : t)),
          unsavedChanges: true,
        }));
      },

      toggleTaskCompletion: (id: string, isCompleted: boolean) => {
        const now = new Date().toISOString();
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? {
                ...t,
                is_completed: !isCompleted,
                completed_at: isCompleted ? null : now,
              }
              : t
          ),
          unsavedChanges: true,
        }));
      },

      removeTask: (id: string) => {
        set((s) => {
          if (isTempId(id)) {
            return {
              tasks: s.tasks.filter((t) => t.id !== id),
              unsavedChanges: true,
            };
          }
          return {
            tasks: s.tasks.filter((t) => t.id !== id),
            deletedTaskIds: [...s.deletedTaskIds, id],
            unsavedChanges: true,
          };
        });
      },

      addHabitDefinition: (
        name: string,
        icon?: string | null,
        color?: string | null
      ) => {
        const newHabit: HabitDefinition = {
          id: `${TEMP_PREFIX}${crypto.randomUUID()}`,
          user_id: "",
          name,
          icon: icon ?? null,
          color: color ?? null,
          created_at: new Date().toISOString(),
        };
        set((s) => ({
          habitDefinitions: [...s.habitDefinitions, newHabit],
          unsavedChanges: true,
        }));
      },

      updateHabitDefinition: (
        id: string,
        updates: { name?: string; icon?: string | null; color?: string | null }
      ) => {
        set((s) => ({
          habitDefinitions: s.habitDefinitions.map((h) =>
            h.id === id ? { ...h, ...updates } : h
          ),
          unsavedChanges: true,
        }));
      },

      removeHabitDefinition: (id: string) => {
        set((s) => {
          const nextStatus = { ...s.dailyLog.habits_status };
          delete nextStatus[id];
          const next = { ...s.dailyLog, habits_status: nextStatus };
          const mod = { ...s.modifiedLogs, [s.selectedDate]: next };
          return {
            habitDefinitions: s.habitDefinitions.filter((h) => h.id !== id),
            deletedHabitIds: isTempId(id) ? s.deletedHabitIds : [...s.deletedHabitIds, id],
            dailyLog: next,
            modifiedLogs: mod,
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

      setError: (error: string | null) => set({ error }),
    }),
    {
      name: "life-os-store",
      partialize: (s) => {
        const { loading, error, ...rest } = s;
        return rest;
      },
      // Deduplicate habits on rehydrate to fix stale localStorage data
      onRehydrateStorage: () => (state) => {
        if (state && state.habitDefinitions.length > 0) {
          const deduped = dedupeHabits(state.habitDefinitions);
          if (deduped.length !== state.habitDefinitions.length) {
            // We found duplicates - update state
            useLifeOSStore.setState({ habitDefinitions: deduped });
          }
        }
      },
    }
  )
);
