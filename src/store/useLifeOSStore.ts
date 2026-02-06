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

/**
 * Calculate current streak only counting "completed" days.
 * - If done today: count continues.
 * - If not done today, but done yesterday: count continues.
 * - If not done yesterday: count is 0 (unless done today).
 */
export function calculateCurrentStreak(
  habitId: string,
  dailyLogs365: DailyLog[], // Assumed sorted by date ascending
  todayDate: string
): number {
  // Create a map for O(1) lookup
  const statusMap = new Map<string, boolean>();
  // Optimisation: only look at last 365 days
  for (const log of dailyLogs365) {
    if (log.habits_status[habitId]) {
      statusMap.set(log.date, true);
    }
  }

  let streak = 0;
  const today = new Date(todayDate);

  // Check today first
  if (statusMap.get(todayDate)) {
    streak++;
  }

  // Iterate backwards from yesterday
  for (let i = 1; i <= 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = getLocalDateKey(d);

    if (statusMap.get(key)) {
      streak++;
    } else {
      // If we haven't broken the streak yet (i.e. we are at yesterday and it's missing)
      // BUT if we have done it today, we stop.
      // If we haven't done it today, and missed yesterday, streak is 0.
      // Wait, standard logic:
      // If done Today: streak = 1 + backward.
      // If not done Today: check Yesterday. If done, streak = backward. If not, streak = 0.

      // Let's restart logic for clarity:
      // We look backwards starting from Today.
      // 1. Check Today.
      // 2. Check Yesterday.
      // ...
      // Break on first missing day... UNLESS it is Today and we just haven't done it yet.

      // Correct Logic:
      // Start checking from Yesterday.
      // Streak = Consecutive days back from Yesterday.
      // Plus 1 if Today is done.
      break;
    }
  }

  // Re-run cleanly:
  let count = 0;
  // Check if done today
  if (statusMap.get(todayDate)) {
    count++;
  }

  // Check backwards from yesterday
  for (let i = 1; i <= 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = getLocalDateKey(d);

    if (statusMap.get(key)) {
      count++;
    } else {
      break;
    }
  }

  return count;
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
 * Prefers real IDs over temp IDs.
 */
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

const emptyDailyLog = (date: string): DailyLog => ({
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
  saving: boolean;
  error: string | null;
  // Internal: track async request ID to prevent race conditions
  _dateRequestId: number;
  _initialLoadRequestId: number;
};

type LifeOSActions = {
  loadInitialData: () => Promise<void>;
  setSelectedDate: (date: string) => void;
  setSleepStart: () => void;
  setSleepEnd: () => void;
  setSleepStartAt: (iso: string) => void;
  setSleepEndAt: (iso: string) => void;
  setFocusStart: () => void;
  setFocusEnd: () => void;
  addFocusMinutes: (n: number) => void;
  setFocusMinutesForDate: (date: string, minutes: number) => void;
  toggleHabit: (habitId: string) => void;
  addPushupCount: (n: number) => void;
  setPushupCountForDate: (date: string, count: number) => void;
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

// Debounce timer for auto-save
let saveTimeout: NodeJS.Timeout | null = null;

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
      saving: false,
      error: null,
      _dateRequestId: 0,
      _initialLoadRequestId: 0,

      setSelectedDate: (date: string) => {
        const prev = get();
        const requestId = Date.now();
        set({ selectedDate: date, _dateRequestId: requestId });

        if (!prev.isInitialized || date === prev.dailyLog.date) return;

        // Check modified logs first
        const modified = prev.modifiedLogs[date];
        if (modified) {
          set({ dailyLog: { ...modified, date } });
          return;
        }

        // Check cached logs
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

        // Fetch from server with race condition protection
        getLogForDate(date).then(({ data, error }) => {
          // Ignore stale response if user already navigated to different date
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

        // Prevent concurrent loads
        if (prevState.loading) return;

        const requestId = Date.now();
        set({ loading: true, error: null, _initialLoadRequestId: requestId });

        try {
          const { data, error } = await fetchFullDashboardData(selectedDate);

          // Race condition check: if another load started, ignore this one
          if (get()._initialLoadRequestId !== requestId) return;

          const currentState = get();
          const hasUnsavedChanges = currentState.unsavedChanges && currentState.isInitialized;

          // Deduplicate server habits
          const serverHabits = dedupeHabits(data?.habitDefinitions ?? []);

          // Habit merge logic
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
              id: `${TEMP_PREFIX}${crypto.randomUUID()}`,
              user_id: "",
              created_at: new Date().toISOString(),
            }));
          }

          const userSettings = data?.userSettings ?? DEFAULT_USER_SETTINGS;
          const needsDefaults =
            finalHabitDefinitions.some((h) => isTempId(h.id)) || !data?.userSettings;

          // Daily log merge
          const serverDailyLog = data?.dailyLog ?? emptyDailyLog(selectedDate);
          const localModifiedLog = currentState.modifiedLogs[selectedDate];
          const finalDailyLog =
            hasUnsavedChanges && localModifiedLog ? localModifiedLog : serverDailyLog;

          // Tasks merge
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
          return {
            dailyLog: next,
            modifiedLogs: { ...s.modifiedLogs, [s.selectedDate]: next },
            unsavedChanges: true,
          };
        });
      },

      setSleepEnd: () => {
        const now = new Date().toISOString();
        set((s) => {
          const next = { ...s.dailyLog, sleep_end: now };
          return {
            dailyLog: next,
            modifiedLogs: { ...s.modifiedLogs, [s.selectedDate]: next },
            unsavedChanges: true,
          };
        });
      },

      setSleepStartAt: (iso: string) => {
        set((s) => {
          const next = { ...s.dailyLog, sleep_start: iso };
          return {
            dailyLog: next,
            modifiedLogs: { ...s.modifiedLogs, [s.selectedDate]: next },
            unsavedChanges: true,
          };
        });
      },

      setSleepEndAt: (iso: string) => {
        set((s) => {
          const next = { ...s.dailyLog, sleep_end: iso };
          return {
            dailyLog: next,
            modifiedLogs: { ...s.modifiedLogs, [s.selectedDate]: next },
            unsavedChanges: true,
          };
        });
      },



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
          // Calculate minutes and add to total
          let minutes = 0;
          if (s.dailyLog.focus_start) {
            const start = new Date(s.dailyLog.focus_start);
            const diffMs = now.getTime() - start.getTime();
            minutes = Math.floor(diffMs / 60000);
          }

          const next = {
            ...s.dailyLog,
            focus_start: null,
            focus_end: null, // We generally don't persist focus_end for individual sessions in this simple model, just aggregate minutes
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

      toggleHabit: (habitId: string) => {
        const prev = get();
        const current = prev.dailyLog.habits_status[habitId] ?? false;
        const habits_status = { ...prev.dailyLog.habits_status, [habitId]: !current };
        const next = { ...prev.dailyLog, habits_status };

        set({
          dailyLog: next,
          modifiedLogs: { ...prev.modifiedLogs, [prev.selectedDate]: next },
          unsavedChanges: true,
        });

        // Trigger background sync
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
          get().saveData().then(ok => {
            if (!ok) {
              // On failure, we could revert, but for now we basically rely on the 'unsavedChanges' indicator
              // persisting so the user can manually retry.
              // Reverting optimistic updates automatically can be jarring if it was just a transient network glitch.
            }
          });
        }, 2000);
      },

      addPushupCount: (n: number) => {
        set((s) => {
          const next = { ...s.dailyLog, pushup_count: s.dailyLog.pushup_count + n };
          return {
            dailyLog: next,
            modifiedLogs: { ...s.modifiedLogs, [s.selectedDate]: next },
            unsavedChanges: true,
          };
        });
      },

      setPushupCountForDate: (date: string, count: number) => {
        set((s) => {
          // If editing current selected date
          if (date === s.selectedDate) {
            const next = { ...s.dailyLog, pushup_count: count };
            return {
              dailyLog: next,
              modifiedLogs: { ...s.modifiedLogs, [date]: next },
              unsavedChanges: true,
            };
          }
          // Editing a different date - find existing log or create new
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

      saveData: async () => {
        const state = get();

        // Prevent concurrent saves
        if (state.saving) {
          console.warn("[saveData] Already saving, skipping");
          return false;
        }

        const { modifiedLogs, tasks, deletedTaskIds, habitDefinitions, deletedHabitIds } = state;
        const modifiedLogKeys = Object.keys(modifiedLogs);

        set({ saving: true, error: null });

        try {
          // 1. Sync habits first (needed for ID mapping)
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

          const { inserted: habitInserted, error: habitsError } = await syncHabits(
            deletedHabitIds,
            habitToInsert,
            habitToUpdate
          );

          if (habitsError) {
            set({ saving: false, error: habitsError.message });
            return false;
          }

          // Build habit ID mapping
          const habitIdMap: Record<string, string> = {};
          habitTempOrder.forEach((tempId, i) => {
            if (habitInserted[i]) habitIdMap[tempId] = habitInserted[i].id;
          });

          // Remap habits_status keys
          const remapHabits = (status: Record<string, boolean>) => {
            const out: Record<string, boolean> = {};
            for (const [k, v] of Object.entries(status)) {
              const realId = habitIdMap[k] ?? k;
              if (!deletedHabitIds.includes(realId)) out[realId] = v;
            }
            return out;
          };

          // 2. Save daily logs
          const bulkEntries = Object.entries(modifiedLogs).map(([date, log]) => ({
            date,
            log: {
              sleep_start: log.sleep_start,
              sleep_end: log.sleep_end,
              habits_status: remapHabits(log.habits_status),
              pushup_count: log.pushup_count,
              notes: log.notes,
              focus_start: log.focus_start,
              focus_end: log.focus_end,
              focus_minutes: log.focus_minutes,
            },
          }));

          const { error: logsError } = await saveDailyLogsBulk(bulkEntries);
          if (logsError) {
            console.error("[saveData] Daily logs save failed:", logsError);
            set({ saving: false, error: `Logs save failed: ${logsError.message}` });
            return false;
          }

          // 3. Sync tasks
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

          const { inserted, error: tasksError } = await syncTasks(deletedTaskIds, toInsert, toUpdate);
          if (tasksError) {
            set({ saving: false, error: tasksError.message });
            return false;
          }

          // 4. Save user settings
          const { userSettings } = get();
          if (userSettings) {
            const { error: settingsError } = await upsertUserSettings({
              pushup_goal: userSettings.pushup_goal,
              target_sleep_hours: userSettings.target_sleep_hours ?? 8,
              target_focus_hours: userSettings.target_focus_hours ?? 9,
            });
            if (settingsError) {
              set({ saving: false, error: settingsError.message });
              return false;
            }
          }

          // 5. Refresh logs from server (single query, slice in memory)
          let allLogs = [];
          try {
            const logs365Res = await getDailyLogsLastNDays(365, todayKey());
            if (logs365Res.error) {
              // If refresh fails but save succeeded, we should probably warn but not fail the whole operation?
              // For now, let's treat it as an error to ensure data consistency, but log it clearly.
              throw new Error(`Refresh failed: ${logs365Res.error.message}`);
            }
            allLogs = [...(logs365Res.data ?? [])].sort((a, b) =>
              a.date.localeCompare(b.date)
            );
          } catch (refreshErr: any) {
            console.error("[saveData] Refresh step failed:", refreshErr);
            set({ saving: false, error: `Saved, but sync failed: ${refreshErr.message}` });
            return false;
          }

          // 6. Apply changes to state
          set((s) => {
            // Remap temp IDs to real IDs
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

            // Only remove logs that were saved (snapshot pattern)
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
        } catch (e: any) {
          console.error("[saveData] Exception:", e);
          set({
            saving: false,
            error: e?.message || "Save failed (Unknown error)",
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
        set((s) => ({ tasks: [newTask, ...s.tasks], unsavedChanges: true }));
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
        const prev = get();

        // Optimistic update
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? { ...t, is_completed: !isCompleted, completed_at: isCompleted ? null : now }
              : t
          ),
          unsavedChanges: true,
        }));

        // Background sync
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
          get().saveData();
        }, 2000);
      },

      removeTask: (id: string) => {
        set((s) => {
          if (isTempId(id)) {
            return { tasks: s.tasks.filter((t) => t.id !== id), unsavedChanges: true };
          }
          return {
            tasks: s.tasks.filter((t) => t.id !== id),
            deletedTaskIds: [...s.deletedTaskIds, id],
            unsavedChanges: true,
          };
        });
      },

      addHabitDefinition: (name: string, icon?: string | null, color?: string | null) => {
        const newHabit: HabitDefinition = {
          id: `${TEMP_PREFIX}${crypto.randomUUID()}`,
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
          const nextStatus = { ...s.dailyLog.habits_status };
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
        // Exclude transient state from persistence
        const { loading, saving, error, _dateRequestId, ...rest } = s;
        return rest;
      },
      // Deduplicate habits on rehydrate
      onRehydrateStorage: () => (state) => {
        if (state && state.habitDefinitions.length > 0) {
          const deduped = dedupeHabits(state.habitDefinitions);
          if (deduped.length !== state.habitDefinitions.length) {
            useLifeOSStore.setState({ habitDefinitions: deduped });
          }
        }
      },
    }
  )
);
