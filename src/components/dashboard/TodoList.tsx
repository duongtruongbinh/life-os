"use client";

import { useState, useMemo } from "react";
import { ListTodo, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskInput } from "@/components/tasks/TaskInput";
import { TaskItem } from "@/components/tasks/TaskItem";
import { useLifeOSStore } from "@/store/useLifeOSStore";
import { EmptyState } from "@/components/ui/empty-state";
import type { TaskPriority } from "@/types/database";

const MAX_VISIBLE = 10;
const PRIORITY_ORDER: TaskPriority[] = ["urgent", "high", "normal"];

/** Task list: quick-add, editable titles, priority styling. */
export function TodoList() {
  const tasks = useLifeOSStore((s) => s.tasks);
  const updateTaskPriority = useLifeOSStore((s) => s.updateTaskPriority);
  const updateTaskTitle = useLifeOSStore((s) => s.updateTaskTitle);
  const updateTaskDueDate = useLifeOSStore((s) => s.updateTaskDueDate);
  const toggleTaskCompletion = useLifeOSStore((s) => s.toggleTaskCompletion);
  const removeTask = useLifeOSStore((s) => s.removeTask);





  const [showAll, setShowAll] = useState(false);

  // Sort: Overdue → Due today → Active (by priority) → Completed
  const today = new Date().toISOString().slice(0, 10);
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
      if (!a.is_completed) {
        // Overdue first
        const aOverdue = a.due_date && a.due_date < today;
        const bOverdue = b.due_date && b.due_date < today;
        if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
        // Due today second
        const aToday = a.due_date === today;
        const bToday = b.due_date === today;
        if (aToday !== bToday) return aToday ? -1 : 1;
        // Then by priority
        const pA = PRIORITY_ORDER.indexOf((a.priority ?? "normal") as TaskPriority);
        const pB = PRIORITY_ORDER.indexOf((b.priority ?? "normal") as TaskPriority);
        return pA - pB;
      }
      return (b.completed_at || "").localeCompare(a.completed_at || "");
    });
  }, [tasks, today]);

  const visibleTasks = showAll
    ? sortedTasks
    : sortedTasks.slice(0, MAX_VISIBLE);
  const hasMore = tasks.length > MAX_VISIBLE && !showAll;

  // Render
  return (
    <div className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 text-base font-bold tracking-tight text-slate-900 dark:text-white group">
        <ListTodo className="size-5 text-[var(--color-task)] icon-hover-scale" />
        Tasks
      </h2>

      {/* Add task form */}
      <TaskInput />

      {/* Task list */}
      <div className="flex flex-col gap-4 animate-stagger">
        {tasks.length === 0 ? (
          <EmptyState
            icon={Sun}
            title="All caught up!"
            description="Enjoy your free time."
            className="py-12"
          />
        ) : (
          <>
            {/* Active Tasks */}
            <ul className="space-y-1">
              {visibleTasks.filter(t => !t.is_completed).map((t) => (
                <TaskItem
                  key={t.id}
                  task={t}
                  onToggle={toggleTaskCompletion}
                  onUpdatePriority={updateTaskPriority}
                  onUpdateTitle={updateTaskTitle}
                  onUpdateDueDate={updateTaskDueDate}
                  onRemove={removeTask}
                />
              ))}
            </ul>

            {/* Completed Tasks Separator */}
            {visibleTasks.some(t => t.is_completed) && (
              <div className="pt-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                  Completed
                </h3>
                <ul className="space-y-2 opacity-80">
                  {visibleTasks.filter(t => t.is_completed).map((t) => (
                    <TaskItem
                      key={t.id}
                      task={t}
                      onToggle={toggleTaskCompletion}
                      onUpdatePriority={updateTaskPriority}
                      onUpdateTitle={updateTaskTitle}
                      onUpdateDueDate={updateTaskDueDate}
                      onRemove={removeTask}
                    />
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>

      {tasks.length > 0 && hasMore && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="inline-flex min-h-[40px] items-center gap-1 text-muted-foreground text-sm transition-spring hover:text-foreground hover:translate-x-1"
        >
          View all ({tasks.length}) tasks
        </button>
      )}
    </div>
  );
}
