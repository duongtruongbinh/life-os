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
    // Manual edit state
    const [manualMinutes, setManualMinutes] = useState("");

    useEffect(() => {
        if (!isFocusing || !isToday) return;
        const id = window.setInterval(() => {
            setNow(new Date());
        }, 1000);
        return () => window.clearInterval(id);
    }, [isFocusing, isToday]);

    const liveMinutes = useMemo(() => {
        if (!isFocusing || !dailyLog.focus_start) return 0;
        const start = new Date(dailyLog.focus_start);
        return Math.max(0, Math.floor((now.getTime() - start.getTime()) / 60000));
    }, [isFocusing, dailyLog.focus_start, now]);

    function toggleFocus() {
        if (isFocusing) {
            setFocusEnd();
        } else {
            setFocusStart();
        }
    }

    function handleManualAdd(e: React.FormEvent) {
        e.preventDefault();
        const m = parseInt(manualMinutes, 10);
        if (Number.isNaN(m) || m < 1) return;

        if (isToday) {
            addFocusMinutes(m);
        } else {
            // If editing past day, we probably want to set the total or add to it?
            // Let's just add to it for consistency with UI "Log"
            const current = dailyLog.focus_minutes || 0;
            setFocusMinutesForDate(selectedDate, current + m);
        }
        setManualMinutes("");
    }

    // Format total time for display
    const totalMinutes = (dailyLog.focus_minutes || 0);
    const totalHrs = (totalMinutes / 60).toFixed(1);

    return (
        <div className="flex flex-col gap-6">
            <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
                <Timer className="size-7 text-[var(--color-focus)]" />
                Focus
            </h2>

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
                                    ? "Focus session in progress"
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
                    <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in-95 duration-500">
                        {/* Breathing Container */}
                        {/* Circular Timer */}
                        <div className="relative flex items-center justify-center">
                            {/* SVG Ring */}
                            <div className="relative size-40">
                                <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                                    {/* Background Track */}
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="45"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        className="text-muted/20"
                                    />
                                    {/* Progress Arc (Pulse) */}
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="45"
                                        fill="none"
                                        stroke="var(--color-focus)"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        className="opacity-80 animate-pulse-slow"
                                        strokeDasharray="283"
                                        strokeDashoffset="0" // Full circle for active state 'breathing' effect
                                    />
                                </svg>

                                {/* Inner Glow / Gradient Background */}
                                <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-[var(--color-focus)]/10 to-transparent blur-xl"></div>
                            </div>

                            {/* Digital Time + Label Centered */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <div className="flex items-baseline justify-center gap-1 text-[var(--color-focus)] drop-shadow-sm">
                                    <span className="text-5xl font-bold tabular-nums leading-none tracking-tight">
                                        {Math.floor(liveMinutes / 60)}
                                    </span>
                                    <span className="text-xl font-bold opacity-60 relative -top-3 mx-0.5">:</span>
                                    <span className="text-5xl font-bold tabular-nums leading-none tracking-tight">
                                        {(liveMinutes % 60).toString().padStart(2, "0")}
                                    </span>
                                </div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mt-2 opacity-80">Focusing</p>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="mt-8 w-full max-w-[220px]">
                            <Button
                                size="lg"
                                className="h-14 w-full rounded-full bg-[var(--color-focus)] text-white shadow-xl shadow-[var(--color-focus)]/30 hover:bg-[var(--color-focus)]/90 hover:scale-[1.02] active:scale-95 transition-all"
                                onClick={toggleFocus}
                            >
                                <Square className="mr-2 size-5 fill-current" />
                                <span className="text-sm font-bold uppercase tracking-widest">Stop Session</span>
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                            {/* Stats */}
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

                            {/* Start Button */}
                            {isToday && (
                                <Button
                                    size="lg"
                                    className="w-full sm:w-auto min-w-[160px] gap-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                                    onClick={toggleFocus}
                                >
                                    <Play className="size-4 fill-current" />
                                    Start Focus
                                </Button>
                            )}
                        </div>

                        {/* Manual Add Form */}
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
