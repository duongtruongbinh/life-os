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
import { getMergedLogs, useLifeOSStore } from "@/store/useLifeOSStore";
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
  CHART_MARGIN_WITH_Y,
  CHART_TICK_FONT_SIZE_MOBILE,
  CHART_TICK_FONT_SIZE_DESKTOP,
  CHART_RANGE_LABELS,
} from "@/lib/constants";
import { ChartRangeToggle } from "./ChartRangeToggle";

/** Line chart: Bed time and Wake time (as decimal hours) with Week/Month/Year range toggle. */
export function SleepTimingChart() {
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
      const mergedLast7 = getMergedLogs(dailyLogsLast7, modifiedLogs);
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
      const mergedLast28 = getMergedLogs(dailyLogsLast28, modifiedLogs);
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
    const mergedLast365 = getMergedLogs(dailyLogsLast365, modifiedLogs);
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
    dailyLog.date,
    dailyLog.sleep_start,
    dailyLog.sleep_end,
  ]);

  const { minY, maxY } = useMemo(() => {
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
      return { minY: 18, maxY: 34 };
    }
    const paddedMin = Math.max(18, Math.floor(min - 0.5));
    const paddedMax = Math.min(34, Math.ceil(max + 0.5));
    return { minY: paddedMin, maxY: paddedMax };
  }, [data]);

  const chartHeight = isMobile ? MOBILE_CHART_HEIGHT : SLEEP_CHART_HEIGHT;

  const hasData = data.some((d) => d.bedTime != null || d.wakeTime != null);
  const tickFontSize = isMobile ? CHART_TICK_FONT_SIZE_MOBILE : CHART_TICK_FONT_SIZE_DESKTOP;

  if (!hasData) {
    return (
      <div
        className="flex w-full items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/5 text-muted-foreground text-sm"
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
        <p className="chart-legend text-xs font-semibold uppercase tracking-wider">
          {CHART_RANGE_LABELS[range]}
        </p>
        <ChartRangeToggle value={range} onChange={setRange} />
      </div>
      <div
        className="w-full overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-3"
        style={{ height: chartHeight, minHeight: chartHeight }}
      >
        <ResponsiveContainer width="100%" height={chartHeight - 24}>
          <LineChart data={data} margin={CHART_MARGIN_WITH_Y}>
            <defs>
              <linearGradient id="sleep-bed-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-sleep)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="var(--color-sleep)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="sleep-wake-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.7 0.18 80)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="oklch(0.7 0.18 80)" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgb(255 255 255 / 0.06)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: tickFontSize, fill: "rgb(148 163 184)" }}
              tickLine={false}
              axisLine={false}
              interval={range === "month" ? 3 : range === "year" ? 0 : 0}
            />
            <YAxis
              domain={[minY, maxY]}
              ticks={[18, 21, 24, 27, 30, 33]}
              tickFormatter={(v) => formatYLabel(v)}
              tick={{ fontSize: tickFontSize, fill: "rgb(148 163 184)" }}
              tickLine={false}
              axisLine={false}
              width={isMobile ? 36 : 44}
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
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <div className="chart-tooltip flex flex-col gap-1">
                    <span className="chart-label font-medium">{payload[0]?.payload.label}</span>
                    {payload[0]?.payload.bedLabel != null && (
                      <span>Bed: {payload[0].payload.bedLabel}</span>
                    )}
                    {payload[0]?.payload.wakeLabel != null && (
                      <span>Wake: {payload[0].payload.wakeLabel}</span>
                    )}
                  </div>
                ) : null
              }
            />
            <Legend wrapperStyle={{ fontSize: 11 }} className="chart-legend" />
            <Area
              type="monotone"
              dataKey="bedTime"
              stroke="none"
              fill="url(#sleep-bed-gradient)"
              fillOpacity={1}
              connectNulls
            />
            <Area
              type="monotone"
              dataKey="wakeTime"
              stroke="none"
              fill="url(#sleep-wake-gradient)"
              fillOpacity={1}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="bedTime"
              name="Bed"
              stroke="var(--color-sleep)"
              strokeWidth={2.5}
              strokeDasharray="6 4"
              dot={{ r: 3.5, strokeWidth: 0, fill: "var(--color-sleep)" }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="wakeTime"
              name="Wake"
              stroke="oklch(0.7 0.18 80)"
              strokeWidth={2.5}
              dot={{ r: 3.5, strokeWidth: 0, fill: "oklch(0.7 0.18 80)" }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
