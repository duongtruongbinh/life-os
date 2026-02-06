"use client";

import { useState, useMemo } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    ResponsiveContainer,
    Tooltip,
    CartesianGrid,
    ReferenceLine,
} from "recharts";
import { getMergedLogs, useLifeOSStore } from "@/store/useLifeOSStore";
import { useIsMobile } from "@/hooks/use-mobile";
import {
    getLastNDateStrings,
    getLastNMonthKeys,
    formatChartLabelByRange,
    type ChartRange,
} from "@/lib/date-utils";
import {
    MOBILE_CHART_HEIGHT,
    SLEEP_CHART_HEIGHT,
    CHART_MARGIN,
    CHART_MARGIN_WITH_Y,
    CHART_TICK_FONT_SIZE_MOBILE,
    CHART_TICK_FONT_SIZE_DESKTOP,
    CHART_RANGE_LABELS,
    DEFAULT_TARGET_FOCUS_HOURS,
} from "@/lib/constants";
import { ChartRangeToggle } from "@/components/dashboard/ChartRangeToggle";

type FocusDurationChartProps = { compact?: boolean };

/** Bar chart: hours focused, with week/month/year range toggle. */
export function FocusDurationChart({ compact = false }: FocusDurationChartProps) {
    const dailyLogsLast7 = useLifeOSStore((s) => s.dailyLogsLast7);
    const dailyLogsLast28 = useLifeOSStore((s) => s.dailyLogsLast28);
    const dailyLogsLast365 = useLifeOSStore((s) => s.dailyLogsLast365);
    const modifiedLogs = useLifeOSStore((s) => s.modifiedLogs);
    const dailyLog = useLifeOSStore((s) => s.dailyLog);
    const userSettings = useLifeOSStore((s) => s.userSettings);
    const isMobile = useIsMobile();
    const targetHours = userSettings?.target_focus_hours ?? DEFAULT_TARGET_FOCUS_HOURS;
    const [range, setRange] = useState<ChartRange>("week");

    const data = useMemo(() => {
        const mergedLast7 = getMergedLogs(dailyLogsLast7, modifiedLogs);
        const mergedLast28 = getMergedLogs(dailyLogsLast28, modifiedLogs);
        const mergedLast365 = getMergedLogs(dailyLogsLast365, modifiedLogs);

        if (range === "week") {
            return getLastNDateStrings(7).map((dateStr) => {
                const log = mergedLast7.find((l) => l.date === dateStr);
                const isToday = dateStr === dailyLog.date;
                const minutes = isToday ? dailyLog.focus_minutes : log?.focus_minutes ?? 0;
                return {
                    date: dateStr,
                    label: formatChartLabelByRange(dateStr, "week"),
                    hours: Math.round((minutes / 60) * 10) / 10,
                };
            });
        }
        if (range === "month") {
            return getLastNDateStrings(28).map((dateStr) => {
                const log = mergedLast28.find((l) => l.date === dateStr);
                const isToday = dateStr === dailyLog.date;
                const minutes = isToday ? dailyLog.focus_minutes : log?.focus_minutes ?? 0;
                return {
                    date: dateStr,
                    label: formatChartLabelByRange(dateStr, "month"),
                    hours: Math.round((minutes / 60) * 10) / 10,
                };
            });
        }
        const monthKeys = getLastNMonthKeys(12);
        return monthKeys.map((monthKey) => {
            const logs = mergedLast365.filter((l) => l.date.startsWith(monthKey));
            const hoursList: number[] = logs.map((l) => {
                if (l.date === dailyLog.date)
                    return (dailyLog.focus_minutes || 0) / 60;
                return (l.focus_minutes || 0) / 60;
            });
            // Include today if matches
            if (dailyLog.date.startsWith(monthKey) && !logs.some((l) => l.date === dailyLog.date)) {
                hoursList.push((dailyLog.focus_minutes || 0) / 60);
            }

            const valid = hoursList; // Include 0s? probably yes for average? Or just sum? Sleep chart does average. Focus chart usually sum?
            // For focus, "average daily focus" makes sense.
            // Or "total monthly focus"? Recharts bars easier with average for consistent scale?
            // Let's do Average Daily Focus per month.
            const avg =
                valid.length > 0
                    ? Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10
                    : 0;
            return {
                date: monthKey,
                label: formatChartLabelByRange(monthKey, "year"),
                hours: avg,
            };
        });
    }, [
        range,
        dailyLogsLast7,
        dailyLogsLast28,
        dailyLogsLast365,
        modifiedLogs,
        dailyLog.date,
        dailyLog.focus_minutes,
    ]);

    const chartHeight = compact ? 100 : isMobile ? MOBILE_CHART_HEIGHT : SLEEP_CHART_HEIGHT;
    const tickFontSize = isMobile || compact
        ? CHART_TICK_FONT_SIZE_MOBILE
        : CHART_TICK_FONT_SIZE_DESKTOP;
    const margin = isMobile || compact ? CHART_MARGIN : { ...CHART_MARGIN_WITH_Y, left: 4 };

    if (!data || data.length === 0) {
        return (
            <div
                className="flex w-full items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/5 text-muted-foreground text-sm"
                style={{ height: chartHeight, minHeight: chartHeight }}
            >
                No data yet
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {!compact && (
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="chart-legend text-xs font-semibold uppercase tracking-wider">
                        {range === "year" ? `${CHART_RANGE_LABELS[range]} (Daily Avg)` : CHART_RANGE_LABELS[range]}
                    </p>
                    <ChartRangeToggle value={range} onChange={setRange} />
                </div>
            )}
            <div
                className="w-full overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] py-3"
                style={{ height: chartHeight, minHeight: chartHeight }}
            >
                <ResponsiveContainer width="100%" height={Math.max(80, chartHeight - 24)}>
                    <BarChart data={data} margin={margin}>
                        <defs>
                            <linearGradient id="focusBar" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="oklch(0.65 0.18 290)" stopOpacity={1} />
                                <stop offset="50%" stopColor="oklch(0.60 0.18 290)" stopOpacity={0.9} />
                                <stop offset="100%" stopColor="oklch(0.40 0.15 290)" stopOpacity={0.4} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgb(255 255 255 / 0.06)" vertical={false} />
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: tickFontSize, fill: "rgb(148 163 184)" }}
                            tickLine={false}
                            axisLine={false}
                            interval={
                                compact
                                    ? 2
                                    : range === "month"
                                        ? 3
                                        : 0
                            }
                        />
                        <YAxis
                            tick={{ fontSize: tickFontSize, fill: "rgb(148 163 184)" }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => `${v}h`}
                            width={isMobile || compact ? 0 : 30}
                            hide={isMobile || compact}
                        />
                        {!compact && (
                            <ReferenceLine
                                y={targetHours}
                                stroke="rgb(148 163 184 / 0.6)"
                                strokeDasharray="4 4"
                                label={{ value: "Goal", fill: "rgb(148 163 184)" }}
                            />
                        )}
                        <Tooltip
                            cursor={{ fill: "rgb(255 255 255 / 0.06)", radius: 4 }}
                            wrapperStyle={{ outline: "none" }}
                            contentStyle={{
                                background: "rgb(25 28 35 / 0.98)",
                                border: "1px solid rgb(255 255 255 / 0.15)",
                                borderRadius: "1rem",
                                padding: "0.625rem 1rem",
                                boxShadow: "0 0 0 1px rgb(255 255 255 / 0.08), 0 20px 40px -12px rgb(0 0 0 / 0.4)",
                            }}
                            content={({ active, payload }) =>
                                active && payload?.[0] ? (
                                    <div className="chart-tooltip flex items-center gap-2">
                                        <span className="chart-label">{payload[0].payload.label}</span>
                                        <span className="chart-value-focus font-bold tabular-nums" style={{ color: "var(--color-focus)" }}>
                                            {payload[0].value}h
                                        </span>
                                    </div>
                                ) : null
                            }
                        />
                        <Bar dataKey="hours" fill="url(#focusBar)" radius={[4, 4, 0, 0]} maxBarSize={48} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
