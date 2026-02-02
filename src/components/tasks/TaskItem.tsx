"use client";

import { useState, useRef, useEffect, memo, useCallback } from "react";
import { Trash2, Check, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PrioritySelect } from "@/components/ui/priority-select";
import type { Task, TaskPriority } from "@/types/database";
import { cn } from "@/lib/utils";

const PRIORITY_ROW_STYLES: Record<TaskPriority, string> = {
  urgent:
    "bg-rose-50/70 border-l-4 border-l-rose-600 dark:bg-rose-950/25 dark:border-l-rose-500",
  high:
    "bg-amber-50/70 border-l-4 border-l-amber-500 dark:bg-amber-950/20 dark:border-l-amber-400",
  normal:
    "bg-slate-50/50 border-l-4 border-l-slate-300 dark:bg-slate-950/15 dark:border-l-slate-600",
};

export type TaskItemProps = {
  task: Task;
  onToggle: (id: string, isCompleted: boolean) => void;
  onUpdatePriority: (id: string, priority: TaskPriority) => void;
  onUpdateTitle: (id: string, newTitle: string) => void;
  onRemove: (id: string) => void;
};

export const TaskItem = memo(function TaskItem({
  task,
  onToggle,
  onUpdatePriority,
  onUpdateTitle,
  onRemove,
}: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const priority = (task.priority ?? "normal") as TaskPriority;

  useEffect(() => {
    if (isEditing) {
      setEditTitle(task.title);
      inputRef.current?.focus();
    }
  }, [isEditing, task.title]);

  const handleSave = useCallback(() => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== task.title) {
      onUpdateTitle(task.id, trimmed);
    }
    setIsEditing(false);
  }, [editTitle, task.id, task.title, onUpdateTitle]);

  const handleCancel = useCallback(() => {
    setEditTitle(task.title);
    setIsEditing(false);
  }, [task.title]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSave();
      }
      if (e.key === "Escape") {
        handleCancel();
      }
    },
    [handleSave, handleCancel]
  );

  return (
    <li
      className={cn(
        "group flex min-h-[52px] items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition-all dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-white/15 dark:hover:bg-white/[0.06]",
        PRIORITY_ROW_STYLES[priority],
        task.is_completed && "opacity-75"
      )}
    >
      <button
        type="button"
        onClick={() => onToggle(task.id, task.is_completed)}
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full border-2 transition-all",
          task.is_completed
            ? "border-emerald-500 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
            : "border-slate-300 bg-transparent text-transparent hover:border-primary hover:bg-primary/10 hover:text-primary dark:border-white/20 dark:hover:border-primary dark:hover:bg-primary/10 dark:hover:text-primary"
        )}
        aria-label={task.is_completed ? "Mark incomplete" : "Mark complete"}
      >
        <Check
          className={cn(
            "size-4",
            task.is_completed
              ? "opacity-100 text-emerald-600 dark:text-emerald-400"
              : "opacity-0 group-hover:opacity-100"
          )}
          strokeWidth={2.5}
        />
      </button>

      {isEditing ? (
        <>
          <Input
            ref={inputRef}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="input-lifeos min-h-[40px] flex-1 min-w-0 rounded-lg border-slate-200 bg-slate-50 py-2 text-base dark:border-white/10 dark:bg-white/5"
            aria-label="Edit task title"
          />
          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-9 shrink-0 rounded-xl text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
              onClick={handleSave}
              aria-label="Save"
            >
              <Check className="size-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-9 shrink-0 rounded-xl text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
              onClick={handleCancel}
              aria-label="Cancel"
            >
              <X className="size-4" />
            </Button>
          </div>
        </>
      ) : (
        <>
          <PrioritySelect
            value={priority}
            onChange={(v) => onUpdatePriority(task.id, v)}
            size="icon"
          />
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="min-w-0 flex-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:rounded-md"
          >
            <span
              className={cn(
                "block truncate text-base font-medium text-foreground",
                task.is_completed && "text-muted-foreground line-through"
              )}
            >
              {task.title}
            </span>
          </button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-9 shrink-0 rounded-xl opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted hover:text-foreground"
            onClick={() => setIsEditing(true)}
            aria-label="Edit task"
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-9 shrink-0 rounded-xl opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/20 hover:text-destructive"
            onClick={() => onRemove(task.id)}
            aria-label="Remove task"
          >
            <Trash2 className="size-4" />
          </Button>
        </>
      )}
    </li>
  );
});
