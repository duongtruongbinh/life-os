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
import { useLifeOSStore } from "@/store/useLifeOSStore";
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
} from "@/lib/constants";
import { ChartRangeToggle } from "./ChartRangeToggle";

/** Bar chart: tasks completed by day/week/month. Client-side from store (completed_at). */
export function TasksChart() {
  const tasks = useLifeOSStore((s) => s.tasks);
  const isMobile = useIsMobile();
  const [range, setRange] = useState<ChartRange>("week");

  const data = useMemo(() => {
    const completed = tasks.filter(
      (t): t is typeof t & { completed_at: string } =>
        t.is_completed === true && t.completed_at != null
    );
    const dateStr = (iso: string) => iso.slice(0, 10);
    const monthKey = (iso: string) => iso.slice(0, 7);

    if (range === "week") {
      return getLastNDateStrings(7).map((dateStrKey) => {
        const count = completed.filter(
          (t) => dateStr(t.completed_at!) === dateStrKey
        ).length;
        return {
          date: dateStrKey,
          label: formatChartLabelByRange(dateStrKey, "week"),
          count,
        };
      });
    }
    if (range === "month") {
      return getLastNDateStrings(28).map((dateStrKey) => {
        const count = completed.filter(
          (t) => dateStr(t.completed_at!) === dateStrKey
        ).length;
        return {
          date: dateStrKey,
          label: formatChartLabelByRange(dateStrKey, "month"),
          count,
        };
      });
    }
    const monthKeys = getLastNMonthKeys(12);
    return monthKeys.map((monthStr) => {
      const count = completed.filter(
        (t) => monthKey(t.completed_at!) === monthStr
      ).length;
      return {
        date: monthStr,
        label: formatChartLabelByRange(monthStr, "year"),
        count,
      };
    });
  }, [tasks, range]);

  const chartHeight = isMobile ? MOBILE_CHART_HEIGHT : SLEEP_CHART_HEIGHT;
  const tickFontSize = isMobile
    ? CHART_TICK_FONT_SIZE_MOBILE
    : CHART_TICK_FONT_SIZE_DESKTOP;
  const margin = isMobile ? CHART_MARGIN : CHART_MARGIN_WITH_Y;
  const maxCount = useMemo(
    () => (data.length ? Math.max(...data.map((d) => d.count), 1) : 1),
    [data]
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="chart-legend text-xs font-semibold uppercase tracking-wider">
          {CHART_RANGE_LABELS[range]}
        </p>
        <ChartRangeToggle value={range} onChange={setRange} />
      </div>
      <div
        className="w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50 p-3 dark:border-white/10 dark:bg-white/[0.03]"
        style={{ height: chartHeight, minHeight: chartHeight }}
      >
        <ResponsiveContainer width="100%" height={Math.max(80, chartHeight - 32)}>
          <BarChart data={data} margin={margin}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgb(148 163 184 / 0.2)"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: tickFontSize, fill: "rgb(148 163 184)" }}
              tickLine={false}
              axisLine={false}
              interval={range === "month" ? 3 : range === "year" ? 0 : 2}
            />
            <YAxis
              domain={[0, maxCount]}
              allowDecimals={false}
              tick={{ fontSize: tickFontSize, fill: "rgb(148 163 184)" }}
              tickLine={false}
              axisLine={false}
              width={isMobile ? 0 : 32}
              hide={isMobile}
            />
            <Tooltip
              cursor={{ fill: "rgb(148 163 184 / 0.08)", radius: 4 }}
              wrapperStyle={{ outline: "none" }}
              contentStyle={{
                background: "rgb(25 28 35 / 0.98)",
                border: "1px solid rgb(255 255 255 / 0.15)",
                borderRadius: "1rem",
                padding: "0.625rem 1rem",
                boxShadow:
                  "0 0 0 1px rgb(255 255 255 / 0.08), 0 20px 40px -12px rgb(0 0 0 / 0.4)",
              }}
              content={({ active, payload }) =>
                active && payload?.[0] ? (
                  <div className="chart-tooltip flex items-center gap-2">
                    <span className="chart-label">{payload[0].payload.label}</span>
                    <span className="chart-value-done font-bold tabular-nums">
                      {payload[0].value} completed
                    </span>
                  </div>
                ) : null
              }
            />
            <Bar
              dataKey="count"
              fill="var(--color-task)"
              radius={[4, 4, 0, 0]}
              maxBarSize={48}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
