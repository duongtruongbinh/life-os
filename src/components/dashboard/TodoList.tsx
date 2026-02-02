"use client";

import { useState, useRef, useCallback } from "react";
import { Plus, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PrioritySelect } from "@/components/ui/priority-select";
import { TaskItem } from "@/components/tasks/TaskItem";
import { useLifeOSStore } from "@/store/useLifeOSStore";
import type { TaskPriority } from "@/types/database";

const MAX_VISIBLE = 10;
const PRIORITY_ORDER: TaskPriority[] = ["urgent", "high", "normal"];

/** Task list: quick-add, editable titles, priority styling. */
export function TodoList() {
  const tasks = useLifeOSStore((s) => s.tasks);
  const addTask = useLifeOSStore((s) => s.addTask);
  const updateTaskPriority = useLifeOSStore((s) => s.updateTaskPriority);
  const updateTaskTitle = useLifeOSStore((s) => s.updateTaskTitle);
  const toggleTaskCompletion = useLifeOSStore((s) => s.toggleTaskCompletion);
  const removeTask = useLifeOSStore((s) => s.removeTask);

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!title.trim()) return;
      addTask(title.trim(), priority);
      setTitle("");
      setPriority("normal");
      inputRef.current?.focus();
    },
    [title, priority, addTask]
  );

  const [showAll, setShowAll] = useState(false);
  const sortedByPriority = PRIORITY_ORDER.flatMap((p) =>
    tasks.filter((t) => (t.priority ?? "normal") === p)
  );
  const visibleTasks = showAll
    ? sortedByPriority
    : sortedByPriority.slice(0, MAX_VISIBLE);
  const hasMore = tasks.length > MAX_VISIBLE && !showAll;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900 dark:text-white">
        <ListTodo className="size-6 text-[var(--color-task)]" />
        Tasks
      </h2>

      <ul className="space-y-2">
        {tasks.length === 0 && (
          <li className="text-muted-foreground py-6 text-center text-base">
            No pending tasks
          </li>
        )}
        {visibleTasks.map((t) => (
          <TaskItem
            key={t.id}
            task={t}
            onToggle={toggleTaskCompletion}
            onUpdatePriority={updateTaskPriority}
            onUpdateTitle={updateTaskTitle}
            onRemove={removeTask}
          />
        ))}
        <li>
          <form
            onSubmit={handleSubmit}
            className="flex h-12 min-w-0 items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
          >
            <Input
              ref={inputRef}
              placeholder="Add task…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-full min-w-0 flex-1 rounded-l-xl rounded-r-none border-0 bg-transparent px-4 text-base placeholder:text-muted-foreground/70 shadow-none focus-visible:ring-0"
            />
            <div
              className="flex h-full shrink-0 items-center gap-2 border-l border-slate-200 pl-3 pr-2 dark:border-white/10"
              aria-hidden
            >
              <PrioritySelect
                value={priority}
                onChange={setPriority}
                size="sm"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!title.trim()}
                className="size-8 shrink-0 rounded-lg"
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </form>
        </li>
      </ul>

      {tasks.length > 0 && hasMore && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-4 inline-flex min-h-[44px] items-center gap-1 text-muted-foreground text-base hover:text-foreground"
        >
          View all ({tasks.length}) tasks
        </button>
      )}
    </div>
  );
}
