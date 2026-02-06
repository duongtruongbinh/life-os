"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, CheckSquare, Trash2, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLifeOSStore } from "@/store/useLifeOSStore";
import { TaskPriority } from "@/types/database";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PrioritySelect } from "@/components/ui/priority-select";

const PRIORITY_ORDER: TaskPriority[] = ["urgent", "high", "normal"];

export function TasksCard() {
    const tasks = useLifeOSStore((s) => s.tasks);
    const addTask = useLifeOSStore((s) => s.addTask);
    const toggleTaskCompletion = useLifeOSStore((s) => s.toggleTaskCompletion);
    const removeTask = useLifeOSStore((s) => s.removeTask);

    const [taskTitle, setTaskTitle] = useState("");
    const [taskPriority, setTaskPriority] = useState<TaskPriority>("normal");
    const inputRef = useRef<HTMLInputElement>(null);

    const tasksRemaining = tasks.filter((t) => !t.is_completed).length;

    const topTasks = tasks
        .filter((t) => !t.is_completed)
        .sort((a, b) => {
            // Sort by priority first
            const pA = a.priority ?? "normal";
            const pB = b.priority ?? "normal";
            if (pA === pB) return 0;
            if (pA === "urgent") return -1;
            if (pB === "urgent") return 1;
            if (pA === "high") return -1;
            if (pB === "high") return 1;
            return 0;
        })
        .slice(0, 8);

    function handleAddTask(e: React.FormEvent) {
        e.preventDefault();
        if (!taskTitle.trim()) return;
        addTask(taskTitle.trim(), taskPriority);
        setTaskTitle("");
        setTaskPriority("normal");
        inputRef.current?.focus();
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bento-tile flex flex-col gap-4 p-5 h-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10"
        >
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Tasks
                    <span className="text-xs font-normal text-muted-foreground px-2 py-0.5 bg-slate-100 dark:bg-white/10 rounded-full">
                        {tasksRemaining}
                    </span>
                </h2>
                <Link
                    href="/tasks"
                    className="text-xs font-bold text-primary hover:text-primary/80 uppercase tracking-wider transition-colors"
                >
                    View All
                </Link>
            </div>

            {/* Add Task Input */}
            <form
                onSubmit={handleAddTask}
                className="flex items-center gap-2 p-1 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all"
            >
                <Input
                    ref={inputRef}
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="New task..."
                    className="h-9 border-0 bg-transparent shadow-none focus-visible:ring-0 px-3 text-sm"
                />
                <div className="flex items-center gap-1 pr-1">
                    <PrioritySelect value={taskPriority} onChange={setTaskPriority} size="sm" />
                    <Button
                        type="submit"
                        size="icon"
                        className="size-7 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
                    >
                        <Plus className="size-4" />
                    </Button>
                </div>
            </form>

            {/* Task List */}
            <div className="flex flex-col gap-2 overflow-y-auto pr-1 flex-1 min-h-0 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                    {topTasks.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-8 text-muted-foreground/50"
                        >
                            <CheckSquare className="size-10 mb-2 stroke-1" />
                            <p className="text-sm">All caught up!</p>
                        </motion.div>
                    ) : (
                        topTasks.map((t) => {
                            const priorityColor =
                                t.priority === 'urgent' ? 'border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-900/10' :
                                    t.priority === 'high' ? 'border-l-4 border-l-orange-500 bg-orange-50/50 dark:bg-orange-900/10' :
                                        'border-l-4 border-l-slate-300 dark:border-l-slate-700 hover:bg-slate-50 dark:hover:bg-white/5';

                            return (
                                <motion.div
                                    key={t.id}
                                    layout
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className={cn(
                                        "group flex items-center gap-3 rounded-r-xl border border-t-slate-100 border-r-slate-100 border-b-slate-100 dark:border-white/5 px-3 py-2.5 transition-all",
                                        priorityColor
                                    )}
                                >
                                    <button
                                        onClick={() => toggleTaskCompletion(t.id, t.is_completed)}
                                        className={cn(
                                            "size-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0",
                                            t.is_completed // Should ideally typically not see completed tasks here due to filter, but good for robustness
                                                ? "bg-primary border-primary"
                                                : "border-slate-300 dark:border-slate-600 hover:border-primary"
                                        )}
                                    >
                                        {t.is_completed && <Plus className="size-3.5 text-white rotate-45" />}
                                    </button>

                                    <span className="flex-1 truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                                        {t.title}
                                    </span>

                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => removeTask(t.id)}
                                            className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                                        >
                                            <Trash2 className="size-3.5" />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>
        </motion.div >
    );
}
