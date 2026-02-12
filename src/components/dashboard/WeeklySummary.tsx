"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, TrendingDown, Minus, Target, Moon, Dumbbell, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLifeOSStore } from "@/store/useLifeOSStore";
import { calculateWeeklyMetrics, type WeeklyMetricData } from "@/lib/analytics";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const WellnessRadar = dynamic(
    () => import("@/components/dashboard/WellnessRadar").then((m) => m.WellnessRadar),
    { ssr: false, loading: () => <Skeleton className="h-full w-full rounded-full" /> }
);

interface WeeklyMetric extends WeeklyMetricData {
    icon: React.ElementType;
    color: string;
}

function TrendIndicator({ change }: { change: number | null }) {
    if (change === null) return null;

    const Icon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;
    const color = change > 0 ? "text-green-500" : change < 0 ? "text-red-500" : "text-muted-foreground";

    return (
        <div className={cn("flex items-center gap-0.5 text-[10px] font-bold", color)}>
            <Icon className="size-3" />
            <span>{change > 0 ? "+" : ""}{change.toFixed(0)}%</span>
        </div>
    );
}

// Icon + color mapping by metric label
const METRIC_STYLE: Record<string, { icon: React.ElementType; color: string }> = {
    Focus: { icon: Target, color: "var(--color-focus)" },
    "Sleep Avg": { icon: Moon, color: "var(--color-sleep)" },
    Pushups: { icon: Dumbbell, color: "var(--color-pushup)" },
    Habits: { icon: CheckCircle2, color: "var(--color-habit)" },
};

export function WeeklySummary({ className }: { className?: string }) {
    const dailyLogsLast7 = useLifeOSStore((s) => s.dailyLogsLast7);
    const dailyLogsLast28 = useLifeOSStore((s) => s.dailyLogsLast28);
    const modifiedLogs = useLifeOSStore((s) => s.modifiedLogs);
    const dailyLog = useLifeOSStore((s) => s.dailyLog);
    const habitDefinitions = useLifeOSStore((s) => s.habitDefinitions);

    const metrics = useMemo<WeeklyMetric[]>(() => {
        const raw = calculateWeeklyMetrics({
            dailyLogsLast7,
            dailyLogsLast28,
            modifiedLogs,
            dailyLog,
            habitDefinitions,
        });

        return raw.map((m) => ({
            ...m,
            ...(METRIC_STYLE[m.label] ?? { icon: Target, color: "var(--color-focus)" }),
        }));
    }, [dailyLogsLast7, dailyLogsLast28, modifiedLogs, dailyLog, habitDefinitions]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={cn("bento-tile p-4 flex gap-4 overflow-hidden relative", className)}
        >
            {/* Left Column: Header + Metrics */}
            <div className="w-[50%] flex flex-col gap-3 min-w-0 justify-center z-10">
                <div className="flex items-center gap-2">
                    <BarChart3 className="size-5 text-primary" />
                    <h2 className="text-sm font-bold text-foreground">Weekly Overview</h2>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    {metrics.map((metric) => (
                        <div key={metric.label} className="flex flex-col justify-center p-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-1.5 mb-1">
                                <metric.icon className="size-3" style={{ color: metric.color }} />
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide truncate">
                                    {metric.label}
                                </span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <p className="text-xl font-bold tabular-nums tracking-tight leading-none" style={{ color: metric.color }}>
                                    {metric.value}
                                </p>
                                <TrendIndicator change={metric.change} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Column: Radar Chart (Maximized) */}
            <div className="flex-1 h-full min-w-0 -my-4 -mr-4 absolute right-0 top-0 bottom-0 w-[55%]">
                <WellnessRadar minimal />
            </div>
        </motion.div>
    );
}
