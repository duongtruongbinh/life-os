export const isHabitDone = (habitsStatus: unknown, habitId: string): boolean => {
    if (!habitsStatus || typeof habitsStatus !== "object") return false;
    return !!(habitsStatus as Record<string, unknown>)[habitId];
};
