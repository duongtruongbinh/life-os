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
import { mergeLogs } from "@/lib/log-utils";
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
  CHART_RANGE_LABELS,
} from "@/lib/constants";
import {
  CHART_GRADIENTS,
  TOOLTIP_STYLE,
  GRID_STYLE,
  AXIS_STYLE,
  CHART_CONTAINER_CLASSES,
} from "@/lib/chart-theme";
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
        ? mergeLogs(dailyLogsLast7, modifiedLogs)
        : mergeLogs(dailyLogsLast28, modifiedLogs);

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

  const { domain, ticks } = useMemo(() => {
    if (rows.length === 0) return { domain: [21, 33], ticks: [21, 24, 27, 30, 33] };

    let minT = 42;
    let maxT = 18;
    for (const r of rows) {
      minT = Math.min(minT, r.startHour);
      maxT = Math.max(maxT, r.startHour + r.duration);
    }

    if (minT > maxT) {
      return { domain: [21, 33], ticks: [21, 24, 27, 30, 33] };
    }

    // Very tight padding: 0.2 hours (12 mins) to maximize graph space
    const paddedMin = Math.max(18, minT - 0.2);
    const paddedMax = Math.min(42, maxT + 0.2);

    // Generate ticks every 2 hours that fall WITHIN the domain
    const firstTick = Math.ceil(paddedMin / 2) * 2;
    const lastTick = Math.floor(paddedMax / 2) * 2;

    const t = [];
    for (let i = firstTick; i <= lastTick; i += 2) {
      t.push(i);
    }

    // Set domain strictly to padded bounds, do not stretch to fit ticks
    return { domain: [paddedMin, paddedMax], ticks: t };
  }, [rows]);

  const chartHeight = isMobile ? MOBILE_CHART_HEIGHT : SLEEP_CHART_HEIGHT;

  const tickFontSize = isMobile ? 10 : 11;

  if (rows.length === 0) {
    return (
      <div
        className={CHART_CONTAINER_CLASSES.empty}
        style={{ height: chartHeight, minHeight: chartHeight }}
      >
        No sleep data
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={CHART_CONTAINER_CLASSES.legend}>
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
        className={CHART_CONTAINER_CLASSES.wrapper}
        style={{ height: chartHeight, minHeight: chartHeight }}
      >
        <ResponsiveContainer width="100%" height={chartHeight - 32}>
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 12, right: 16, left: 0, bottom: 4 }}
          >
            <defs>
              <linearGradient id={CHART_GRADIENTS.sleep.id} x1="0" y1="0" x2="1" y2="0">
                {CHART_GRADIENTS.sleep.colors.map((stop) => (
                  <stop
                    key={`${stop.color}-${stop.offset}`}
                    offset={stop.offset}
                    stopColor={stop.color}
                    stopOpacity={stop.opacity}
                  />
                ))}
              </linearGradient>
            </defs>
            <CartesianGrid
              {...GRID_STYLE}
              horizontal={false}
              vertical={true}
            />
            <XAxis
              type="number"
              domain={domain}
              ticks={ticks}
              tickFormatter={(v) => formatRelativeTime(v)}
              {...AXIS_STYLE}
              tick={{ ...AXIS_STYLE.tick, fontSize: tickFontSize }}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={isMobile ? 40 : 64}
              {...AXIS_STYLE}
              tick={{ ...AXIS_STYLE.tick, fontSize: tickFontSize }}
              interval={range === "month" ? (isMobile ? 6 : 3) : 0}
            />
            <Tooltip
              cursor={{ fill: "transparent" }}
              wrapperStyle={TOOLTIP_STYLE.wrapperStyle}
              contentStyle={TOOLTIP_STYLE.contentStyle}
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
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-muted-foreground">{p.label}</span>
                    <span className="text-sm font-semibold text-foreground">
                      Bed: {formatRelativeTime(start)} – Wake: {formatRelativeTime(end)}
                    </span>
                    <span className="text-xs font-bold tabular-nums" style={{ color: "var(--color-sleep)" }}>
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
              fill={`url(#${CHART_GRADIENTS.sleep.id})`}
              radius={[6, 6, 6, 6]}
              maxBarSize={24}
              animationDuration={600}
              animationEasing="ease-out"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
