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
  formatChartLabel,
  formatChartLabelByRange,
  isoToDecimalHours,
  formatRelativeTime,
  type ChartRange,
} from "@/lib/date-utils";
import {
  MOBILE_CHART_HEIGHT,
  SLEEP_CHART_HEIGHT,
  CHART_TICK_FONT_SIZE_MOBILE,
  CHART_TICK_FONT_SIZE_DESKTOP,
  CHART_RANGE_LABELS,
} from "@/lib/constants";
import { ChartRangeToggle } from "./ChartRangeToggle";

/** Vertical bar chart: Each row = date, bar spans sleep_start to sleep_end (relative night hours). */
export function SleepTimelineChart() {
  const dailyLogsLast7 = useLifeOSStore((s) => s.dailyLogsLast7);
  const dailyLogsLast28 = useLifeOSStore((s) => s.dailyLogsLast28);
  const modifiedLogs = useLifeOSStore((s) => s.modifiedLogs);
  const dailyLog = useLifeOSStore((s) => s.dailyLog);
  const isMobile = useIsMobile();
  const [range, setRange] = useState<ChartRange>("week");

  const { rows } = useMemo(() => {
    const dates =
      range === "week" ? getLastNDateStrings(7) : getLastNDateStrings(28);
    const mergedLogs =
      range === "week"
        ? getMergedLogs(dailyLogsLast7, modifiedLogs)
        : getMergedLogs(dailyLogsLast28, modifiedLogs);

    const rows: {
      date: string;
      label: string;
      startHour: number;
      duration: number;
    }[] = [];

    dates.forEach((dateStr) => {
      const log = mergedLogs.find((l) => l.date === dateStr);
      const isToday = dateStr === dailyLog.date;
      const start = isToday ? dailyLog.sleep_start : log?.sleep_start ?? null;
      const end = isToday ? dailyLog.sleep_end : log?.sleep_end ?? null;
      const bedH = isoToDecimalHours(start);
      const wakeH = isoToDecimalHours(end);
      if (bedH == null || wakeH == null) return;

      // Convert to relative night scale: 18-42 (18:00 -> 18:00 next day).
      let startHour = bedH >= 18 ? bedH : bedH + 24;
      let endHour = wakeH >= 18 ? wakeH : wakeH + 24;
      if (endHour <= startHour) {
        endHour += 24;
      }

      // Clamp into [18, 42] so bars stay within the visible window.
      startHour = Math.max(18, Math.min(42, startHour));
      endHour = Math.max(18, Math.min(42, endHour));

      const duration = endHour - startHour;
      if (duration <= 0) return;

      rows.push({
        date: dateStr,
        label:
          range === "week"
            ? formatChartLabel(dateStr)
            : formatChartLabelByRange(dateStr, "month"),
        startHour,
        duration,
      });
    });

    return { rows };
  }, [
    range,
    dailyLogsLast7,
    dailyLogsLast28,
    modifiedLogs,
    dailyLog.date,
    dailyLog.sleep_start,
    dailyLog.sleep_end,
  ]);

  const chartHeight = isMobile ? MOBILE_CHART_HEIGHT : SLEEP_CHART_HEIGHT;

  const tickFontSize = isMobile ? CHART_TICK_FONT_SIZE_MOBILE : CHART_TICK_FONT_SIZE_DESKTOP;

  if (rows.length === 0) {
    return (
      <div
        className="flex w-full items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/5 text-muted-foreground text-sm"
        style={{ height: chartHeight, minHeight: chartHeight }}
      >
        No sleep data
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="chart-legend text-xs font-semibold uppercase tracking-wider">
          {CHART_RANGE_LABELS[range]}
        </p>
        <ChartRangeToggle
          value={range}
          onChange={setRange}
          options={[
            { value: "week", label: "Week" },
            { value: "month", label: "Month" },
          ]}
        />
      </div>
      <div
        className="w-full overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-3"
        style={{ height: chartHeight, minHeight: chartHeight }}
      >
        <ResponsiveContainer width="100%" height={chartHeight - 24}>
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 12, right: 16, left: 64, bottom: 16 }}
          >
            <defs>
              <linearGradient id="sleep-range-gradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--color-sleep)" stopOpacity={0.2} />
                <stop offset="50%" stopColor="var(--color-sleep)" stopOpacity={0.85} />
                <stop offset="100%" stopColor="var(--color-sleep)" stopOpacity={0.5} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              vertical
              stroke="rgb(148 163 184 / 0.18)"
            />
            <XAxis
              type="number"
              domain={[18, 42]}
              ticks={[18, 24, 30, 36]}
              tickFormatter={(v) => formatRelativeTime(v)}
              tick={{ fontSize: tickFontSize, fill: "rgb(148 163 184)" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={64}
              tick={{ fontSize: tickFontSize, fill: "rgb(148 163 184)" }}
              tickLine={false}
              axisLine={false}
              interval={range === "month" ? 3 : 0}
            />
            <Tooltip
              wrapperStyle={{ outline: "none" }}
              contentStyle={{
                background: "rgb(25 28 35 / 0.98)",
                border: "1px solid rgb(255 255 255 / 0.15)",
                borderRadius: "1rem",
                padding: "0.625rem 1rem",
                boxShadow: "0 0 0 1px rgb(255 255 255 / 0.08), 0 20px 40px -12px rgb(0 0 0 / 0.4)",
              }}
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const p = payload[0].payload as {
                  label: string;
                  startHour: number;
                  duration: number;
                };
                const start = p.startHour;
                const end = p.startHour + p.duration;
                return (
                  <div className="chart-tooltip flex flex-col gap-1">
                    <span className="chart-label font-medium">{p.label}</span>
                    <span className="text-foreground text-sm">
                      Bed: {formatRelativeTime(start)} – Wake: {formatRelativeTime(end)}
                    </span>
                    <span className="chart-value-sleep text-xs font-semibold tabular-nums">
                      Total: {p.duration.toFixed(1)}h
                    </span>
                  </div>
                );
              }}
            />
            {/* Invisible bar to offset the visible bar by startHour */}
            <Bar
              dataKey="startHour"
              stackId="sleep"
              fill="transparent"
              isAnimationActive={false}
            />
            <Bar
              dataKey="duration"
              stackId="sleep"
              fill="url(#sleep-range-gradient)"
              radius={[0, 6, 6, 0]}
              maxBarSize={24}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
