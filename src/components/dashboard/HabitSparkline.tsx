"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, ResponsiveContainer } from "recharts";
import { getMergedLogs, useLifeOSStore } from "@/store/useLifeOSStore";
import { getLastNDateStrings, formatChartLabel } from "@/lib/date-utils";
import { CHART_DAYS } from "@/lib/constants";

type Point = { date: string; label: string; done: number };

/** Sparkline for a single habit (last 7 days). compact=true for inline use in habit button. */
export function HabitSparkline({
  habitId,
  color = "var(--color-habit)",
  compact = false,
}: {
  habitId: string;
  color?: string;
  compact?: boolean;
}) {
  const chartHeight = compact ? 20 : 32;
  const dailyLogsLast7 = useLifeOSStore((s) => s.dailyLogsLast7);
  const modifiedLogs = useLifeOSStore((s) => s.modifiedLogs);
  const dailyLog = useLifeOSStore((s) => s.dailyLog);

  const points = useMemo(() => {
    const mergedLast7 = getMergedLogs(dailyLogsLast7, modifiedLogs);
    return getLastNDateStrings(CHART_DAYS).map((dateStr) => {
      const isToday = dateStr === dailyLog.date;
      const log = isToday
        ? dailyLog
        : mergedLast7.find((l) => l.date === dateStr);
      const done = log?.habits_status?.[habitId] ? 1 : 0;
      return {
        date: dateStr,
        label: formatChartLabel(dateStr, true),
        done,
      };
    });
  }, [habitId, dailyLogsLast7, modifiedLogs, dailyLog.date, dailyLog.habits_status]);

  return (
    <div className="w-full" style={{ height: chartHeight }}>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={points} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`spark-${habitId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={1} />
              <stop offset="100%" stopColor={color} stopOpacity={0.3} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            tick={compact ? false : { fontSize: 9 }}
            tickLine={false}
            axisLine={false}
          />
          <Bar
            dataKey="done"
            fill={`url(#spark-${habitId})`}
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
