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
import { useLifeOSStore } from "@/store/useLifeOSStore";
import { mergeLogs } from "@/lib/log-utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  getLastNDateStrings,
  getLastNMonthKeys,
  formatChartLabelByRange,
  calculateDurationHours,
  type ChartRange,
} from "@/lib/date-utils";
import {
  MOBILE_CHART_HEIGHT,
  SLEEP_CHART_HEIGHT,
  CHART_MARGIN,
  CHART_MARGIN_WITH_Y,
  CHART_RANGE_LABELS,
} from "@/lib/constants";
import {
  CHART_GRADIENTS,
  TOOLTIP_STYLE,
  GRID_STYLE,
  BAR_STYLE,
  CHART_CONTAINER_CLASSES,
} from "@/lib/chart-theme";
import { ChartRangeToggle } from "./ChartRangeToggle";

type SleepDurationChartProps = { compact?: boolean };

/** Bar chart: hours slept, with week/month/year range toggle. */
export function SleepDurationChart({ compact = false }: SleepDurationChartProps) {
  const dailyLogsLast7 = useLifeOSStore((s) => s.dailyLogsLast7);
  const dailyLogsLast28 = useLifeOSStore((s) => s.dailyLogsLast28);
  const dailyLogsLast365 = useLifeOSStore((s) => s.dailyLogsLast365);
  const modifiedLogs = useLifeOSStore((s) => s.modifiedLogs);
  const dailyLog = useLifeOSStore((s) => s.dailyLog);
  const userSettings = useLifeOSStore((s) => s.userSettings);
  const isMobile = useIsMobile();
  const targetHours = userSettings?.target_sleep_hours ?? 8;
  const [range, setRange] = useState<ChartRange>("week");

  const data = useMemo(() => {
    const mergedLast7 = mergeLogs(dailyLogsLast7, modifiedLogs);
    const mergedLast28 = mergeLogs(dailyLogsLast28, modifiedLogs);
    const mergedLast365 = mergeLogs(dailyLogsLast365, modifiedLogs);

    if (range === "week") {
      return getLastNDateStrings(7).map((dateStr) => {
        const log = mergedLast7.find((l) => l.date === dateStr);
        const isToday = dateStr === dailyLog.date;
        const start = isToday ? dailyLog.sleep_start : log?.sleep_start ?? null;
        const end = isToday ? dailyLog.sleep_end : log?.sleep_end ?? null;
        const hours = calculateDurationHours(start, end);
        return {
          date: dateStr,
          label: formatChartLabelByRange(dateStr, "week"),
          hours: Math.round(hours * 10) / 10,
        };
      });
    }
    if (range === "month") {
      return getLastNDateStrings(28).map((dateStr) => {
        const log = mergedLast28.find((l) => l.date === dateStr);
        const isToday = dateStr === dailyLog.date;
        const start = isToday ? dailyLog.sleep_start : log?.sleep_start ?? null;
        const end = isToday ? dailyLog.sleep_end : log?.sleep_end ?? null;
        const hours = calculateDurationHours(start, end);
        return {
          date: dateStr,
          label: formatChartLabelByRange(dateStr, "month"),
          hours: Math.round(hours * 10) / 10,
        };
      });
    }
    const monthKeys = getLastNMonthKeys(12);
    return monthKeys.map((monthKey) => {
      const logs = mergedLast365.filter((l) => l.date.startsWith(monthKey));
      const hoursList: number[] = logs.map((l) => {
        if (l.date === dailyLog.date)
          return calculateDurationHours(dailyLog.sleep_start, dailyLog.sleep_end);
        return calculateDurationHours(l.sleep_start, l.sleep_end);
      });
      if (dailyLog.date.startsWith(monthKey) && !logs.some((l) => l.date === dailyLog.date)) {
        hoursList.push(calculateDurationHours(dailyLog.sleep_start, dailyLog.sleep_end));
      }
      const valid = hoursList.filter((h) => h > 0);
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
    dailyLog.sleep_start,
    dailyLog.sleep_end,
  ]);

  const chartHeight = compact ? 100 : isMobile ? MOBILE_CHART_HEIGHT : SLEEP_CHART_HEIGHT;
  const tickFontSize = isMobile || compact ? 10 : 11;
  const margin = isMobile || compact ? CHART_MARGIN : { ...CHART_MARGIN_WITH_Y, left: 4 };

  if (!data || data.length === 0) {
    return (
      <div
        className={CHART_CONTAINER_CLASSES.empty}
        style={{ height: chartHeight, minHeight: chartHeight }}
      >
        No sleep data yet
      </div>
    );
  }

  const gradient = CHART_GRADIENTS.sleep;

  return (
    <div className="space-y-3">
      {!compact && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className={CHART_CONTAINER_CLASSES.legend}>
            {CHART_RANGE_LABELS[range]}
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
              domain={[0, 12]}
              ticks={[0, 4, 6, 8, 10, 12]}
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
                      style={{ color: "var(--color-sleep)" }}
                    >
                      {payload[0].value}h
                    </span>
                  </div>
                ) : null
              }
            />
            <Bar
              dataKey="hours"
              fill={`url(#${gradient.id})`}
              radius={BAR_STYLE.radius}
              maxBarSize={BAR_STYLE.maxBarSize}
              animationDuration={600}
              animationEasing="ease-out"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

