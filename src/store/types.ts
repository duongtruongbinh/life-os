import type { DailyLog, Task, HabitDefinition, UserSettings, TaskPriority } from "@/types/database";

export type LifeOSState = {
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

export type LifeOSActions = {
  loadInitialData: () => Promise<void>;
  setSelectedDate: (date: string) => void;
  setSleepStart: (date?: string) => void;
  setSleepEnd: (date?: string) => void;
  setSleepStartAt: (iso: string, date?: string) => void;
  setSleepEndAt: (iso: string, date?: string) => void;
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
  updateTaskDueDate: (id: string, dueDate: string | null) => void;
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
    target_focus_hours?: number;
  }) => void;
  setError: (error: string | null) => void;
};

export type LifeOSStore = LifeOSState & LifeOSActions;
