"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLifeOSStore } from "@/store/useLifeOSStore";
import { EmptyState } from "@/components/ui/empty-state";
import { TaskInput } from "@/components/tasks/TaskInput";
import { TaskItem } from "@/components/tasks/TaskItem";
import { useTaskView } from "@/hooks/useTaskView";

export function TasksCard({ className, hideHeaderLink = false }: { className?: string; hideHeaderLink?: boolean }) {
    const tasks = useLifeOSStore((s) => s.tasks);
    const toggleTaskCompletion = useLifeOSStore((s) => s.toggleTaskCompletion);
    const removeTask = useLifeOSStore((s) => s.removeTask);
    const updateTaskPriority = useLifeOSStore((s) => s.updateTaskPriority);
    const updateTaskTitle = useLifeOSStore((s) => s.updateTaskTitle);
    const updateTaskDueDate = useLifeOSStore((s) => s.updateTaskDueDate);

    const [isCompletedExpanded, setIsCompletedExpanded] = useState(false);

    const { activeTasks, completedTasks, pendingCount } = useTaskView(tasks);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className={cn("bento-tile bento-tile-enhanced flex flex-col gap-2 p-4 h-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10", className)}
        >
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Tasks
                    <span className="text-xs font-normal text-muted-foreground px-2 py-0.5 bg-slate-100 dark:bg-white/10 rounded-full">
                        {pendingCount}
                    </span>
                </h2>
                {!hideHeaderLink && (
                    <Link
                        href="/tasks"
                        className="text-xs font-bold text-primary hover:text-primary/80 uppercase tracking-wider transition-colors"
                    >
                        View All
                    </Link>
                )}
            </div>

            {/* Task Input */}
            <div className="px-1 pb-2">
                <TaskInput />
            </div>

            {/* Task List */}
            <div className="flex flex-col flex-1 min-h-0 overflow-y-auto scrollbar-unified pr-1">
                <div className="flex flex-col gap-0.5">
                    <AnimatePresence mode="popLayout" initial={false}>
                        {activeTasks.length === 0 && completedTasks.length === 0 ? (
                            <EmptyState
                                icon={Sun}
                                title="All caught up!"
                                description="Enjoy your free time."
                            />
                        ) : (
                            activeTasks.map((t) => (
                                <TaskItem
                                    key={t.id}
                                    task={t}
                                    onToggle={toggleTaskCompletion}
                                    onUpdatePriority={updateTaskPriority}
                                    onUpdateTitle={updateTaskTitle}
                                    onUpdateDueDate={updateTaskDueDate}
                                    onRemove={removeTask}
                                    compact={true}
                                />
                            ))
                        )}
                    </AnimatePresence>
                </div>

                {completedTasks.length > 0 && (
                    <div className="mt-2 text-center">
                        <button
                            onClick={() => setIsCompletedExpanded(!isCompletedExpanded)}
                            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground/70 hover:text-foreground transition-colors py-2 px-3 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 group select-none"
                        >
                            <span className="flex items-center gap-1.5">
                                <motion.div
                                    animate={{ rotate: isCompletedExpanded ? 90 : 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <ChevronRight className="size-3.5" />
                                </motion.div>
                                <span>Completed ({completedTasks.length})</span>
                            </span>
                        </button>

                        <AnimatePresence>
                            {isCompletedExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    className="flex flex-col gap-0.5 overflow-hidden text-left"
                                >
                                    <div className="pt-1 pb-2">
                                        {completedTasks.map((t) => (
                                            <TaskItem
                                                key={t.id}
                                                task={t}
                                                onToggle={toggleTaskCompletion}
                                                onUpdatePriority={updateTaskPriority}
                                                onUpdateTitle={updateTaskTitle}
                                                onUpdateDueDate={updateTaskDueDate}
                                                onRemove={removeTask}
                                                compact={true}
                                                className="opacity-50 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
                                            />
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </motion.div >
    );
}
