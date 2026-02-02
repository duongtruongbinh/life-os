"use server";

import { createClient } from "@/utils/supabase/server";
import type { DailyLog } from "@/types/database";

/** Fetches daily logs for a date range (inclusive). */
export async function getDailyLogsForRange(
  startDate: string,
  endDate: string
): Promise<{ data: DailyLog[] | null; error: Error | null }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: authError ?? new Error("Not authenticated") };
  }
  const { data, error } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });
  return {
    data: (data ?? []) as DailyLog[],
    error: error ? new Error(error.message) : null,
  };
}

/** Fetches daily logs for the last N days (for charts). If asOfDate (YYYY-MM-DD) is provided, use it as end date (client's local today); otherwise use server date. */
export async function getDailyLogsLastNDays(
  days: number,
  asOfDate?: string
): Promise<{ data: DailyLog[] | null; error: Error | null }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: authError ?? new Error("Not authenticated") };
  }
  const endStr = asOfDate ?? (() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  })();
  const [y, m, day] = endStr.split("-").map(Number);
  const end = new Date(y, m - 1, day);
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  const pad = (n: number) => String(n).padStart(2, "0");
  const startStr = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
  const { data, error } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", startStr)
    .lte("date", endStr)
    .order("date", { ascending: true });
  return {
    data: (data ?? []) as DailyLog[],
    error: error ? new Error(error.message) : null,
  };
}

/** Single upsert for daily log (used by store saveData). Date string is used as-is (no timezone conversion). */
export async function saveDailyLog(
  date: string,
  log: Omit<DailyLog, "user_id" | "date">
): Promise<{ error: Error | null }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: authError ?? new Error("Not authenticated") };
  }
  const { error } = await supabase.from("daily_logs").upsert(
    { user_id: user.id, date, ...log },
    { onConflict: "user_id,date" }
  );
  return { error: error ? new Error(error.message) : null };
}

/** Bulk upsert daily logs. Dates are used as-is from the client (no timezone conversion). */
export async function saveDailyLogsBulk(
  entries: Array<{ date: string; log: Omit<DailyLog, "user_id" | "date"> }>
): Promise<{ error: Error | null }> {
  if (entries.length === 0) return { error: null };
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: authError ?? new Error("Not authenticated") };
  }
  const rows = entries.map(({ date, log }) => ({ user_id: user.id, date, ...log }));
  const { error } = await supabase.from("daily_logs").upsert(rows, {
    onConflict: "user_id,date",
  });
  return { error: error ? new Error(error.message) : null };
}

/** Fetches daily log for a given date. */
export async function getLogForDate(date: string): Promise<{
  data: DailyLog | null;
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
    .from("daily_logs")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", date)
    .maybeSingle();
  return {
    data: data as DailyLog | null,
    error: error ? new Error(error.message) : null,
  };
}
