"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
  Area,
} from "recharts";
import { useLifeOSStore } from "@/store/useLifeOSStore";
import { mergeLogs } from "@/lib/log-utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  getLastNDateStrings,
  getLastNMonthKeys,
  formatChartLabel,
  formatChartLabelByRange,
  isoToDecimalHours,
  averageRelativeTimes,
  type ChartRange,
} from "@/lib/date-utils";
import {
  MOBILE_CHART_HEIGHT,
  SLEEP_CHART_HEIGHT,
  CHART_RANGE_LABELS,
} from "@/lib/constants";
import {
  TOOLTIP_STYLE,
  GRID_STYLE,
  AXIS_STYLE,
  CHART_CONTAINER_CLASSES,
} from "@/lib/chart-theme";
import { ChartRangeToggle } from "./ChartRangeToggle";

/** Line chart: Bed time and Wake time (as decimal hours) with Week/Month/Year range toggle. */
export default function SleepTimingChart() {
  const dailyLogsLast7 = useLifeOSStore((s) => s.dailyLogsLast7);
  const dailyLogsLast28 = useLifeOSStore((s) => s.dailyLogsLast28);
  const dailyLogsLast365 = useLifeOSStore((s) => s.dailyLogsLast365);
  const modifiedLogs = useLifeOSStore((s) => s.modifiedLogs);
  const dailyLog = useLifeOSStore((s) => s.dailyLog);
  const isMobile = useIsMobile();
  const [range, setRange] = useState<ChartRange>("week");

  const data = useMemo(() => {
    const formatHour = (h: number) => {
      const hh = Math.floor(h) % 24;
      const mm = Math.round((h % 1) * 60);
      return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
    };

    if (range === "week") {
      const mergedLast7 = mergeLogs(dailyLogsLast7, modifiedLogs);
      return getLastNDateStrings(7).map((dateStr) => {
        const log = mergedLast7.find((l) => l.date === dateStr);
        const isToday = dateStr === dailyLog.date;
        const start = isToday ? dailyLog.sleep_start : log?.sleep_start ?? null;
        const end = isToday ? dailyLog.sleep_end : log?.sleep_end ?? null;
        const bedH = isoToDecimalHours(start);
        const wakeH = isoToDecimalHours(end);
        const bedDisplay = bedH != null ? (bedH >= 18 ? bedH : bedH + 24) : undefined;
        const wakeDisplay = wakeH != null ? (wakeH <= 11 ? wakeH + 24 : wakeH) : undefined;
        return {
          date: dateStr,
          label: formatChartLabel(dateStr),
          bedTime: bedDisplay,
          wakeTime: wakeDisplay,
          bedLabel: bedH != null ? formatHour(bedH) : undefined,
          wakeLabel: wakeH != null ? formatHour(wakeH) : undefined,
        };
      });
    }

    if (range === "month") {
      const mergedLast28 = mergeLogs(dailyLogsLast28, modifiedLogs);
      return getLastNDateStrings(28).map((dateStr) => {
        const log = mergedLast28.find((l) => l.date === dateStr);
        const isToday = dateStr === dailyLog.date;
        const start = isToday ? dailyLog.sleep_start : log?.sleep_start ?? null;
        const end = isToday ? dailyLog.sleep_end : log?.sleep_end ?? null;
        const bedH = isoToDecimalHours(start);
        const wakeH = isoToDecimalHours(end);
        const bedDisplay = bedH != null ? (bedH >= 18 ? bedH : bedH + 24) : undefined;
        const wakeDisplay = wakeH != null ? (wakeH <= 11 ? wakeH + 24 : wakeH) : undefined;
        return {
          date: dateStr,
          label: formatChartLabelByRange(dateStr, "month"),
          bedTime: bedDisplay,
          wakeTime: wakeDisplay,
          bedLabel: bedH != null ? formatHour(bedH) : undefined,
          wakeLabel: wakeH != null ? formatHour(wakeH) : undefined,
        };
      });
    }

    // Year view: Monthly averages.
    const mergedLast365 = mergeLogs(dailyLogsLast365, modifiedLogs);
    const monthKeys = getLastNMonthKeys(12);
    return monthKeys.map((monthKey) => {
      const logs = mergedLast365.filter((l) => l.date.startsWith(monthKey));
      if (dailyLog.date.startsWith(monthKey) && !logs.some((l) => l.date === dailyLog.date)) {
        logs.push(dailyLog);
      }

      const bedHours: number[] = [];
      const wakeHours: number[] = [];

      logs.forEach((log) => {
        const isToday = log.date === dailyLog.date;
        const start = isToday ? dailyLog.sleep_start : log.sleep_start;
        const end = isToday ? dailyLog.sleep_end : log.sleep_end;
        const bedH = isoToDecimalHours(start);
        const wakeH = isoToDecimalHours(end);

        if (bedH != null) {
          bedHours.push(bedH >= 18 ? bedH : bedH + 24);
        }
        if (wakeH != null) {
          wakeHours.push(wakeH <= 11 ? wakeH + 24 : wakeH);
        }
      });

      const avgBed = averageRelativeTimes(bedHours);
      const avgWake = averageRelativeTimes(wakeHours);

      return {
        date: monthKey,
        label: formatChartLabelByRange(monthKey, "year"),
        bedTime: avgBed ?? undefined,
        wakeTime: avgWake ?? undefined,
        bedLabel: avgBed != null ? formatHour(avgBed % 24) : undefined,
        wakeLabel: avgWake != null ? formatHour(avgWake % 24) : undefined,
      };
    });
  }, [
    range,
    dailyLogsLast7,
    dailyLogsLast28,
    dailyLogsLast365,
    modifiedLogs,
    dailyLog,
  ]);

  const { domain, ticks } = useMemo(() => {
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    for (const d of data) {
      if (d.bedTime != null) {
        min = Math.min(min, d.bedTime);
        max = Math.max(max, d.bedTime);
      }
      if (d.wakeTime != null) {
        min = Math.min(min, d.wakeTime);
        max = Math.max(max, d.wakeTime);
      }
    }
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      return { domain: [21, 33], ticks: [21, 24, 27, 30, 33] };
    }

    // Very tight padding: 0.2 hours (12 mins)
    const paddedMin = Math.max(18, min - 0.2);
    const paddedMax = Math.min(42, max + 0.2);

    const firstTick = Math.ceil(paddedMin / 2) * 2;
    const lastTick = Math.floor(paddedMax / 2) * 2;

    const t = [];
    for (let i = firstTick; i <= lastTick; i += 2) {
      t.push(i);
    }

    // Absolute bounding limit to push chart edges to fill layout
    return { domain: [paddedMin, paddedMax], ticks: t };
  }, [data]);

  const chartHeight = isMobile ? MOBILE_CHART_HEIGHT : SLEEP_CHART_HEIGHT;

  const hasData = data.some((d) => d.bedTime != null || d.wakeTime != null);
  const tickFontSize = isMobile ? 10 : 11;

  if (!hasData) {
    return (
      <div
        className={CHART_CONTAINER_CLASSES.empty}
        style={{ height: chartHeight, minHeight: chartHeight }}
      >
        No bed/wake data
      </div>
    );
  }

  const formatHour = (h: number) => {
    const hh = Math.floor(h) % 24;
    const mm = Math.round((h % 1) * 60);
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  };
  const formatYLabel = (h: number) => {
    const h24 = h > 24 ? h - 24 : h;
    return formatHour(h24);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={CHART_CONTAINER_CLASSES.legend}>
          {CHART_RANGE_LABELS[range]}
        </p>
        <ChartRangeToggle value={range} onChange={setRange} />
      </div>
      <div
        className={CHART_CONTAINER_CLASSES.wrapper}
        style={{ height: chartHeight, minHeight: chartHeight }}
      >
        <ResponsiveContainer width="100%" height={chartHeight - 32}>
          <LineChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 4 }}>
            <defs>
              <linearGradient id="sleep-bed-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-sleep)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--color-sleep)" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="sleep-wake-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.7 0.18 80)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="oklch(0.7 0.18 80)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid {...GRID_STYLE} />
            <XAxis
              dataKey="label"
              {...AXIS_STYLE}
              tick={{ ...AXIS_STYLE.tick, fontSize: tickFontSize }}
              interval={range === "month" ? (isMobile ? 6 : 3) : range === "year" ? 0 : 0}
            />
            <YAxis
              domain={domain}
              ticks={ticks}
              tickFormatter={(v) => formatYLabel(v)}
              {...AXIS_STYLE}
              tick={{ ...AXIS_STYLE.tick, fontSize: tickFontSize }}
              width={isMobile ? 36 : 44}
            />
            <Tooltip
              cursor={TOOLTIP_STYLE.cursor}
              wrapperStyle={TOOLTIP_STYLE.wrapperStyle}
              contentStyle={TOOLTIP_STYLE.contentStyle}
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-muted-foreground">{payload[0]?.payload.label}</span>
                    {payload[0]?.payload.bedLabel != null && (
                      <span className="text-sm font-semibold" style={{ color: "var(--color-sleep)" }}>Bed: {payload[0].payload.bedLabel}</span>
                    )}
                    {payload[0]?.payload.wakeLabel != null && (
                      <span className="text-sm font-semibold" style={{ color: "oklch(0.7 0.18 80)" }}>Wake: {payload[0].payload.wakeLabel}</span>
                    )}
                  </div>
                ) : null
              }
            />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: "8px" }} className={CHART_CONTAINER_CLASSES.legend} />
            <Area
              type="natural"
              dataKey="bedTime"
              stroke="none"
              fill="url(#sleep-bed-gradient)"
              fillOpacity={1}
              connectNulls
              animationDuration={600}
            />
            <Area
              type="natural"
              dataKey="wakeTime"
              stroke="none"
              fill="url(#sleep-wake-gradient)"
              fillOpacity={1}
              connectNulls
              animationDuration={600}
            />
            <Line
              type="natural"
              dataKey="bedTime"
              name="Bed"
              stroke="var(--color-sleep)"
              strokeWidth={2.5}
              strokeDasharray="6 4"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: "var(--color-sleep)" }}
              connectNulls
              animationDuration={600}
            />
            <Line
              type="natural"
              dataKey="wakeTime"
              name="Wake"
              stroke="oklch(0.7 0.18 80)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: "oklch(0.7 0.18 80)" }}
              connectNulls
              animationDuration={600}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
