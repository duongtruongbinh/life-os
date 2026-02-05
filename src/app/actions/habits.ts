"use server";

import { createClient } from "@/utils/supabase/server";
import type { HabitDefinition } from "@/types/database";

/** Payload for bulk habit sync (local-first save). */
export type HabitInsert = {
  name: string;
  icon: string | null;
  color: string | null;
};

export type HabitUpdate = {
  id: string;
  name?: string;
  icon?: string | null;
  color?: string | null;
};

/** Fetches habit definitions for the current user. */
export async function getHabitDefinitions(): Promise<{
  data: HabitDefinition[] | null;
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
    .from("habit_definitions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });
  return {
    data: (data ?? []) as HabitDefinition[],
    error: error ? new Error(error.message) : null,
  };
}

/** Bulk sync: delete by ids, insert new habits, update existing. Returns inserted habits with server ids. */
export async function syncHabits(
  deletedIds: string[],
  toInsert: HabitInsert[],
  toUpdate: HabitUpdate[]
): Promise<{ inserted: HabitDefinition[]; error: Error | null }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { inserted: [], error: authError ?? new Error("Not authenticated") };
  }

  let insertedRows: HabitDefinition[] = [];

  if (deletedIds.length > 0) {
    const { error } = await supabase
      .from("habit_definitions")
      .delete()
      .in("id", deletedIds)
      .eq("user_id", user.id);
    if (error) return { inserted: [], error: new Error(error.message) };
  }

  if (toInsert.length > 0) {
    const rows = toInsert.map((h) => ({
      user_id: user.id,
      name: h.name,
      icon: h.icon,
      color: h.color,
    }));
    const { data, error } = await supabase
      .from("habit_definitions")
      .insert(rows)
      .select();
    if (error) return { inserted: [], error: new Error(error.message) };
    insertedRows = (data ?? []) as HabitDefinition[];
  }

  for (const u of toUpdate) {
    const { id, ...rest } = u;
    const { error } = await supabase
      .from("habit_definitions")
      .update(rest)
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return { inserted: [], error: new Error(error.message) };
  }

  return { inserted: insertedRows, error: null };
}
