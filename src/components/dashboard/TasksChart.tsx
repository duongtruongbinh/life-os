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

    // Helper to aggregate counts by priority
    const aggregate = (filtered: typeof completed, label: string, key: string) => {
      let urgent = 0;
      let high = 0;
      let normal = 0;
      filtered.forEach((t) => {
        if (t.priority === "urgent") urgent++;
        else if (t.priority === "high") high++;
        else normal++; // normal or null
      });
      return {
        date: key,
        label,
        urgent,
        high,
        normal,
        count: filtered.length,
      };
    };

    if (range === "week") {
      return getLastNDateStrings(7).map((dateStrKey) => {
        const filtered = completed.filter(
          (t) => dateStr(t.completed_at!) === dateStrKey
        );
        return aggregate(filtered, formatChartLabelByRange(dateStrKey, "week"), dateStrKey);
      });
    }
    if (range === "month") {
      return getLastNDateStrings(28).map((dateStrKey) => {
        const filtered = completed.filter(
          (t) => dateStr(t.completed_at!) === dateStrKey
        );
        return aggregate(filtered, formatChartLabelByRange(dateStrKey, "month"), dateStrKey);
      });
    }
    const monthKeys = getLastNMonthKeys(12);
    return monthKeys.map((monthStr) => {
      const filtered = completed.filter(
        (t) => monthKey(t.completed_at!) === monthStr
      );
      return aggregate(filtered, formatChartLabelByRange(monthStr, "year"), monthStr);
    });
  }, [tasks, range]);

  const chartHeight = isMobile ? MOBILE_CHART_HEIGHT : SLEEP_CHART_HEIGHT;
  const tickFontSize = isMobile
    ? CHART_TICK_FONT_SIZE_MOBILE
    : CHART_TICK_FONT_SIZE_DESKTOP;
  const margin = isMobile ? CHART_MARGIN : CHART_MARGIN_WITH_Y;
  const maxCount = useMemo(
    () => (data.length ? Math.max(...data.map((d) => d.count), 4) : 4),
    [data]
  ); // Min 4 to avoid flat chart

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="chart-legend text-xs font-semibold uppercase tracking-wider">
          Workload {CHART_RANGE_LABELS[range]}
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
              content={({ active, payload }) => {
                if (active && payload && payload.length > 0) {
                  const d = payload[0].payload;
                  return (
                    <div className="chart-tooltip flex flex-col gap-1.5 min-w-[140px]">
                      <span className="chart-label text-xs font-semibold uppercase tracking-wider mb-1">
                        {d.label}
                      </span>
                      <div className="flex flex-col gap-1 text-xs">
                        {d.urgent > 0 && (
                          <div className="flex justify-between items-center text-red-500 font-medium">
                            <span className="flex items-center gap-1.5">
                              <span className="size-1.5 rounded-full bg-red-500" />
                              Urgent
                            </span>
                            <span className="tabular-nums">{d.urgent}</span>
                          </div>
                        )}
                        {d.high > 0 && (
                          <div className="flex justify-between items-center text-orange-500 font-medium">
                            <span className="flex items-center gap-1.5">
                              <span className="size-1.5 rounded-full bg-orange-500" />
                              High
                            </span>
                            <span className="tabular-nums">{d.high}</span>
                          </div>
                        )}
                        {d.normal > 0 && (
                          <div className="flex justify-between items-center text-blue-500 font-medium">
                            <span className="flex items-center gap-1.5">
                              <span className="size-1.5 rounded-full bg-blue-500" />
                              Normal
                            </span>
                            <span className="tabular-nums">{d.normal}</span>
                          </div>
                        )}
                        <div className="mt-1 pt-1 border-t border-white/10 flex justify-between items-center font-bold text-foreground">
                          <span>Total</span>
                          <span className="tabular-nums">{d.count}</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Stacked Bars: Normal -> High -> Urgent */}
            <Bar
              dataKey="normal"
              stackId="a"
              fill="#3b82f6" // blue-500
              radius={[0, 0, 4, 4]} // Bottom radius only for bottom bar? logic is tricky with 0 values.
              // Actually recharts handles radius on stack ends if configured, but safe to just radius top one manually or let it be square inside.
              // We'll reset radius for middle bars.
              maxBarSize={48}
            />
            <Bar
              dataKey="high"
              stackId="a"
              fill="#f97316" // orange-500
              maxBarSize={48}
            />
            <Bar
              dataKey="urgent"
              stackId="a"
              fill="#ef4444" // red-500
              radius={[4, 4, 0, 0]} // Top radius
              maxBarSize={48}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
