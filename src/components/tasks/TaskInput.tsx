"use client";

import { useState, useRef, useCallback } from "react";
import { Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PrioritySelect } from "@/components/ui/priority-select";
import { DatePicker } from "@/components/ui/date-picker";
import { useLifeOSStore } from "@/store/useLifeOSStore";
import type { TaskPriority } from "@/types/database";
import { cn } from "@/lib/utils";

interface TaskInputProps {
    className?: string;
    autoFocus?: boolean;
}

export function TaskInput({ className, autoFocus }: TaskInputProps) {
    const addTask = useLifeOSStore((s) => s.addTask);
    const updateTaskDueDate = useLifeOSStore((s) => s.updateTaskDueDate);

    const [title, setTitle] = useState("");
    const [priority, setPriority] = useState<TaskPriority>("normal");
    const [dueDate, setDueDate] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            if (!title.trim()) return;

            addTask(title.trim(), priority);

            // Set due date after adding if provided
            if (dueDate) {
                setTimeout(() => {
                    const latest = useLifeOSStore.getState().tasks;
                    const newTask = latest.find((t) => t.title === title.trim() && !t.is_completed);
                    if (newTask) updateTaskDueDate(newTask.id, dueDate);
                }, 50);
            }

            setTitle("");
            setPriority("normal");
            setDueDate("");
            inputRef.current?.focus();
        },
        [title, priority, dueDate, addTask, updateTaskDueDate]
    );

    return (
        <form
            onSubmit={handleSubmit}
            className={cn(
                "flex h-11 min-w-0 items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-white/10 dark:bg-white/[0.04]",
                "focus-within:ring-2 focus-within:ring-primary/20",
                className
            )}
        >
            <Input
                ref={inputRef}
                autoFocus={autoFocus}
                placeholder="Add a new task..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-full min-w-0 flex-1 rounded-l-xl rounded-r-none border-0 bg-transparent px-3 text-sm placeholder:text-muted-foreground/70 shadow-none focus-visible:ring-0"
            />

            <div
                className="flex h-full shrink-0 items-center gap-1.5 pl-2 pr-1.5"
                aria-hidden
            >
                <PrioritySelect
                    value={priority}
                    onChange={setPriority}
                    size="sm"
                />

                <DatePicker
                    date={dueDate ? new Date(dueDate) : undefined}
                    setDate={(d) => setDueDate(d ? d.toISOString().slice(0, 10) : "")}
                >
                    <Button type="button" size="icon-xs" variant="ghost" className="size-7">
                        <Calendar className={cn("size-3.5", dueDate ? "text-primary" : "text-muted-foreground")} />
                    </Button>
                </DatePicker>

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
    );
}
