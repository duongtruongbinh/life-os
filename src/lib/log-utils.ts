/**
 * Pure utility functions for merging and indexing daily logs.
 * Separated from the Zustand store to maintain architecture boundaries
 * (lib must not import store; store may import lib).
 */
import type { DailyLog } from "@/types/database";

/**
 * Merged view for visualizations: overlay local drafts (`modifiedLogs`) onto server logs.
 * Returns a new sorted array — safe for memoization deps.
 */
export function mergeLogs(
    serverLogs: DailyLog[],
    modifiedLogs: Record<string, DailyLog>
): DailyLog[] {
    const byDate = new Map<string, DailyLog>();
    for (const l of serverLogs) byDate.set(l.date, l);
    for (const [date, l] of Object.entries(modifiedLogs)) byDate.set(date, l);
    return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Build a Map<dateKey, DailyLog> for O(1) lookups.
 * Use this instead of array.find() in loops.
 */
export function buildLogMap(logs: DailyLog[]): Map<string, DailyLog> {
    const map = new Map<string, DailyLog>();
    for (const l of logs) map.set(l.date, l);
    return map;
}
