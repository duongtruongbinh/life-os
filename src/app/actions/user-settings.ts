"use server";

import { requireUserClient } from "./_helpers";
import type { UserSettings } from "@/types/database";

/** Fetches user_settings for current user. Read-only; returns null if no row exists. */
export async function getUserSettings(): Promise<{
  data: UserSettings | null;
  error: Error | null;
}> {
  try {
    const { supabase, user } = await requireUserClient();
    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) {
      return { data: null, error: new Error(error.message) };
    }
    return { data: data as UserSettings | null, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e : new Error("Auth failed") };
  }
}

/** Upserts user_settings. Called only from store saveData. */
export async function upsertUserSettings(settings: {
  pushup_goal: number;
  target_sleep_hours?: number;
  target_focus_hours?: number;
}): Promise<{ error: Error | null }> {
  try {
    const { supabase, user } = await requireUserClient();
    const { error } = await supabase.from("user_settings").upsert(
      {
        user_id: user.id,
        pushup_goal: settings.pushup_goal,
        target_sleep_hours: settings.target_sleep_hours ?? 8,
        target_focus_hours: settings.target_focus_hours ?? 9,
      },
      { onConflict: "user_id" }
    );
    return { error: error ? new Error(error.message) : null };
  } catch (e) {
    return { error: e instanceof Error ? e : new Error("Auth failed") };
  }
}

/** Updates user_settings for current user. */
export async function updateUserSettings(updates: {
  pushup_goal?: number;
  target_sleep_hours?: number;
}): Promise<{ error: Error | null }> {
  try {
    const { supabase, user } = await requireUserClient();
    const { error } = await supabase
      .from("user_settings")
      .update(updates)
      .eq("user_id", user.id);
    return { error: error ? new Error(error.message) : null };
  } catch (e) {
    return { error: e instanceof Error ? e : new Error("Auth failed") };
  }
}
