import type { DailyLog } from "@/types/database";
import { getLocalDateKey } from "@/lib/date-utils";

/**
 * Build a set of completed date keys for a habit from daily logs.
 */
function buildCompletedSet(habitId: string, logs: DailyLog[]): Set<string> {
    const set = new Set<string>();
    for (const log of logs) {
        if (log.habits_status?.[habitId]) {
            set.add(log.date);
        }
    }
    return set;
}

/**
 * Get the date key for N days before a reference date (local timezone).
 */
function dateMinus(refDate: Date, days: number): string {
    const d = new Date(refDate);
    d.setDate(d.getDate() - days);
    return getLocalDateKey(d);
}

/**
 * Calculate current streak for a habit — consecutive days completed
 * ending today or yesterday (allowing "not done yet today").
 *
 * Logic:
 * 1. If today is completed → start counting from today backwards.
 * 2. Else if yesterday is completed → start counting from yesterday backwards.
 * 3. Otherwise → streak is 0.
 */
export function calculateCurrentStreak(
    habitId: string,
    logs: DailyLog[],
    todayKey: string
): number {
    const completed = buildCompletedSet(habitId, logs);
    if (completed.size === 0) return 0;

    const today = new Date(todayKey + "T12:00:00"); // noon to avoid DST edge

    const doneToday = completed.has(todayKey);
    const yesterdayKey = dateMinus(today, 1);
    const doneYesterday = completed.has(yesterdayKey);

    if (!doneToday && !doneYesterday) return 0;

    // Start from the first confirmed day and walk backwards
    let streak = 0;

    // Count today if it's done
    if (doneToday) streak++;

    // Check backwards from yesterday
    for (let i = 1; i <= 365; i++) {
        if (completed.has(dateMinus(today, i))) {
            streak++;
        } else {
            break;
        }
    }

    return streak;
}

/**
 * Calculate the longest streak ever for a habit.
 */
export function calculateBestStreak(
    habitId: string,
    logs: DailyLog[]
): number {
    // Get all completed dates sorted ascending
    const completedDates = logs
        .filter((l) => l.habits_status?.[habitId])
        .map((l) => l.date)
        .sort((a, b) => a.localeCompare(b));

    if (completedDates.length === 0) return 0;

    let bestStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < completedDates.length; i++) {
        // Compare adjacent dates using local date arithmetic
        const prev = new Date(completedDates[i - 1] + "T12:00:00");
        const next = new Date(completedDates[i] + "T12:00:00");
        const diffMs = next.getTime() - prev.getTime();
        const diffDays = Math.round(diffMs / 86400000);

        if (diffDays === 1) {
            currentStreak++;
            bestStreak = Math.max(bestStreak, currentStreak);
        } else {
            currentStreak = 1;
        }
    }

    return bestStreak;
}

// ── Dev-mode sanity check ──────────────────────────────────────────────────
if (process.env.NODE_ENV === "development") {
    const makeLogs = (dates: string[], habitId: string): DailyLog[] =>
        dates.map((date) => ({
            user_id: "",
            date,
            sleep_start: null,
            sleep_end: null,
            focus_start: null,
            focus_end: null,
            focus_minutes: 0,
            habits_status: { [habitId]: true },
            pushup_count: 0,
            notes: null,
        }));

    const hid = "__test__";
    const today = "2026-02-12";

    // 1. Streak continues if today is completed
    const logs1 = makeLogs(["2026-02-10", "2026-02-11", "2026-02-12"], hid);
    console.assert(calculateCurrentStreak(hid, logs1, today) === 3, "streak: today completed = 3");

    // 2. Streak continues if yesterday is latest
    const logs2 = makeLogs(["2026-02-10", "2026-02-11"], hid);
    console.assert(calculateCurrentStreak(hid, logs2, today) === 2, "streak: yesterday latest = 2");

    // 3. Streak = 0 if gap
    const logs3 = makeLogs(["2026-02-09"], hid);
    console.assert(calculateCurrentStreak(hid, logs3, today) === 0, "streak: gap = 0");
}
