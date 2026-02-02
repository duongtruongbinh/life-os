"use server";

import { createClient } from "@/utils/supabase/server";
import type { UserSettings } from "@/types/database";

/** Fetches user_settings for current user. Read-only; returns null if no row exists. */
export async function getUserSettings(): Promise<{
  data: UserSettings | null;
  error: Error | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: authError ?? new Error("Not authenticated") };
  }
  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) {
    return { data: null, error: new Error(error.message) };
  }
  return { data: data as UserSettings | null, error: null };
}

/** Upserts user_settings. Called only from store saveData. */
export async function upsertUserSettings(settings: {
  pushup_goal: number;
  target_sleep_hours?: number;
}): Promise<{ error: Error | null }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: authError ?? new Error("Not authenticated") };
  }
  const { error } = await supabase.from("user_settings").upsert(
    {
      user_id: user.id,
      pushup_goal: settings.pushup_goal,
      target_sleep_hours: settings.target_sleep_hours ?? 8,
    },
    { onConflict: "user_id" }
  );
  return { error: error ? new Error(error.message) : null };
}

/** Updates user_settings for current user. Used by legacy flows; prefer upsertUserSettings. */
export async function updateUserSettings(updates: {
  pushup_goal?: number;
  target_sleep_hours?: number;
}): Promise<{ error: Error | null }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: authError ?? new Error("Not authenticated") };
  }
  const { error } = await supabase
    .from("user_settings")
    .update(updates)
    .eq("user_id", user.id);
  return { error: error ? new Error(error.message) : null };
}
