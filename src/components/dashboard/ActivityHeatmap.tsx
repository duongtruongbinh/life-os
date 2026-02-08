"use client";

import { useMemo } from "react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLifeOSStore } from "@/store/useLifeOSStore";
import { cn } from "@/lib/utils";
import { getLastNDateStrings } from "@/lib/date-utils";

export function ActivityHeatmap() {
    const tasks = useLifeOSStore((s) => s.tasks);

    // Generate last 365 days
    const days = useMemo(() => {
        return getLastNDateStrings(364).reverse();
    }, []);

    const activityData = useMemo(() => {
        const counts: Record<string, number> = {};
        tasks.forEach((t) => {
            if (t.is_completed && t.completed_at) {
                const date = t.completed_at.slice(0, 10);
                counts[date] = (counts[date] || 0) + 1;
            }
        });
        return counts;
    }, [tasks]);

    const getColor = (count: number) => {
        if (count === 0) return "bg-slate-100 dark:bg-white/5";
        if (count <= 2) return "bg-emerald-200 dark:bg-emerald-900/40";
        if (count <= 4) return "bg-emerald-300 dark:bg-emerald-800/60";
        if (count <= 6) return "bg-emerald-400 dark:bg-emerald-600/80";
        return "bg-emerald-500 dark:bg-emerald-500";
    };

    return (
        <div className="w-full overflow-x-auto pb-2 custom-scrollbar">
            <div className="min-w-[700px] p-4 bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    Activity
                    <span className="text-xs font-normal text-muted-foreground">Last 365 days</span>
                </h3>
                <div className="flex gap-1">
                    <div className="flex flex-col justify-between text-[9px] text-muted-foreground pt-0 pb-1 h-[88px] pr-2">
                        <span>Mon</span>
                        <span>Wed</span>
                        <span>Fri</span>
                    </div>
                    <div className="flex flex-col flex-wrap h-[90px] gap-1 align-start content-start">
                        {days.map((date) => {
                            const count = activityData[date] || 0;
                            return (
                                <TooltipProvider key={date}>
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <div
                                                className={cn(
                                                    "size-2.5 rounded-[2px] transition-colors cursor-default",
                                                    getColor(count)
                                                )}
                                            />
                                        </TooltipTrigger>
                                        <TooltipContent className="text-xs">
                                            {date}: {count} tasks completed
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
