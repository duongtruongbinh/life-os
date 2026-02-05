"use client";

import { useMemo } from "react";
import { Moon, AlertTriangle, CheckCircle2, Coffee } from "lucide-react";
import { useLifeOSStore } from "@/store/useLifeOSStore";
import { calculateDurationHours } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

type SleepQuality = "insufficient" | "fair" | "optimal" | "excessive";

interface QualityConfig {
    label: string;
    color: string;
    bgColor: string;
    icon: React.ElementType;
}

const QUALITY_CONFIG: Record<SleepQuality, QualityConfig> = {
    insufficient: {
        label: "Insufficient",
        color: "text-red-500",
        bgColor: "bg-red-500/10 border-red-500/20",
        icon: AlertTriangle,
    },
    fair: {
        label: "Fair",
        color: "text-amber-500",
        bgColor: "bg-amber-500/10 border-amber-500/20",
        icon: Coffee,
    },
    optimal: {
        label: "Optimal",
        color: "text-emerald-500",
        bgColor: "bg-emerald-500/10 border-emerald-500/20",
        icon: CheckCircle2,
    },
    excessive: {
        label: "Excessive",
        color: "text-blue-500",
        bgColor: "bg-blue-500/10 border-blue-500/20",
        icon: Moon,
    },
};

function getSleepQuality(hours: number): SleepQuality {
    if (hours < 6) return "insufficient";
    if (hours < 7) return "fair";
    if (hours <= 9) return "optimal";
    return "excessive";
}

/** Card showing sleep quality based on duration with color coding. */
export function SleepScoreCard() {
    const dailyLog = useLifeOSStore((s) => s.dailyLog);

    const { hours, quality } = useMemo(() => {
        const hours = calculateDurationHours(dailyLog.sleep_start, dailyLog.sleep_end);
        return { hours, quality: getSleepQuality(hours) };
    }, [dailyLog.sleep_start, dailyLog.sleep_end]);

    const config = QUALITY_CONFIG[quality];
    const Icon = config.icon;
    const hasData = dailyLog.sleep_start && dailyLog.sleep_end;

    if (!hasData) {
        return (
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-white/10 bg-white/5 px-4 py-3">
                <Moon className="size-5 text-muted-foreground" />
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-muted-foreground">Sleep Quality</span>
                    <span className="text-xs text-muted-foreground">No data yet</span>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("flex items-center gap-3 rounded-xl border px-4 py-3", config.bgColor)}>
            <Icon className={cn("size-5", config.color)} />
            <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">Sleep Quality</span>
                <div className="flex items-baseline gap-2">
                    <span className={cn("text-lg font-bold", config.color)}>{config.label}</span>
                    <span className="text-xs text-muted-foreground">{hours.toFixed(1)}h</span>
                </div>
            </div>
        </div>
    );
}
