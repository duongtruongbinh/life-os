"use client";

import Link from "next/link";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Moon, Sun, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLifeOSStore } from "@/store/useLifeOSStore";
import { Button } from "@/components/ui/button";
import { calculateDurationHours } from "@/lib/date-utils";

export function SleepCard() {
    const dailyLog = useLifeOSStore((s) => s.dailyLog);
    const setSleepStart = useLifeOSStore((s) => s.setSleepStart);
    const setSleepEnd = useLifeOSStore((s) => s.setSleepEnd);

    const hasSleepStart = !!dailyLog.sleep_start;
    const hasSleepEnd = !!dailyLog.sleep_end;
    const isSleeping = hasSleepStart && !hasSleepEnd;

    const sleepHours = useMemo(
        () => calculateDurationHours(dailyLog.sleep_start, dailyLog.sleep_end),
        [dailyLog.sleep_start, dailyLog.sleep_end]
    );

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className={cn(
                "bento-tile flex flex-col justify-between p-5 h-full relative overflow-hidden transition-all",
                isSleeping
                    ? "border-[var(--color-sleep)]/50 shadow-lg shadow-[var(--color-sleep)]/10"
                    : "hover:border-[var(--color-sleep)]/30 border-slate-200 dark:border-white/10"
            )}
        >
            {/* Background decoration in sleeping state */}
            {isSleeping && (
                <div className="absolute inset-0 bg-[var(--color-sleep)]/10 pointer-events-none" />
            )}

            <div className="flex items-center justify-between relative z-10">
                <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                    <Moon className="size-4 text-[var(--color-sleep)]" />
                    Sleep
                </h2>
                <Link href="/sleep" className="opacity-60 hover:opacity-100 transition-opacity p-1">
                    <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center py-6 relative z-10">
                <div className="text-center">
                    <div className="mb-1 flex items-baseline justify-center gap-1">
                        <motion.span
                            key={isSleeping ? "sleep" : "wake"}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-5xl font-bold tabular-nums text-foreground tracking-tight"
                        >
                            {hasSleepStart && hasSleepEnd ? sleepHours.toFixed(1) : isSleeping ? "Zzz" : "—"}
                        </motion.span>
                        <span className="text-xl font-medium text-muted-foreground">h</span>
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-slate-100 dark:bg-white/10 py-1 px-3 rounded-full inline-block">
                        {isSleeping ? "Sleeping Now" : hasSleepEnd ? "Recorded Today" : "No Data Yet"}
                    </p>
                </div>
            </div>

            <div className="relative z-10">
                <Button
                    size="lg"
                    onClick={() => (isSleeping ? setSleepEnd() : setSleepStart())}
                    className={cn(
                        "w-full h-12 rounded-xl text-sm font-bold uppercase tracking-wider transition-all shadow-sm",
                        isSleeping
                            ? "bg-[var(--color-sleep)] text-white hover:bg-[var(--color-sleep)]/90 hover:shadow-md hover:shadow-[var(--color-sleep)]/20"
                            : "bg-white dark:bg-white/10 text-[var(--color-sleep)] border border-[var(--color-sleep)]/20 hover:border-[var(--color-sleep)] hover:bg-[var(--color-sleep)]/5"
                    )}
                >
                    {isSleeping ? (
                        <>
                            <Sun className="size-4 mr-2" />
                            Wake Up
                        </>
                    ) : (
                        <>
                            <Moon className="size-4 mr-2" />
                            Good Night
                        </>
                    )}
                </Button>
            </div>
        </motion.div>
    );
}
