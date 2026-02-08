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
    CHART_RANGE_LABELS,
    DEFAULT_TARGET_FOCUS_HOURS,
} from "@/lib/constants";
import {
    CHART_GRADIENTS,
    TOOLTIP_STYLE,
    GRID_STYLE,
    BAR_STYLE,
    CHART_CONTAINER_CLASSES,
} from "@/lib/chart-theme";
import { ChartRangeToggle } from "@/components/dashboard/ChartRangeToggle";
import { FocusEditDialog } from "@/components/focus/FocusEditDialog";

type FocusDurationChartProps = { compact?: boolean };

/** Bar chart: hours focused, with week/month/year range toggle. Click bar to edit. */
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
    const [editData, setEditData] = useState<{ date: string; minutes: number } | null>(null);

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
                    minutes,
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
                    minutes,
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
            if (dailyLog.date.startsWith(monthKey) && !logs.some((l) => l.date === dailyLog.date)) {
                hoursList.push((dailyLog.focus_minutes || 0) / 60);
            }
            const valid = hoursList;
            const avg =
                valid.length > 0
                    ? Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10
                    : 0;
            return {
                date: monthKey,
                label: formatChartLabelByRange(monthKey, "year"),
                hours: avg,
                minutes: 0,
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
    const tickFontSize = isMobile || compact ? 10 : 11;
    const margin = isMobile || compact ? CHART_MARGIN : { ...CHART_MARGIN_WITH_Y, left: 4 };

    const handleBarClick = (payload: { date: string; minutes: number }) => {
        if (range === "year") return;
        setEditData({ date: payload.date, minutes: payload.minutes });
    };

    if (!data || data.length === 0) {
        return (
            <div
                className={CHART_CONTAINER_CLASSES.empty}
                style={{ height: chartHeight, minHeight: chartHeight }}
            >
                No focus data yet
            </div>
        );
    }

    const gradient = CHART_GRADIENTS.focus;

    return (
        <div className="space-y-3">
            {!compact && (
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className={CHART_CONTAINER_CLASSES.legend}>
                        {range === "year" ? `${CHART_RANGE_LABELS[range]} (Daily Avg)` : CHART_RANGE_LABELS[range]}
                    </p>
                    <ChartRangeToggle value={range} onChange={setRange} />
                </div>
            )}
            <div
                className={compact ? "w-full overflow-hidden rounded-xl bg-white/[0.02] py-2" : CHART_CONTAINER_CLASSES.wrapper}
                style={{ height: chartHeight, minHeight: chartHeight }}
            >
                <ResponsiveContainer width="100%" height={Math.max(80, chartHeight - (compact ? 16 : 32))}>
                    <BarChart data={data} margin={margin}>
                        <defs>
                            <linearGradient id={gradient.id} x1="0" y1="0" x2="0" y2="1">
                                {gradient.colors.map((stop, i) => (
                                    <stop
                                        key={i}
                                        offset={stop.offset}
                                        stopColor={stop.color}
                                        stopOpacity={stop.opacity}
                                    />
                                ))}
                            </linearGradient>
                        </defs>
                        <CartesianGrid {...GRID_STYLE} />
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: tickFontSize, fill: "rgb(120, 130, 150)", fontWeight: 500 }}
                            tickLine={false}
                            axisLine={false}
                            interval={compact ? 2 : range === "month" ? 3 : 0}
                        />
                        <YAxis
                            tick={{ fontSize: tickFontSize, fill: "rgb(120, 130, 150)", fontWeight: 500 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => `${v}h`}
                            width={isMobile || compact ? 0 : 32}
                            hide={isMobile || compact}
                        />
                        {!compact && (
                            <ReferenceLine
                                y={targetHours}
                                stroke="rgba(148, 163, 184, 0.5)"
                                strokeDasharray="6 4"
                                strokeWidth={1.5}
                            />
                        )}
                        <Tooltip
                            cursor={TOOLTIP_STYLE.cursor}
                            wrapperStyle={TOOLTIP_STYLE.wrapperStyle}
                            contentStyle={TOOLTIP_STYLE.contentStyle}
                            content={({ active, payload }) =>
                                active && payload?.[0] ? (
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-xs font-medium text-muted-foreground">
                                            {payload[0].payload.label}
                                        </span>
                                        <span
                                            className="text-lg font-bold tabular-nums"
                                            style={{ color: "var(--color-focus)" }}
                                        >
                                            {payload[0].value}h
                                        </span>
                                        {range !== "year" && (
                                            <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wide">
                                                Click to edit
                                            </span>
                                        )}
                                    </div>
                                ) : null
                            }
                        />
                        <Bar
                            dataKey="hours"
                            fill={`url(#${gradient.id})`}
                            radius={BAR_STYLE.radius}
                            maxBarSize={BAR_STYLE.maxBarSize}
                            onClick={(data: any) => handleBarClick(data.payload)}
                            style={{ cursor: range !== "year" ? "pointer" : "default" }}
                            animationDuration={600}
                            animationEasing="ease-out"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {editData && (
                <FocusEditDialog
                    date={editData.date}
                    currentMinutes={editData.minutes}
                    open={!!editData}
                    onOpenChange={(open) => !open && setEditData(null)}
                />
            )}
        </div>
    );
}


