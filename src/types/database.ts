/** Row types for Supabase tables. */

export type TaskPriority = "urgent" | "high" | "normal";

export interface UserSettings {
  user_id: string;
  pushup_goal: number;
  target_sleep_hours?: number;
  target_focus_hours?: number;
  created_at: string;
}

export interface DailyLog {
  user_id: string;
  date: string;
  sleep_start: string | null;
  sleep_end: string | null;
  focus_start: string | null;
  focus_end: string | null;
  focus_minutes: number;
  habits_status: Record<string, boolean>;
  pushup_count: number;
  notes: string | null;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  is_completed: boolean;
  priority: TaskPriority | null;
  due_date: string | null;
  created_at: string;
  /** When the task was marked complete (null if not completed or pre-migration). */
  completed_at?: string | null;
}

export interface HabitDefinition {
  id: string;
  user_id: string;
  name: string;
  icon: string | null;
  color: string | null;
  created_at: string;
}
