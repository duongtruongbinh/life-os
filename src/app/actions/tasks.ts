"use server";

import { requireUserClient } from "./_helpers";
import type { Task, TaskPriority } from "@/types/database";

/** Payload for bulk task sync (local-first save). */
export type TaskInsert = {
  title: string;
  is_completed: boolean;
  priority: TaskPriority | null;
  due_date: string | null;
  created_at: string;
  completed_at: string | null;
};

export type TaskUpdate = {
  id: string;
  title?: string;
  is_completed?: boolean;
  priority?: TaskPriority | null;
  due_date?: string | null;
  completed_at?: string | null;
};

/** Fetches all tasks for the current user. */
export async function getTasks(): Promise<{
  data: Task[] | null;
  error: Error | null;
}> {
  try {
    const { supabase, user } = await requireUserClient();
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    return {
      data: (data ?? []) as Task[],
      error: error ? new Error(error.message) : null,
    };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e : new Error("Auth failed") };
  }
}

/** Bulk sync: delete by ids, insert new tasks, update existing. Returns inserted tasks with server ids. */
export async function syncTasks(
  deletedIds: string[],
  toInsert: TaskInsert[],
  toUpdate: TaskUpdate[]
): Promise<{ inserted: Task[]; error: Error | null }> {
  try {
    const { supabase, user } = await requireUserClient();
    let insertedRows: Task[] = [];

    if (deletedIds.length > 0) {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .in("id", deletedIds)
        .eq("user_id", user.id);
      if (error) return { inserted: [], error: new Error(error.message) };
    }

    if (toInsert.length > 0) {
      const rows = toInsert.map((t) => ({
        user_id: user.id,
        title: t.title,
        is_completed: t.is_completed,
        priority: t.priority,
        due_date: t.due_date,
        created_at: t.created_at,
        completed_at: t.completed_at ?? null,
      }));
      const { data, error } = await supabase
        .from("tasks")
        .insert(rows)
        .select();
      if (error) return { inserted: [], error: new Error(error.message) };
      insertedRows = (data ?? []) as Task[];
    }

    if (toUpdate.length > 0) {
      const updatePromises = toUpdate.map(async (u) => {
        const { id, ...rest } = u;
        const payload = { ...rest };
        if ("completed_at" in payload && payload.completed_at === undefined) {
          delete payload.completed_at;
        }
        
        const { error } = await supabase
          .from("tasks")
          .update(payload)
          .eq("id", id)
          .eq("user_id", user.id);
          
        if (error) throw new Error(error.message);
      });

      await Promise.all(updatePromises);
    }

    return { inserted: insertedRows, error: null };
  } catch (e) {
    return { inserted: [], error: e instanceof Error ? e : new Error("Auth failed") };
  }
}
