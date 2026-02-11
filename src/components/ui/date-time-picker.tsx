"use client";

import * as React from "react";
import { Clock, X, Sun, Sunrise, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { parseTaskDate, safeFormatTaskDate, hasTimeComponent } from "@/lib/date-utils";

// ─── Smart Presets ───────────────────────────────────────────────────────────

interface Preset {
    label: string;
    icon: React.ReactNode;
    getDate: () => Date;
}

function getNextSaturday(): Date {
    const d = new Date();
    const day = d.getDay();
    const diff = day === 6 ? 7 : 6 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(9, 0, 0, 0);
    return d;
}

const PRESETS: Preset[] = [
    {
        label: "Morning",
        icon: <Sunrise className="size-3" />,
        getDate: () => {
            const d = new Date();
            d.setDate(d.getDate() + 1);
            d.setHours(9, 0, 0, 0);
            return d;
        },
    },
    {
        label: "Evening",
        icon: <Sun className="size-3" />,
        getDate: () => {
            const d = new Date();
            // If it's past 18:00, set for tomorrow evening
            if (d.getHours() >= 18) d.setDate(d.getDate() + 1);
            d.setHours(18, 0, 0, 0);
            return d;
        },
    },
    {
        label: "Weekend",
        icon: <CalendarDays className="size-3" />,
        getDate: getNextSaturday,
    },
];

// ─── Common Time Chips ───────────────────────────────────────────────────────

const COMMON_TIMES = [
    { h: 9, m: 0, label: "09:00" },
    { h: 12, m: 0, label: "12:00" },
    { h: 14, m: 0, label: "14:00" },
    { h: 18, m: 0, label: "18:00" },
    { h: 21, m: 0, label: "21:00" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildIso(date: Date, h: number, m: number): string {
    const d = new Date(date);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
}

function buildDateOnly(date: Date): string {
    const y = date.getFullYear();
    const mo = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${y}-${mo}-${day}`;
}

// ─── DateTimePicker ──────────────────────────────────────────────────────────

interface DateTimePickerProps {
    value: string | null;
    onChange: (iso: string | null) => void;
    children: React.ReactNode;
    className?: string;
}

export function DateTimePicker({
    value,
    onChange,
    children,
    className,
}: DateTimePickerProps) {
    const [open, setOpen] = React.useState(false);

    // Parse value
    const parsed = parseTaskDate(value);
    const withTime = hasTimeComponent(value);

    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
        parsed ?? undefined
    );
    const [hour, setHour] = React.useState(withTime && parsed ? parsed.getHours() : -1);
    const [minute, setMinute] = React.useState(withTime && parsed ? parsed.getMinutes() : -1);
    const [showTime, setShowTime] = React.useState(withTime);

    // Sync when value changes externally
    React.useEffect(() => {
        const p = parseTaskDate(value);
        const ht = hasTimeComponent(value);
        setSelectedDate(p ?? undefined);
        setHour(ht && p ? p.getHours() : -1);
        setMinute(ht && p ? p.getMinutes() : -1);
        setShowTime(ht);
    }, [value]);

    // ── Emit ───────────────────────────────────────────────────────────────

    const emit = React.useCallback(
        (date: Date | undefined, h: number, m: number, timeOn: boolean) => {
            if (!date) { onChange(null); return; }
            if (timeOn && h >= 0 && m >= 0) {
                onChange(buildIso(date, h, m));
            } else {
                onChange(buildDateOnly(date));
            }
        },
        [onChange]
    );

    // ── Handlers ───────────────────────────────────────────────────────────

    const handleDateSelect = React.useCallback(
        (d: Date | undefined) => {
            setSelectedDate(d);
            emit(d, hour, minute, showTime);
        },
        [hour, minute, showTime, emit]
    );

    const handleTimeChip = React.useCallback(
        (h: number, m: number) => {
            setHour(h);
            setMinute(m);
            setShowTime(true);
            const date = selectedDate ?? new Date();
            if (!selectedDate) setSelectedDate(date);
            emit(date, h, m, true);
        },
        [selectedDate, emit]
    );

    const handleToggleTime = React.useCallback(() => {
        const next = !showTime;
        setShowTime(next);
        if (next) {
            const now = new Date();
            const h = now.getHours();
            const m = Math.round(now.getMinutes() / 5) * 5;
            const safeM = m >= 60 ? 0 : m;
            setHour(h);
            setMinute(safeM);
            emit(selectedDate, h, safeM, true);
        } else {
            setHour(-1);
            setMinute(-1);
            emit(selectedDate, -1, -1, false);
        }
    }, [showTime, selectedDate, emit]);

    const handlePreset = React.useCallback(
        (preset: Preset) => {
            const d = preset.getDate();
            setSelectedDate(d);
            setHour(d.getHours());
            setMinute(d.getMinutes());
            setShowTime(true);
            onChange(d.toISOString());
        },
        [onChange]
    );

    const handleClear = React.useCallback(() => {
        setSelectedDate(undefined);
        setHour(-1);
        setMinute(-1);
        setShowTime(false);
        onChange(null);
        setOpen(false);
    }, [onChange]);

    // ── Time Input Handlers ────────────────────────────────────────────────

    const handleHourInput = React.useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const v = Math.max(0, Math.min(23, parseInt(e.target.value) || 0));
            setHour(v);
            const m = minute < 0 ? 0 : minute;
            if (minute < 0) setMinute(0);
            emit(selectedDate, v, m, true);
        },
        [selectedDate, minute, emit]
    );

    const handleMinuteInput = React.useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const v = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
            setMinute(v);
            const h = hour < 0 ? 0 : hour;
            if (hour < 0) setHour(0);
            emit(selectedDate, h, v, true);
        },
        [selectedDate, hour, emit]
    );

    // ── Time display ───────────────────────────────────────────────────────

    const timeDisplay = React.useMemo(() => {
        if (!showTime || hour < 0 || minute < 0) return null;
        return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    }, [showTime, hour, minute]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>{children}</PopoverTrigger>
            <PopoverContent
                className={cn("w-auto p-0 overflow-hidden", className)}
                align="end"
                sideOffset={8}
            >
                {/* Calendar */}
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    initialFocus
                />

                {/* Divider */}
                <div className="divider-gradient mx-3" />

                {/* Smart Presets */}
                <div className="flex items-center gap-1 px-3 py-2">
                    {PRESETS.map((p) => (
                        <button
                            key={p.label}
                            type="button"
                            onClick={() => handlePreset(p)}
                            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground active:scale-95"
                        >
                            {p.icon}
                            {p.label}
                        </button>
                    ))}

                    <div className="flex-1" />

                    {/* Time toggle */}
                    <button
                        type="button"
                        onClick={handleToggleTime}
                        className={cn(
                            "flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-all active:scale-95",
                            showTime
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                    >
                        <Clock className="size-3" />
                        {timeDisplay ?? "Time"}
                    </button>

                    {/* Clear */}
                    {value && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="flex items-center justify-center size-6 rounded-lg text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                            <X className="size-3.5" />
                        </button>
                    )}
                </div>

                {/* Time Section */}
                {showTime && (
                    <>
                        <div className="divider-gradient mx-3" />
                        <div className="px-3 py-2.5 space-y-2.5">
                            {/* Time Input Row */}
                            <div className="flex items-center justify-center gap-1">
                                <input
                                    type="number"
                                    min={0}
                                    max={23}
                                    value={hour < 0 ? "" : String(hour).padStart(2, "0")}
                                    onChange={handleHourInput}
                                    className="w-16 h-9 rounded-lg bg-muted/50 border border-border/50 text-center text-lg font-semibold tabular-nums text-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                                    placeholder="HH"
                                />
                                <span className="text-lg font-bold text-muted-foreground/50 select-none">:</span>
                                <input
                                    type="number"
                                    min={0}
                                    max={59}
                                    value={minute < 0 ? "" : String(minute).padStart(2, "0")}
                                    onChange={handleMinuteInput}
                                    className="w-16 h-9 rounded-lg bg-muted/50 border border-border/50 text-center text-lg font-semibold tabular-nums text-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                                    placeholder="MM"
                                />
                            </div>

                            {/* Quick Time Chips */}
                            <div className="flex items-center justify-center gap-1">
                                {COMMON_TIMES.map((t) => {
                                    const active = hour === t.h && minute === t.m;
                                    return (
                                        <button
                                            key={t.label}
                                            type="button"
                                            onClick={() => handleTimeChip(t.h, t.m)}
                                            className={cn(
                                                "rounded-md px-2 py-1 text-[11px] font-medium tabular-nums transition-all active:scale-95",
                                                active
                                                    ? "bg-primary text-primary-foreground shadow-sm"
                                                    : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                                            )}
                                        >
                                            {t.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}

                {/* Bottom summary */}
                {selectedDate && (
                    <>
                        <div className="divider-gradient mx-3" />
                        <div className="flex items-center justify-center px-3 py-1.5">
                            <span className="text-[11px] text-muted-foreground/70">
                                {safeFormatTaskDate(value) || "Select a date"}
                            </span>
                        </div>
                    </>
                )}
            </PopoverContent>
        </Popover>
    );
}
