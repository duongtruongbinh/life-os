"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { m } from "framer-motion";
import { Moon, Sun, ChevronRight, Zap, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLifeOSStore } from "@/store/useLifeOSStore";
import { Button } from "@/components/ui/button";
import { calculateDurationHours, getLogicalDate } from "@/lib/date-utils";
import { useActiveSleepSession } from "@/store/useLifeOSSelectors";
import { mergeLogs } from "@/lib/log-utils";
import { DEFAULT_TARGET_SLEEP_HOURS } from "@/lib/constants";

export function SleepCard() {
    const dailyLog = useLifeOSStore((s) => s.dailyLog);
    const dailyLogsLast7 = useLifeOSStore((s) => s.dailyLogsLast7);
    const modifiedLogs = useLifeOSStore((s) => s.modifiedLogs);
    const userSettings = useLifeOSStore((s) => s.userSettings);
    const setSleepStart = useLifeOSStore((s) => s.setSleepStart);
    const setSleepEnd = useLifeOSStore((s) => s.setSleepEnd);

    const activeSession = useActiveSleepSession();
    const targetHours = userSettings?.target_sleep_hours ?? DEFAULT_TARGET_SLEEP_HOURS;

    // The display source is the active session if one exists, otherwise today's log.
    const displayLog = activeSession?.log || dailyLog;
    const isSleeping = !!activeSession;
    const hasSleepStart = !!displayLog.sleep_start;
    const hasSleepEnd = !!displayLog.sleep_end;

    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        if (!isSleeping) return;
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, [isSleeping]);

    const activeHours = useMemo(() => {
        if (!isSleeping || !displayLog.sleep_start) return 0;
        const start = new Date(displayLog.sleep_start);
        return Math.max(0, (now.getTime() - start.getTime()) / 1000 / 60 / 60);
    }, [isSleeping, displayLog.sleep_start, now]);

    const completedHours = useMemo(
        () => calculateDurationHours(displayLog.sleep_start, displayLog.sleep_end),
        [displayLog.sleep_start, displayLog.sleep_end]
    );

    const sleepHours = isSleeping ? activeHours : completedHours;

    // Constrain percentage between 0 and 100
    const pct = useMemo(
        () => (targetHours > 0 ? Math.min(100, (sleepHours / targetHours) * 100) : 0),
        [sleepHours, targetHours]
    );

    // Calculate Tracked Sleep Debt
    const debtInfo = useMemo(() => {
        const merged = mergeLogs(dailyLogsLast7, { ...modifiedLogs, [dailyLog.date]: dailyLog });
        const daysWithData = merged.filter((l) => l.sleep_start && l.sleep_end);

        let totalSleep = 0;
        for (const log of daysWithData) {
            totalSleep += calculateDurationHours(log.sleep_start, log.sleep_end);
        }

        const expectedSleep = targetHours * Math.max(1, daysWithData.length);
        const debt = Math.max(0, expectedSleep - totalSleep);
        return { debt, hasDebt: debt > 0, hasData: daysWithData.length > 0 };
    }, [dailyLogsLast7, modifiedLogs, dailyLog, targetHours]);

    // SVG parameters
    const size = 120;
    const r = 40;
    const circumference = 2 * Math.PI * r;
    const strokeDashoffset = circumference - (pct / 100) * circumference;
    const isComplete = pct >= 100;

    return (
        <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className={cn(
                "bento-tile bento-tile-enhanced flex flex-col justify-between p-5 h-full relative overflow-hidden transition-all",
                isSleeping
                    ? "border-[var(--color-sleep)]/50 shadow-lg shadow-[var(--color-sleep)]/10"
                    : "border-slate-200 dark:border-white/10"
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

            <div className="flex-1 flex flex-col items-center justify-center py-4 relative z-10">
                <div className="relative size-32 flex items-center justify-center">
                    {/* Glow effect on completion */}
                    {isComplete && !isSleeping && (
                        <div
                            className="absolute inset-0 rounded-full blur-2xl opacity-30"
                            style={{ backgroundColor: "var(--color-sleep)" }}
                        />
                    )}

                    <svg className="absolute inset-0 size-full -rotate-90 overflow-visible" viewBox={`0 0 ${size} ${size}`}>
                        {/* Background track */}
                        <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={r}
                            fill="none"
                            stroke="var(--muted)"
                            strokeWidth={8}
                            className="opacity-20"
                        />
                        {/* Animated progress stroke */}
                        <m.circle
                            cx={size / 2}
                            cy={size / 2}
                            r={r}
                            fill="none"
                            stroke="var(--color-sleep)"
                            strokeWidth={8}
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className={cn(isSleeping && "opacity-80")}
                            style={{
                                filter: isComplete || isSleeping ? "drop-shadow(0 0 6px var(--color-sleep))" : "none",
                            }}
                        />
                        {/* Pulsing indicator when sleeping */}
                        {isSleeping && (
                            <m.circle
                                cx={size / 2}
                                cy={size / 2}
                                r={r}
                                fill="none"
                                stroke="var(--color-sleep)"
                                strokeWidth={8}
                                strokeLinecap="round"
                                strokeDasharray={`${circumference * 0.25} ${circumference * 0.75}`}
                                animate={{ rotate: 360 }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                style={{ transformOrigin: "50% 50%" }}
                            />
                        )}
                    </svg>

                    <div className="text-center z-10">
                        <m.span
                            key={isSleeping ? "sleep" : "wake"}
                            initial={{ y: 5, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="text-4xl font-bold tabular-nums text-foreground block tracking-tight"
                            style={{ color: isComplete ? "var(--color-sleep)" : "var(--foreground)" }}
                        >
                            {hasSleepStart || hasSleepEnd || isSleeping ? sleepHours.toFixed(1) : "—"}
                        </m.span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            {isSleeping ? "SLEEPING" : "HOURS"}
                        </span>
                    </div>
                </div>

                {/* Sub-label: Sleep Debt Indicator */}
                {debtInfo.hasData && (
                    <div className={cn(
                        "mt-4 flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        debtInfo.hasDebt
                            ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                    )}>
                        {debtInfo.hasDebt ? (
                            <>
                                <AlertTriangle className="size-3" />
                                <span>{debtInfo.debt.toFixed(1)}h Debt</span>
                            </>
                        ) : (
                            <>
                                <Zap className="size-3" />
                                <span>Fully Rested</span>
                            </>
                        )}
                    </div>
                )}
                {!debtInfo.hasData && !hasSleepStart && (
                    <p className="mt-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-slate-100 dark:bg-white/10 py-1 px-3 rounded-full">
                        No Data Yet
                    </p>
                )}
            </div>

            <div className="relative z-10">
                <Button
                    size="lg"
                    onClick={() => {
                        if (isSleeping && activeSession) {
                            setSleepEnd(activeSession.date);
                        } else {
                            setSleepStart(getLogicalDate());
                        }
                    }}
                    className={cn(
                        "w-full h-12 rounded-2xl text-sm font-bold uppercase tracking-wider shadow-sm btn-glow transition-all",
                        isSleeping
                            ? "bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20"
                            : "bg-white dark:bg-white/10 text-[var(--color-sleep)] border border-[var(--color-sleep)]/20 hover:bg-[var(--color-sleep)]/5"
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
        </m.div>
    );
}
