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
  DESKTOP_CHART_HEIGHT,
  CHART_MARGIN,
  CHART_TICK_FONT_SIZE_MOBILE,
  CHART_TICK_FONT_SIZE_DESKTOP,
  CHART_RANGE_LABELS,
} from "@/lib/constants";
import { ChartRangeToggle } from "./ChartRangeToggle";

/** Bar chart of push-ups with week/month/year range toggle. */
export function PushupsChart() {
  const dailyLogsLast7 = useLifeOSStore((s) => s.dailyLogsLast7);
  const dailyLogsLast28 = useLifeOSStore((s) => s.dailyLogsLast28);
  const dailyLogsLast365 = useLifeOSStore((s) => s.dailyLogsLast365);
  const modifiedLogs = useLifeOSStore((s) => s.modifiedLogs);
  const dailyLog = useLifeOSStore((s) => s.dailyLog);
  const isMobile = useIsMobile();
  const [range, setRange] = useState<ChartRange>("week");

  const chartData = useMemo(() => {
    const mergedLast7 = getMergedLogs(dailyLogsLast7, modifiedLogs);
    const mergedLast28 = getMergedLogs(dailyLogsLast28, modifiedLogs);
    const mergedLast365 = getMergedLogs(dailyLogsLast365, modifiedLogs);

    if (range === "week") {
      const dates = getLastNDateStrings(7);
      return dates.map((dateStr) => {
        const log = mergedLast7.find((l) => l.date === dateStr);
        const pushups =
          dateStr === dailyLog.date ? dailyLog.pushup_count : log?.pushup_count ?? 0;
        return {
          date: dateStr,
          label: formatChartLabelByRange(dateStr, "week"),
          pushups,
        };
      });
    }
    if (range === "month") {
      const dates = getLastNDateStrings(28);
      return dates.map((dateStr) => {
        const log = mergedLast28.find((l) => l.date === dateStr);
        const pushups =
          dateStr === dailyLog.date ? dailyLog.pushup_count : log?.pushup_count ?? 0;
        return {
          date: dateStr,
          label: formatChartLabelByRange(dateStr, "month"),
          pushups,
        };
      });
    }
    const monthKeys = getLastNMonthKeys(12);
    return monthKeys.map((monthKey) => {
      const logs = mergedLast365.filter((l) => l.date.startsWith(monthKey));
      let pushups = logs.reduce((sum, l) => sum + (l.pushup_count ?? 0), 0);
      if (dailyLog.date.startsWith(monthKey)) {
        const existing = logs.find((l) => l.date === dailyLog.date);
        pushups -= existing?.pushup_count ?? 0;
        pushups += dailyLog.pushup_count ?? 0;
      }
      return {
        date: monthKey,
        label: formatChartLabelByRange(monthKey, "year"),
        pushups,
      };
    });
  }, [
    range,
    dailyLogsLast7,
    dailyLogsLast28,
    dailyLogsLast365,
    modifiedLogs,
    dailyLog.date,
    dailyLog.pushup_count,
  ]);

  const chartHeight = isMobile ? MOBILE_CHART_HEIGHT : DESKTOP_CHART_HEIGHT;
  const tickFontSize = isMobile ? CHART_TICK_FONT_SIZE_MOBILE : CHART_TICK_FONT_SIZE_DESKTOP;

  return (
    <div className="min-h-0 flex-1">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="chart-legend text-xs font-semibold uppercase tracking-wider">
          {CHART_RANGE_LABELS[range]}
        </p>
        <ChartRangeToggle value={range} onChange={setRange} />
      </div>
      <div
        className="w-full overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-3"
        style={{ height: chartHeight, minHeight: chartHeight }}
      >
        {(!chartData || chartData.length === 0) ? (
          <div className="chart-legend flex h-full min-h-[100px] w-full items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/5 text-sm md:min-h-[140px]">
            No data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={chartHeight - 32}>
            <BarChart data={chartData} margin={CHART_MARGIN}>
              <defs>
                <linearGradient id="pushupBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.85 0.18 45)" stopOpacity={1} />
                  <stop offset="50%" stopColor="oklch(0.75 0.18 45)" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="oklch(0.55 0.15 45)" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(255 255 255 / 0.06)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: tickFontSize, fill: "rgb(148 163 184)" }}
                tickLine={false}
                axisLine={false}
                interval={range === "month" ? 3 : 0}
              />
              <YAxis
                tick={{ fontSize: tickFontSize, fill: "rgb(148 163 184)" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                hide={isMobile}
              />
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
                      <span className="chart-value-pushup font-bold tabular-nums">
                        {payload[0].value} push-ups
                      </span>
                    </div>
                  ) : null
                }
              />
              <Bar
                dataKey="pushups"
                fill="url(#pushupBar)"
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
