import { useMemo } from "react";
import type { Task, TaskPriority } from "@/types/database";
import { isTaskOverdue, isTaskDueToday } from "@/lib/date-utils";

// ── Eisenhower-inspired score ────────────────────────────────────────────────

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
    urgent: 300,
    high: 200,
    normal: 100,
};

function getTaskScore(task: Task): number {
    const priority = (task.priority ?? "normal") as TaskPriority;
    let score = PRIORITY_WEIGHT[priority] ?? 100;

    if (task.due_date) {
        if (isTaskOverdue(task.due_date)) score += 500;
        else if (isTaskDueToday(task.due_date)) score += 150;
    }

    return score;
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Shared hook that splits tasks into active/completed lists with
 * Eisenhower-inspired sorting (urgency + priority score) and completion-date sorting.
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

        // Sort active by Eisenhower score (higher = first)
        active.sort((a, b) => getTaskScore(b) - getTaskScore(a));

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
