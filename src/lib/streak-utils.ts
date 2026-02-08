import type { DailyLog } from "@/types/database";

/**
 * Calculate current streak for a habit - consecutive days completed ending today/yesterday.
 */
export function calculateCurrentStreak(
    habitId: string,
    logs: DailyLog[],
    today: string
): number {
    // Sort logs by date descending
    const sortedLogs = [...logs]
        .filter((l) => l.habits_status?.[habitId])
        .map((l) => l.date)
        .sort((a, b) => b.localeCompare(a));

    if (sortedLogs.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date(today);

    // Check if today or yesterday is in the streak (allowing 1 day gap for "today not done yet")
    const todayStr = today;
    const yesterdayStr = getDateString(new Date(currentDate.getTime() - 86400000));

    // Start from latest completed day
    const latestCompleted = sortedLogs[0];
    if (latestCompleted !== todayStr && latestCompleted !== yesterdayStr) {
        return 0; // Streak broken
    }

    // Count consecutive days
    currentDate = new Date(latestCompleted);
    for (const dateStr of sortedLogs) {
        const expected = getDateString(currentDate);
        if (dateStr === expected) {
            streak++;
            currentDate = new Date(currentDate.getTime() - 86400000);
        } else if (dateStr < expected) {
            // Gap found, streak ends
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
        const prevDate = new Date(completedDates[i - 1]);
        const currDate = new Date(completedDates[i]);
        const diffDays = Math.round(
            (currDate.getTime() - prevDate.getTime()) / 86400000
        );

        if (diffDays === 1) {
            currentStreak++;
            bestStreak = Math.max(bestStreak, currentStreak);
        } else {
            currentStreak = 1;
        }
    }

    return bestStreak;
}

function getDateString(date: Date): string {
    return date.toISOString().slice(0, 10);
}
