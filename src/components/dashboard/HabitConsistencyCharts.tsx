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
import { getHabitIcon } from "@/lib/habit-icons";
import {
  getLastNDateStrings,
  getLastNMonthKeys,
  formatChartLabelByRange,
  type ChartRange,
} from "@/lib/date-utils";
import { HABIT_CHART_COLORS, CHART_RANGE_LABELS } from "@/lib/constants";
import { ChartRangeToggle } from "./ChartRangeToggle";

type Point = { date: string; label: string; done: number };

/** Per-habit bar charts with week/month/year range toggle. */
export function HabitConsistencyCharts() {
  const habitDefinitions = useLifeOSStore((s) => s.habitDefinitions);
  const dailyLogsLast7 = useLifeOSStore((s) => s.dailyLogsLast7);
  const dailyLogsLast28 = useLifeOSStore((s) => s.dailyLogsLast28);
  const dailyLogsLast365 = useLifeOSStore((s) => s.dailyLogsLast365);
  const modifiedLogs = useLifeOSStore((s) => s.modifiedLogs);
  const dailyLog = useLifeOSStore((s) => s.dailyLog);
  const [range, setRange] = useState<ChartRange>("week");

  const series = useMemo(() => {
    const mergedLast7 = getMergedLogs(dailyLogsLast7, modifiedLogs);
    const mergedLast28 = getMergedLogs(dailyLogsLast28, modifiedLogs);
    const mergedLast365 = getMergedLogs(dailyLogsLast365, modifiedLogs);

    if (range === "week") {
      const dates = getLastNDateStrings(7);
      return habitDefinitions.map((h, idx) => {
        const points: Point[] = dates.map((dateStr) => {
          const log = mergedLast7.find((l) => l.date === dateStr);
          const done =
            dateStr === dailyLog.date
              ? (dailyLog.habits_status?.[h.id] ? 1 : 0)
              : log?.habits_status?.[h.id]
                ? 1
                : 0;
          return {
            date: dateStr,
            label: formatChartLabelByRange(dateStr, "week"),
            done,
          };
        });
        return { habit: h, points, color: HABIT_CHART_COLORS[idx % HABIT_CHART_COLORS.length] };
      });
    }
    if (range === "month") {
      const dates = getLastNDateStrings(28);
      return habitDefinitions.map((h, idx) => {
        const points: Point[] = dates.map((dateStr) => {
          const log = mergedLast28.find((l) => l.date === dateStr);
          const done =
            dateStr === dailyLog.date
              ? (dailyLog.habits_status?.[h.id] ? 1 : 0)
              : log?.habits_status?.[h.id]
                ? 1
                : 0;
          return {
            date: dateStr,
            label: formatChartLabelByRange(dateStr, "month"),
            done,
          };
        });
        return { habit: h, points, color: HABIT_CHART_COLORS[idx % HABIT_CHART_COLORS.length] };
      });
    }
    const monthKeys = getLastNMonthKeys(12);
    return habitDefinitions.map((h, idx) => {
      const points: Point[] = monthKeys.map((monthKey) => {
        const logs = mergedLast365.filter((l) => l.date.startsWith(monthKey));
        let count = logs.filter((l) => l.habits_status?.[h.id]).length;
        if (dailyLog.date.startsWith(monthKey)) {
          const inLogs = logs.some((l) => l.date === dailyLog.date);
          if (inLogs) {
            count -= logs.find((l) => l.date === dailyLog.date)?.habits_status?.[h.id] ? 1 : 0;
            count += dailyLog.habits_status?.[h.id] ? 1 : 0;
          } else if (dailyLog.habits_status?.[h.id]) {
            count += 1;
          }
        }
        return {
          date: monthKey,
          label: formatChartLabelByRange(monthKey, "year"),
          done: count,
        };
      });
      return { habit: h, points, color: HABIT_CHART_COLORS[idx % HABIT_CHART_COLORS.length] };
    });
  }, [
    range,
    habitDefinitions,
    dailyLogsLast7,
    dailyLogsLast28,
    dailyLogsLast365,
    modifiedLogs,
    dailyLog.date,
    dailyLog.habits_status,
  ]);

  if (series.length === 0) return null;

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="chart-legend text-xs font-semibold uppercase tracking-wider">
          {range === "year" ? `${CHART_RANGE_LABELS[range]} (done days)` : CHART_RANGE_LABELS[range]}
        </h3>
        <ChartRangeToggle value={range} onChange={setRange} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {series.map(({ habit, points, color }) => {
          const Icon = getHabitIcon(habit.icon);
          const maxY = range === "year" ? Math.max(...points.map((p) => p.done), 1) : 1;
          return (
            <div
              key={habit.id}
              className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-3"
            >
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Icon className="size-4 text-muted-foreground" style={{ color }} />
                {habit.name}
              </div>
              <div className="h-[100px] min-h-[100px] w-full">
                {(!points || points.length === 0) ? (
                  <div className="flex h-full min-h-[100px] w-full items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/5 text-muted-foreground text-xs">
                    No data yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={100}>
                    <BarChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                      <defs>
                        <linearGradient id={`habit-${habit.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={color} stopOpacity={1} />
                          <stop offset="100%" stopColor={color} stopOpacity={0.35} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="2 2"
                        stroke="rgb(255 255 255 / 0.05)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 9, fill: "rgb(148 163 184)" }}
                        tickLine={false}
                        axisLine={false}
                        interval={range === "month" ? 3 : range === "year" ? 1 : 0}
                      />
                      <YAxis
                        domain={[0, maxY]}
                        tick={{ fontSize: 9, fill: "rgb(148 163 184)" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => (range === "year" ? String(v) : v ? "✓" : "")}
                        hide
                      />
                      <Tooltip
                        cursor={{ fill: "rgb(255 255 255 / 0.06)", radius: 4 }}
                        content={({ active, payload }) =>
                          active && payload?.[0] ? (
                            <div className="chart-tooltip flex items-center gap-2">
                              <span className="chart-label">{payload[0].payload.label}</span>
                              {range === "year" ? (
                                <span className="chart-value-done font-bold tabular-nums">
                                  {payload[0].value} days
                                </span>
                              ) : payload[0].value ? (
                                <span className="chart-value-done font-bold">Done</span>
                              ) : (
                                <span style={{ color: "rgb(148 163 184 / 0.7)" }}>—</span>
                              )}
                            </div>
                          ) : null
                        }
                      />
                      <Bar
                        dataKey="done"
                        fill={`url(#habit-${habit.id})`}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={24}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
