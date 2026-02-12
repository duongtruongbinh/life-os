import { useMemo } from "react";
import type { Task } from "@/types/database";

/**
 * Shared hook that splits tasks into active/completed lists with
 * priority sorting (urgent > high > normal) and completion-date sorting.
 */
export function useTaskView(tasks: Task[]) {
    return useMemo(() => {
        const active: Task[] = [];
        const completed: Task[] = [];

        tasks.forEach((t) => {
            if (t.is_completed) {
                completed.push(t);
            } else {
                active.push(t);
            }
        });

        // Sort active by priority: urgent > high > normal
        active.sort((a, b) => {
            const pA = a.priority ?? "normal";
            const pB = b.priority ?? "normal";
            if (pA === pB) return 0;
            if (pA === "urgent") return -1;
            if (pB === "urgent") return 1;
            if (pA === "high") return -1;
            if (pB === "high") return 1;
            return 0;
        });

        // Sort completed by completion date (most recent first)
        completed.sort((a, b) => {
            if (!a.completed_at || !b.completed_at) return 0;
            return b.completed_at.localeCompare(a.completed_at);
        });

        return {
            activeTasks: active,
            completedTasks: completed,
            pendingCount: active.length,
            completedCount: completed.length,
        };
    }, [tasks]);
}
