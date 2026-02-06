"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Target, Dumbbell, Flame, Sprout } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLifeOSStore, calculateCurrentStreak } from "@/store/useLifeOSStore";
import { getHabitIcon } from "@/lib/habit-icons";
import { getLocalDateKey } from "@/lib/date-utils";
import { EmptyState } from "@/components/ui/empty-state";

export function WellnessCard() {
    const dailyLog = useLifeOSStore((s) => s.dailyLog);
    const habitDefinitions = useLifeOSStore((s) => s.habitDefinitions);
    const dailyLogsLast365 = useLifeOSStore((s) => s.dailyLogsLast365);
    const toggleHabit = useLifeOSStore((s) => s.toggleHabit);

    const todayKey = getLocalDateKey();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bento-tile flex flex-col p-0 overflow-hidden h-full bg-white dark:bg-white/5 shadow-sm hover:shadow-md transition-all border border-slate-200 dark:border-white/10"
        >
            {/* Habits Section */}
            <div className="flex-1 flex flex-col p-4 border-b border-border/50">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                        <Target className="size-4 text-[var(--color-habit)]" />
                        Habits
                    </h2>
                    <Link
                        href="/habits"
                        className="text-[10px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-wider transition-colors"
                    >
                        History
                    </Link>
                </div>

                <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                    {habitDefinitions.length === 0 ? (
                        <EmptyState
                            icon={Sprout}
                            title="Start fresh"
                            description="Add habits to track your progress."
                            className="py-6"
                        />
                    ) : (habitDefinitions.slice(0, 5).map((h) => {
                        const Icon = getHabitIcon(h.icon);
                        const color = h.color || "currentColor";
                        const isDone = dailyLog.habits_status?.[h.id] ?? false;
                        const streak = calculateCurrentStreak(h.id, dailyLogsLast365, todayKey);

                        return (
                            <motion.button
                                key={h.id}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => toggleHabit(h.id)}
                                className={cn(
                                    "flex items-center gap-3 rounded-xl border p-2.5 transition-all text-left group/habit",
                                    isDone
                                        ? "bg-[var(--color-habit)]/10 border-[var(--color-habit)]/20"
                                        : "bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-white/5"
                                )}
                            >
                                <div
                                    className={cn(
                                        "size-8 rounded-full flex items-center justify-center transition-all duration-300 shrink-0",
                                        isDone
                                            ? "bg-[var(--color-habit)] text-white shadow-md shadow-[var(--color-habit)]/20"
                                            : "bg-slate-100 dark:bg-white/10 text-muted-foreground group-hover/habit:scale-110"
                                    )}
                                >
                                    <Icon className="size-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={cn(
                                        "text-xs font-semibold leading-tight truncate transition-colors",
                                        isDone ? "text-[var(--color-habit)]" : "text-foreground"
                                    )}>
                                        {h.name}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-[10px] text-muted-foreground">
                                            {isDone ? "Completed" : "Tap to complete"}
                                        </p>
                                        {streak > 0 && (
                                            <div className="flex items-center gap-0.5 text-[10px] font-bold text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded-full">
                                                <Flame className="size-3 fill-orange-500" />
                                                <span className="tabular-nums">{streak}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {isDone && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="size-2 rounded-full bg-[var(--color-habit)] shrink-0"
                                    />
                                )}
                            </motion.button>
                        );
                    }))}
                </div>
            </div>

            {/* Pushups Section */}
            <Link
                href="/pushups"
                className="relative p-4 bg-slate-50/50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors group"
            >
                <div className="flex items-center justify-between mb-2 relative z-10">
                    <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground group-hover:text-[var(--color-pushup)] transition-colors">
                        <Dumbbell className="size-3" />
                        Push-ups
                    </h2>
                    <span className="text-xs font-bold text-foreground font-mono">
                        {dailyLog.pushup_count} <span className="text-muted-foreground">/ 50</span>
                    </span>
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden relative z-10">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (dailyLog.pushup_count / 50) * 100)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-[var(--color-pushup)]"
                    />
                </div>

                {/* Confetti or simple decor could go here */}
            </Link>
        </motion.div>
    );
}
