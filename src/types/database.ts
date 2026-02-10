/** Row types for Supabase tables. */

export type TaskPriority = "urgent" | "high" | "normal";

export interface UserSettings {
  user_id: string;
  pushup_goal: number | null;
  target_sleep_hours: number | null;
  target_focus_hours: number | null;
  created_at: string | null;
}

export interface DailyLog {
  user_id: string;
  date: string;
  sleep_start: string | null;
  sleep_end: string | null;
  focus_start: string | null;
  focus_end: string | null;
  focus_minutes: number | null;
  habits_status: Record<string, boolean> | null;
  pushup_count: number | null;
  notes: string | null;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  is_completed: boolean | null;
  priority: TaskPriority | null;
  due_date: string | null;
  created_at: string | null;
  /** When the task was marked complete (null if not completed or pre-migration). */
  completed_at?: string | null;
}

export interface HabitDefinition {
  id: string;
  user_id: string;
  name: string;
  icon: string | null;
  color: string | null;
  created_at: string | null;
}