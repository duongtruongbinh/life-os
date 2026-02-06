"use client";

import { useEffect, useMemo, useState } from "react";
import { differenceInMinutes } from "date-fns";
import { Timer, Square, Play, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useLifeOSStore } from "@/store/useLifeOSStore";
import { FocusDurationChart } from "@/components/focus/FocusDurationChart";
import { DEFAULT_TARGET_FOCUS_HOURS } from "@/lib/constants";
import { getLocalDateKey } from "@/lib/date-utils";

/** Focus tracker: start/stop timer, live duration, manual log, duration chart. */
export function FocusTracker() {
    const dailyLog = useLifeOSStore((s) => s.dailyLog);
    const selectedDate = useLifeOSStore((s) => s.selectedDate);
    const userSettings = useLifeOSStore((s) => s.userSettings);
    const isInitialized = useLifeOSStore((s) => s.isInitialized);
    const loading = useLifeOSStore((s) => s.loading);
    const unsavedChanges = useLifeOSStore((s) => s.unsavedChanges);

    const setFocusStart = useLifeOSStore((s) => s.setFocusStart);
    const setFocusEnd = useLifeOSStore((s) => s.setFocusEnd);
    const addFocusMinutes = useLifeOSStore((s) => s.addFocusMinutes);
    const setFocusMinutesForDate = useLifeOSStore((s) => s.setFocusMinutesForDate);

    const targetHours = userSettings?.target_focus_hours ?? DEFAULT_TARGET_FOCUS_HOURS;
    const isFocusing = !!dailyLog.focus_start;
    const isToday = selectedDate === getLocalDateKey();

    const [now, setNow] = useState<Date>(() => new Date());
    const [manualMinutes, setManualMinutes] = useState("");

    // Timer Mode State
    const [mode, setMode] = useState<"stopwatch" | "timer">("stopwatch");
    const [timerDuration, setTimerDuration] = useState(25); // Minutes
    const [isTimerFinished, setIsTimerFinished] = useState(false);

    useEffect(() => {
        if (!isFocusing || !isToday) return;
        const id = window.setInterval(() => {
            setNow(new Date());
        }, 1000);
        return () => window.clearInterval(id);
    }, [isFocusing, isToday]);

    const elapsedSeconds = useMemo(() => {
        if (!isFocusing || !dailyLog.focus_start) return 0;
        const start = new Date(dailyLog.focus_start);
        return Math.floor((now.getTime() - start.getTime()) / 1000);
    }, [isFocusing, dailyLog.focus_start, now]);

    // Timer Logic
    const remainingSeconds = useMemo(() => {
        if (mode === "stopwatch") return 0;
        const totalSeconds = timerDuration * 60;
        return Math.max(0, totalSeconds - elapsedSeconds);
    }, [mode, timerDuration, elapsedSeconds]);

    const progress = useMemo(() => {
        if (mode === "stopwatch") return 100; // Always full ring for stopwatch
        const total = timerDuration * 60;
        return Math.min(100, (remainingSeconds / total) * 100);
    }, [mode, timerDuration, remainingSeconds]);

    // Format display
    const displayTime = useMemo(() => {
        let sec = mode === "stopwatch" ? elapsedSeconds : remainingSeconds;
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        return { h, m, s };
    }, [mode, elapsedSeconds, remainingSeconds]);

    // ... inside return ...

    <div className="relative flex items-center justify-center mb-6">
        <div className="relative size-48">
            <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-muted/20"
                />
                <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="var(--color-focus)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-linear"
                    strokeDasharray="283"
                    strokeDashoffset={283 - (283 * progress) / 100}
                />
            </svg>
            {mode === "timer" && (
                <div className="absolute inset-4 rounded-full bg-[var(--color-focus)]/5 blur-xl animate-pulse-slow"></div>
            )}
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={cn(
                "flex items-baseline justify-center text-[var(--color-focus)] drop-shadow-sm transition-all duration-300",
                displayTime.h > 0 ? "gap-0.5" : "gap-1"
            )}>
                {displayTime.h > 0 && (
                    <>
                        <span className="text-4xl font-bold tabular-nums leading-none tracking-tight">
                            {displayTime.h}
                        </span>
                        <span className="text-xl font-bold opacity-60 relative -top-3 mx-0.5">:</span>
                    </>
                )}
                <span className={cn(
                    "font-bold tabular-nums leading-none tracking-tight transition-all",
                    displayTime.h > 0 ? "text-4xl" : "text-6xl"
                )}>
                    {displayTime.m.toString().padStart(displayTime.h > 0 ? 2 : 1, "0")}
                </span>
                <span className={cn(
                    "font-bold opacity-60 relative mx-0.5 transition-all",
                    displayTime.h > 0 ? "text-xl -top-3" : "text-2xl -top-4"
                )}>:</span>
                <span className={cn(
                    "font-bold tabular-nums leading-none tracking-tight transition-all",
                    displayTime.h > 0 ? "text-4xl" : "text-6xl"
                )}>
                    {displayTime.s.toString().padStart(2, "0")}
                </span>
            </div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mt-2 opacity-80">
                {mode === "timer" ? "Remaining" : "Elapsed"}
            </p>
        </div>
    </div>

    function toggleFocus() {
        if (isFocusing) {
            setFocusEnd();
            setIsTimerFinished(false);
        } else {
            setFocusStart();
            setIsTimerFinished(false);
        }
    }

    function handleManualAdd(e: React.FormEvent) {
        e.preventDefault();
        const m = parseInt(manualMinutes, 10);
        if (Number.isNaN(m) || m < 1) return;

        if (isToday) {
            addFocusMinutes(m);
        } else {
            const current = dailyLog.focus_minutes || 0;
            setFocusMinutesForDate(selectedDate, current + m);
        }
        setManualMinutes("");
    }

    // Total today
    const totalMinutesToday = (dailyLog.focus_minutes || 0) + (isFocusing ? Math.floor(elapsedSeconds / 60) : 0);
    const totalHrs = (totalMinutesToday / 60).toFixed(1);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
                    <Timer className="size-7 text-[var(--color-focus)]" />
                    Focus
                </h2>
                {!isFocusing && isToday && (
                    <div className="flex bg-slate-100 dark:bg-white/10 p-1 rounded-lg">
                        <button
                            onClick={() => setMode("stopwatch")}
                            className={cn(
                                "px-3 py-1 text-xs font-bold rounded-md transition-all",
                                mode === "stopwatch" ? "bg-white dark:bg-black/40 shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Count Up
                        </button>
                        <button
                            onClick={() => setMode("timer")}
                            className={cn(
                                "px-3 py-1 text-xs font-bold rounded-md transition-all",
                                mode === "timer" ? "bg-[var(--color-focus)] text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Timer
                        </button>
                    </div>
                )}
            </div>

            <div
                className={cn(
                    "flex flex-col gap-4 rounded-2xl border-2 p-5 transition-all duration-300",
                    isFocusing && isToday
                        ? "border-[var(--color-focus)]/80 bg-[var(--color-focus)]/10"
                        : "border-transparent bg-transparent"
                )}
            >
                {(loading || !isInitialized || isFocusing || unsavedChanges) && (
                    <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-muted-foreground">
                        <span>
                            {!isInitialized || loading
                                ? "Syncing data…"
                                : isFocusing && isToday
                                    ? mode === "timer" ? "Timer running" : "Stopwatch running"
                                    : isToday
                                        ? "Ready to focus"
                                        : "Viewing past focus log"}
                        </span>
                        {unsavedChanges && !loading && (
                            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-400">
                                Unsaved changes
                            </span>
                        )}
                    </div>
                )}

                {isFocusing && isToday ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center animate-in fade-in zoom-in-95 duration-500">

                        <div className="relative flex items-center justify-center mb-6">
                            <div className="relative size-48">
                                <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="45"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        className="text-muted/20"
                                    />
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="45"
                                        fill="none"
                                        stroke="var(--color-focus)"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        className="transition-all duration-1000 ease-linear"
                                        strokeDasharray="283"
                                        strokeDashoffset={283 - (283 * progress) / 100}
                                    />
                                </svg>
                                {mode === "timer" && (
                                    <div className="absolute inset-4 rounded-full bg-[var(--color-focus)]/5 blur-xl animate-pulse-slow"></div>
                                )}
                            </div>

                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <div className={cn(
                                    "flex items-baseline justify-center text-[var(--color-focus)] drop-shadow-sm transition-all duration-300",
                                    displayTime.h > 0 ? "gap-0.5" : "gap-1"
                                )}>
                                    {displayTime.h > 0 && (
                                        <>
                                            <span className="text-4xl font-bold tabular-nums leading-none tracking-tight">
                                                {displayTime.h}
                                            </span>
                                            <span className="text-xl font-bold opacity-60 relative -top-3 mx-0.5">:</span>
                                        </>
                                    )}
                                    <span className={cn(
                                        "font-bold tabular-nums leading-none tracking-tight transition-all",
                                        displayTime.h > 0 ? "text-4xl" : "text-6xl"
                                    )}>
                                        {displayTime.m.toString().padStart(displayTime.h > 0 ? 2 : 1, "0")}
                                    </span>
                                    <span className={cn(
                                        "font-bold opacity-60 relative mx-0.5 transition-all",
                                        displayTime.h > 0 ? "text-xl -top-3" : "text-2xl -top-4"
                                    )}>:</span>
                                    <span className={cn(
                                        "font-bold tabular-nums leading-none tracking-tight transition-all",
                                        displayTime.h > 0 ? "text-4xl" : "text-6xl"
                                    )}>
                                        {displayTime.s.toString().padStart(2, "0")}
                                    </span>
                                </div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mt-2 opacity-80">
                                    {mode === "timer" ? "Remaining" : "Elapsed"}
                                </p>
                            </div>
                        </div>

                        <Button
                            size="lg"
                            className="h-14 w-full max-w-[220px] rounded-full bg-[var(--color-focus)] text-white shadow-xl shadow-[var(--color-focus)]/30 hover:bg-[var(--color-focus)]/90 hover:scale-[1.02] active:scale-95 transition-all"
                            onClick={toggleFocus}
                        >
                            <Square className="mr-2 size-5 fill-current" />
                            <span className="text-sm font-bold uppercase tracking-widest">Stop Session</span>
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col gap-4">
                            {/* Duration Slider for Timer Mode */}
                            {mode === "timer" && isToday && (
                                <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-100 dark:border-white/5 space-y-3">
                                    <div className="flex justify-between text-xs uppercase font-bold text-muted-foreground tracking-wider">
                                        <span>Duration</span>
                                        <span className="text-[var(--color-focus)]">{timerDuration} min</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="5"
                                        max="120"
                                        step="5"
                                        value={timerDuration}
                                        onChange={(e) => setTimerDuration(parseInt(e.target.value))}
                                        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[var(--color-focus)]"
                                    />
                                    <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                                        <span>5m</span>
                                        <span>60m</span>
                                        <span>120m</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                        Total Focus Today
                                    </span>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-bold tabular-nums text-foreground">
                                            {totalHrs}
                                        </span>
                                        <span className="text-sm font-medium text-muted-foreground">
                                            / {targetHours} hrs
                                        </span>
                                    </div>
                                </div>

                                {isToday && (
                                    <Button
                                        size="lg"
                                        className="w-full sm:w-auto min-w-[160px] gap-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                                        onClick={toggleFocus}
                                    >
                                        <Play className="size-4 fill-current" />
                                        Start {mode === "timer" ? "Timer" : "Focus"}
                                    </Button>
                                )}
                            </div>
                        </div>

                        <form
                            onSubmit={handleManualAdd}
                            className="mt-2 flex h-12 w-full items-center overflow-hidden rounded-xl border border-border bg-card shadow-sm"
                        >
                            <Input
                                type="number"
                                min={1}
                                placeholder="Add minutes manually..."
                                value={manualMinutes}
                                onChange={(e) => setManualMinutes(e.target.value)}
                                className="h-full min-w-0 flex-1 rounded-l-xl rounded-r-none border-0 bg-transparent px-4 text-base shadow-none focus-visible:ring-0"
                            />
                            <Button
                                type="submit"
                                variant="ghost"
                                className="h-full shrink-0 rounded-l-none rounded-r-xl px-6 hover:bg-muted"
                            >
                                <Plus className="mr-1 size-4" />
                                Log
                            </Button>
                        </form>
                    </>
                )}
            </div>

            <FocusDurationChart />
        </div >
    );
}
