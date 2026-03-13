/** Row types for Supabase tables. */
import type { Database } from "./supabase-check";

export type TaskPriority = "urgent" | "high" | "normal";

export type UserSettings = Database["public"]["Tables"]["user_settings"]["Row"];

export type DailyLog = Database["public"]["Tables"]["daily_logs"]["Row"];

export type Task = Database["public"]["Tables"]["tasks"]["Row"];

export type HabitDefinition = Database["public"]["Tables"]["habit_definitions"]["Row"];