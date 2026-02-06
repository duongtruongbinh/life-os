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
    <div className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 text-base font-bold tracking-tight text-slate-900 dark:text-white group">
        <ListTodo className="size-5 text-[var(--color-task)] icon-hover-scale" />
        Tasks
      </h2>

      {/* Add task form - moved to top */}
      <form
        onSubmit={handleSubmit}
        className="flex h-11 min-w-0 items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-spring hover:shadow-md card-glow-task dark:border-white/10 dark:bg-white/[0.04]"
      >
        <Input
          ref={inputRef}
          placeholder="Add task…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-full min-w-0 flex-1 rounded-l-xl rounded-r-none border-0 bg-transparent px-3 text-sm placeholder:text-muted-foreground/70 shadow-none focus-visible:ring-0"
        />
        <div
          className="flex h-full shrink-0 items-center gap-1.5 border-l border-slate-200 pl-2 pr-1.5 dark:border-white/10"
          aria-hidden
        >
          <PrioritySelect
            value={priority}
            onChange={setPriority}
            size="sm"
          />
          <Button
            type="submit"
            size="icon-xs"
            disabled={!title.trim()}
            className="size-7 shrink-0 rounded-lg"
          >
            <Plus className="size-3.5" />
          </Button>
        </div>
      </form>

      {/* Task list */}
      <ul className="space-y-1.5 animate-stagger">
        {tasks.length === 0 && (
          <li className="text-muted-foreground py-4 text-center text-sm">
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
      </ul>

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
