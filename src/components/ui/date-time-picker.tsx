"use client";

import * as React from "react";
import { Clock, X, Sunrise, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

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
    time: string;
    icon: React.ReactNode;
    getDate: () => Date;
}



const PRESETS: Preset[] = [
    {
        label: "Morning",
        time: "09:00",
        icon: <Sunrise className="size-3" />,
        getDate: () => {
            const d = new Date();
            d.setDate(d.getDate() + 1);
            d.setHours(9, 0, 0, 0);
            return d;
        },
    },
    {
        label: "Afternoon",
        time: "14:00",
        icon: <Sun className="size-3" />,
        getDate: () => {
            const d = new Date();
            if (d.getHours() >= 14) d.setDate(d.getDate() + 1);
            d.setHours(14, 0, 0, 0);
            return d;
        },
    },
    {
        label: "Evening",
        time: "19:00",
        icon: <Moon className="size-3" />,
        getDate: () => {
            const d = new Date();
            if (d.getHours() >= 19) d.setDate(d.getDate() + 1);
            d.setHours(19, 0, 0, 0);
            return d;
        },
    },
];

// ─── Compact Time Grid ───────────────────────────────────────────────────────

const HOUR_GRID = [6, 8, 9, 10, 12, 14, 16, 18, 21];
const MINUTE_CHIPS = [0, 15, 30, 45];

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

    const handleHourSelect = React.useCallback(
        (h: number) => {
            setHour(h);
            setShowTime(true);
            const m = minute < 0 ? 0 : minute;
            if (minute < 0) setMinute(0);
            const date = selectedDate ?? new Date();
            if (!selectedDate) setSelectedDate(date);
            emit(date, h, m, true);
        },
        [selectedDate, minute, emit]
    );

    const handleMinuteSelect = React.useCallback(
        (m: number) => {
            setMinute(m);
            const h = hour < 0 ? 9 : hour;
            if (hour < 0) setHour(9);
            const date = selectedDate ?? new Date();
            if (!selectedDate) setSelectedDate(date);
            emit(date, h, m, true);
        },
        [selectedDate, hour, emit]
    );

    const handleToggleTime = React.useCallback(() => {
        const next = !showTime;
        setShowTime(next);
        if (next) {
            const now = new Date();
            const h = now.getHours();
            const m = Math.round(now.getMinutes() / 15) * 15;
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

                {/* Smart Presets + Time toggle + Clear */}
                <div className="flex items-center gap-1.5 px-3 py-2">
                    {PRESETS.map((p) => (
                        <button
                            key={p.label}
                            type="button"
                            onClick={() => handlePreset(p)}
                            className="flex items-center gap-1 flex-1 justify-center rounded-lg px-2 py-1.5 text-[11px] font-medium text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground active:scale-95 border border-transparent hover:border-border/50"
                        >
                            {p.icon}
                            <span className="hidden sm:inline-block">{p.label}</span>
                            <span className="sm:hidden">{p.time}</span>
                        </button>
                    ))}
                </div>

                <div className="divider-gradient mx-3" />

                {/* Time toggle row */}
                <div className="flex items-center justify-between px-3 py-2">
                    <button
                        type="button"
                        onClick={handleToggleTime}
                        className={cn(
                            "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all active:scale-95",
                            showTime
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                    >
                        <Clock className="size-3.5" />
                        {showTime ? "Time On" : "Set Time"}
                    </button>

                    <div className="flex items-center gap-2">
                        {timeDisplay ? (
                            <div className="px-2.5 py-1 rounded-md bg-muted text-foreground text-xs font-bold tabular-nums">
                                {timeDisplay}
                            </div>
                        ) : null}

                        {/* Clear */}
                        {value && (
                            <button
                                type="button"
                                onClick={handleClear}
                                title="Clear Select"
                                className="flex items-center justify-center size-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            >
                                <X className="size-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Compact Time Grid */}
                {showTime && (
                    <>
                        <div className="divider-gradient mx-3" />
                        <div className="px-3 py-2.5 space-y-2">
                            {/* Hour Grid */}
                            <div className="grid grid-cols-5 gap-1">
                                {HOUR_GRID.map((h) => {
                                    const active = hour === h;
                                    return (
                                        <button
                                            key={h}
                                            type="button"
                                            onClick={() => handleHourSelect(h)}
                                            className={cn(
                                                "rounded-md px-1.5 py-1.5 text-[12px] font-semibold tabular-nums transition-all active:scale-95",
                                                active
                                                    ? "bg-primary text-primary-foreground shadow-sm"
                                                    : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                                            )}
                                        >
                                            {String(h).padStart(2, "0")}:00
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Minute chips — visible after an hour is selected */}
                            {hour >= 0 && (
                                <div className="flex items-center justify-center gap-1">
                                    <span className="text-[10px] text-muted-foreground/50 mr-1 select-none">min</span>
                                    {MINUTE_CHIPS.map((m) => {
                                        const active = minute === m;
                                        return (
                                            <button
                                                key={m}
                                                type="button"
                                                onClick={() => handleMinuteSelect(m)}
                                                className={cn(
                                                    "rounded-md px-2.5 py-1 text-[11px] font-medium tabular-nums transition-all active:scale-95",
                                                    active
                                                        ? "bg-primary text-primary-foreground shadow-sm"
                                                        : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                                                )}
                                            >
                                                :{String(m).padStart(2, "0")}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
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
