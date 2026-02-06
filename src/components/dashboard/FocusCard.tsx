"use client";


import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Target, ChevronRight, Play, Square, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLifeOSStore } from "@/store/useLifeOSStore";
import { Button } from "@/components/ui/button";

export function FocusCard() {
    const dailyLog = useLifeOSStore((s) => s.dailyLog);
    const setFocusStart = useLifeOSStore((s) => s.setFocusStart);
    const setFocusEnd = useLifeOSStore((s) => s.setFocusEnd);

    const isFocusing = !!dailyLog.focus_start;
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        if (!isFocusing) return;
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, [isFocusing]);

    const activeMinutes = useMemo(() => {
        if (!isFocusing || !dailyLog.focus_start) return 0;
        const start = new Date(dailyLog.focus_start);
        return Math.max(0, (now.getTime() - start.getTime()) / 1000 / 60);
    }, [isFocusing, dailyLog.focus_start, now]);

    const focusHours = ((dailyLog.focus_minutes || 0) + activeMinutes) / 60;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className={cn(
                "bento-tile flex flex-col justify-between p-5 h-full relative overflow-hidden transition-all",
                isFocusing
                    ? "border-[var(--color-focus)]/50 shadow-lg shadow-[var(--color-focus)]/10"
                    : "hover:border-[var(--color-focus)]/30 border-slate-200 dark:border-white/10"
            )}
        >
            {/* Background decoration in focusing state */}
            {isFocusing && (
                <div className="absolute inset-0 bg-[var(--color-focus)]/5 pointer-events-none" />
            )}

            <div className="flex items-center justify-between relative z-10">
                <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                    <Target className="size-4 text-[var(--color-focus)]" />
                    Focus
                </h2>
                <Link href="/focus" className="opacity-60 hover:opacity-100 transition-opacity p-1">
                    <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center py-6 relative z-10">
                <div className="relative size-32 flex items-center justify-center">
                    {/* Static Ring */}
                    <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-white/5" />

                    {/* Animated Ring */}
                    {isFocusing && (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 rounded-full border-4 border-[var(--color-focus)] border-t-transparent border-l-transparent opacity-80"
                        />
                    )}

                    <div className="text-center z-10">
                        <motion.span
                            key={isFocusing ? "active" : "inactive"}
                            initial={{ y: 5, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="text-4xl font-bold tabular-nums text-foreground block tracking-tight"
                        >
                            {focusHours.toFixed(1)}
                        </motion.span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            HOURS
                        </span>
                    </div>
                </div>
            </div>

            <div className="relative z-10">
                <Button
                    size="lg"
                    onClick={() => (isFocusing ? setFocusEnd() : setFocusStart())}
                    className={cn(
                        "w-full h-12 rounded-xl text-sm font-bold uppercase tracking-wider transition-all shadow-sm",
                        isFocusing
                            ? "bg-[var(--color-focus)] text-white hover:bg-[var(--color-focus)]/90 hover:shadow-md hover:shadow-[var(--color-focus)]/20"
                            : "bg-white dark:bg-white/10 text-[var(--color-focus)] border border-[var(--color-focus)]/20 hover:border-[var(--color-focus)] hover:bg-[var(--color-focus)]/5"
                    )}
                >
                    {isFocusing ? (
                        <>
                            <Square className="size-4 mr-2 fill-current" />
                            Stop Session
                        </>
                    ) : (
                        <>
                            <Play className="size-4 mr-2 fill-current" />
                            Start Focus
                        </>
                    )}
                </Button>
            </div>
        </motion.div>
    );
}
