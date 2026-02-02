"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { getMergedLogs, useLifeOSStore } from "@/store/useLifeOSStore";
import { useIsMobile } from "@/hooks/use-mobile";
import { getLastNDateStrings, formatChartLabel, isoToDecimalHours } from "@/lib/date-utils";
import {
  CHART_DAYS,
  MOBILE_CHART_HEIGHT,
  SLEEP_CHART_HEIGHT,
  CHART_MARGIN_WITH_Y,
  CHART_TICK_FONT_SIZE_MOBILE,
  CHART_TICK_FONT_SIZE_DESKTOP,
} from "@/lib/constants";

/** Line chart: Bed time and Wake time (as decimal hours) over last 7 days. */
export function SleepTimingChart() {
  const dailyLogsLast7 = useLifeOSStore((s) => s.dailyLogsLast7);
  const modifiedLogs = useLifeOSStore((s) => s.modifiedLogs);
  const dailyLog = useLifeOSStore((s) => s.dailyLog);
  const isMobile = useIsMobile();

  const data = useMemo(() => {
    const formatHour = (h: number) => {
      const hh = Math.floor(h) % 24;
      const mm = Math.round((h % 1) * 60);
      return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
    };
    const mergedLast7 = getMergedLogs(dailyLogsLast7, modifiedLogs);
    return getLastNDateStrings(CHART_DAYS).map((dateStr) => {
      const log = mergedLast7.find((l) => l.date === dateStr);
      const isToday = dateStr === dailyLog.date;
      const start = isToday ? dailyLog.sleep_start : log?.sleep_start ?? null;
      const end = isToday ? dailyLog.sleep_end : log?.sleep_end ?? null;
      const bedH = isoToDecimalHours(start);
      const wakeH = isoToDecimalHours(end);
      const bedDisplay = bedH != null ? (bedH >= 12 ? bedH : bedH + 24) : undefined;
      const wakeDisplay = wakeH != null ? (wakeH < 12 ? wakeH + 24 : wakeH) : undefined;
      return {
        date: dateStr,
        label: formatChartLabel(dateStr),
        bedTime: bedDisplay,
        wakeTime: wakeDisplay,
        bedLabel: bedH != null ? formatHour(bedH) : undefined,
        wakeLabel: wakeH != null ? formatHour(wakeH) : undefined,
      };
    });
  }, [dailyLogsLast7, modifiedLogs, dailyLog.date, dailyLog.sleep_start, dailyLog.sleep_end]);

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
    <div
      className="w-full overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-3"
      style={{ height: chartHeight, minHeight: chartHeight }}
    >
      <ResponsiveContainer width="100%" height={chartHeight - 24}>
        <LineChart data={data} margin={CHART_MARGIN_WITH_Y}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(255 255 255 / 0.06)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: tickFontSize, fill: "rgb(148 163 184)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[18, 34]}
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
          <Line
            type="monotone"
            dataKey="bedTime"
            name="Bed"
            stroke="var(--color-sleep)"
            strokeWidth={3}
            dot={{ r: 4 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="wakeTime"
            name="Wake"
            stroke="var(--color-habit)"
            strokeWidth={3}
            dot={{ r: 4 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
