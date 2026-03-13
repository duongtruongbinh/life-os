"use client";

import { useState, useRef, useEffect, memo, useCallback } from "react";
import { Trash2, Check, Pencil, X, Calendar } from "lucide-react";
import { m, useMotionValue, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PrioritySelect } from "@/components/ui/priority-select";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import type { Task, TaskPriority } from "@/types/database";
import { cn } from "@/lib/utils";
import { safeFormatTaskDate, isTaskOverdue, isTaskDueToday } from "@/lib/date-utils";

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
  onUpdateDueDate?: (id: string, dueDate: string | null) => void;
  onRemove: (id: string) => void;
  className?: string;
  compact?: boolean;
};

export const TaskItem = memo(function TaskItem({
  task,
  onToggle,
  onUpdatePriority,
  onUpdateTitle,
  onUpdateDueDate,
  onRemove,
  className,
  compact = false,
}: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const priority = (task.priority ?? "normal") as TaskPriority;

  // Swipe logic
  const x = useMotionValue(0);
  const opacityRight = useTransform(x, [50, 100], [0, 1]); // Complete icon opacity
  const opacityLeft = useTransform(x, [-50, -100], [0, 1]); // Delete icon opacity
  const bgRight = useTransform(x, [0, 100], ["rgba(16, 185, 129, 0)", "rgba(16, 185, 129, 1)"]);
  const bgLeft = useTransform(x, [0, -100], ["rgba(244, 63, 94, 0)", "rgba(244, 63, 94, 1)"]);

  const handleDragEnd = () => {
    const currentX = x.get();
    if (currentX > 100) {
      if (!task.is_completed) onToggle(task.id, false);
    } else if (currentX < -100) {
      onRemove(task.id);
    }
  };

  // Input focus is handled dynamically if we use `autoFocus` or ref callbacks instead,
  // but to avoid the `useEffect` cascade entirely:

  useEffect(() => {
    // Reset position if task state changes (e.g. undone externally)
    // Actually framer motion drag snap back handles this, but if we want to confirm action 
    // we generally let it snap back.
  }, [task.is_completed]);

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
    <li className={cn("relative group", compact ? "mb-1" : "mb-3", className)}>
      {/* Background Layer for Swipe Actions */}
      <div className="absolute inset-0 rounded-xl flex items-center justify-between overflow-hidden">
        {/* Swipe Right Background (Complete) */}
        <m.div
          style={{ backgroundColor: bgRight, opacity: opacityRight }}
          className="flex items-center justify-start pl-6 h-full w-full absolute inset-0 z-0 rounded-xl"
        >
          <Check className="text-white size-6 font-bold" strokeWidth={4} />
        </m.div>

        {/* Swipe Left Background (Delete) */}
        <m.div
          style={{ backgroundColor: bgLeft, opacity: opacityLeft }}
          className="flex items-center justify-end pr-6 h-full w-full absolute inset-0 z-0 rounded-xl"
        >
          <Trash2 className="text-white size-6" />
        </m.div>
      </div>

      {/* Foreground Card */}
      <m.div
        layout
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className={cn(
          "relative z-10 flex items-center gap-3 rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-sm dark:border-white/10 dark:bg-zinc-900 dark:hover:border-white/15",
          compact ? "min-h-[44px] px-3 py-2" : "min-h-[52px] px-4 py-3",
          PRIORITY_ROW_STYLES[priority],
          task.is_completed && "opacity-75"
        )}
      >
        <button
          type="button"
          onClick={() => onToggle(task.id, task.is_completed ?? false)}
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full border-2 transition-all btn-glow",
            task.is_completed
              ? "border-emerald-500 bg-emerald-500 text-white shadow-glow-primary dark:text-emerald-100"
              : "border-slate-300 bg-transparent text-transparent hover:border-primary hover:bg-primary/10 hover:text-primary dark:border-white/20 dark:hover:border-primary dark:hover:bg-primary/10 dark:hover:text-primary"
          )}
          aria-label={task.is_completed ? "Mark incomplete" : "Mark complete"}
          // Prevent drag when clicking the checkbox explicitly
          onPointerDownCapture={(e) => e.stopPropagation()}
        >
          <Check
            className={cn(
              "size-4",
              task.is_completed
                ? "opacity-100 text-white dark:text-white"
                : "opacity-0 group-hover:opacity-100"
            )}
            strokeWidth={2.5}
          />
        </button>

        {isEditing ? (
          <div className="flex-1 flex gap-2 w-full min-w-0" onPointerDownCapture={(e) => e.stopPropagation()}>
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
          </div>
        ) : (
          <>
            {/* Priority Select - should stop propagation */}
            <div onPointerDownCapture={(e) => e.stopPropagation()}>
              <PrioritySelect
                value={priority}
                onChange={(v) => onUpdatePriority(task.id, v)}
                size="icon"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setEditTitle(task.title);
                setIsEditing(true);
                // Delay focus to let React render the input
                setTimeout(() => inputRef.current?.focus(), 0);
              }}
              className="min-w-0 flex-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:rounded-md select-none"
            // Do NOT stop propagation here so users can drag the text area
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

            {/* Due Date Picker - Interactive */}
            <div onPointerDownCapture={(e) => e.stopPropagation()}>
              <DateTimePicker
                value={task.due_date}
                onChange={(iso) => onUpdateDueDate?.(task.id, iso)}
              >
                {task.due_date && !task.is_completed ? (() => {
                  const overdue = isTaskOverdue(task.due_date);
                  const dueToday = isTaskDueToday(task.due_date);
                  const formatted = safeFormatTaskDate(task.due_date);
                  return (
                    <Button
                      variant={dueToday ? "secondary" : "outline"}
                      size="sm"
                      className={cn(
                        "h-6 gap-1.5 rounded-md px-2 text-xs font-medium border transition-colors",
                        overdue
                          ? "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 hover:text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50"
                          : dueToday
                            ? "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 hover:text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
                      )}
                    >
                      <Calendar className="size-3.5" />
                      {overdue ? "Overdue" : dueToday ? "Today" : formatted}
                    </Button>
                  );
                })() : (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className={cn(
                      "h-8 w-8 text-foreground transition-all hover:bg-muted",
                      !task.due_date && "opacity-0 group-hover:opacity-100"
                    )}
                  >
                    <Calendar className="size-4" />
                  </Button>
                )}
              </DateTimePicker>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-9 shrink-0 rounded-xl opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted hover:text-foreground md:flex hidden"
              onClick={() => {
                setEditTitle(task.title);
                setIsEditing(true);
                setTimeout(() => inputRef.current?.focus(), 0);
              }}
              aria-label="Edit task"
              onPointerDownCapture={(e) => e.stopPropagation()}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-9 shrink-0 rounded-xl opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/20 hover:text-destructive md:flex hidden"
              onClick={() => onRemove(task.id)}
              aria-label="Remove task"
              onPointerDownCapture={(e) => e.stopPropagation()}
            >
              <Trash2 className="size-4" />
            </Button>
          </>
        )}
      </m.div>
    </li >
  );
});
