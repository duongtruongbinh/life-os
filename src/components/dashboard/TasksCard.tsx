"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLifeOSStore } from "@/store/useLifeOSStore";
import { EmptyState } from "@/components/ui/empty-state";
import { TaskPriority } from "@/types/database";
import { TaskInput } from "@/components/tasks/TaskInput";
import { TaskItem } from "@/components/tasks/TaskItem";

const PRIORITY_ORDER: TaskPriority[] = ["urgent", "high", "normal"];

export function TasksCard() {
    const tasks = useLifeOSStore((s) => s.tasks);

    const toggleTaskCompletion = useLifeOSStore((s) => s.toggleTaskCompletion);
    const removeTask = useLifeOSStore((s) => s.removeTask);
    const updateTaskPriority = useLifeOSStore((s) => s.updateTaskPriority);
    const updateTaskTitle = useLifeOSStore((s) => s.updateTaskTitle);
    const updateTaskDueDate = useLifeOSStore((s) => s.updateTaskDueDate);



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
            {/* Add Task Component */}
            <div className="px-1 pb-1">
                <TaskInput />
            </div>

            {/* Task List */}
            <ul className="flex flex-col gap-1 overflow-y-auto pr-1 flex-1 min-h-0 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                    {topTasks.length === 0 ? (
                        <EmptyState
                            icon={Sun}
                            title="All caught up!"
                            description="Enjoy your free time."
                        />
                    ) : (
                        topTasks.map((t) => (
                            <TaskItem
                                key={t.id}
                                task={t}
                                onToggle={toggleTaskCompletion}
                                onUpdatePriority={updateTaskPriority}
                                onUpdateTitle={updateTaskTitle}
                                onUpdateDueDate={updateTaskDueDate}
                                onRemove={removeTask}
                            />
                        ))
                    )}
                </AnimatePresence>
            </ul>
        </motion.div >
    );
}
