"use client";

import { useMemo } from "react";
import {
  ComposedChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  ReferenceArea,
} from "recharts";
import { getMergedLogs, useLifeOSStore } from "@/store/useLifeOSStore";
import { useIsMobile } from "@/hooks/use-mobile";
import { getLastNDateStrings, formatChartLabel, isoToDecimalHours } from "@/lib/date-utils";
import {
  CHART_DAYS,
  MOBILE_CHART_HEIGHT,
  SLEEP_CHART_HEIGHT,
  CHART_TICK_FONT_SIZE_MOBILE,
  CHART_TICK_FONT_SIZE_DESKTOP,
} from "@/lib/constants";

/** Range bar chart: Each row = date, bar spans sleep_start to sleep_end (hours). */
export function SleepTimelineChart() {
  const dailyLogsLast7 = useLifeOSStore((s) => s.dailyLogsLast7);
  const modifiedLogs = useLifeOSStore((s) => s.modifiedLogs);
  const dailyLog = useLifeOSStore((s) => s.dailyLog);
  const isMobile = useIsMobile();

  const { data, ranges } = useMemo(() => {
    const dates = getLastNDateStrings(CHART_DAYS);
    const data = dates.map((dateStr, i) => {
      const d = new Date(dateStr + "T12:00:00");
      const shortLabel = `${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()]} ${d.getDate()}`;
      return {
        date: dateStr,
        label: shortLabel,
        fullLabel: formatChartLabel(dateStr),
        index: i,
      };
    });

    const ranges: { date: string; label: string; idx: number; x1: number; x2: number }[] = [];

    const mergedLast7 = getMergedLogs(dailyLogsLast7, modifiedLogs);
    dates.forEach((dateStr, idx) => {
      const log = mergedLast7.find((l) => l.date === dateStr);
      const isToday = dateStr === dailyLog.date;
      const start = isToday ? dailyLog.sleep_start : log?.sleep_start ?? null;
      const end = isToday ? dailyLog.sleep_end : log?.sleep_end ?? null;
      const bedH = isoToDecimalHours(start);
      const wakeH = isoToDecimalHours(end);
      if (bedH == null || wakeH == null) return;

      let x1 = bedH;
      let x2 = wakeH;
      if (wakeH <= bedH) x2 = wakeH + 24;

      ranges.push({
        date: dateStr,
        label: formatChartLabel(dateStr),
        idx,
        x1,
        x2,
      });
    });

    return { data, ranges };
  }, [dailyLogsLast7, modifiedLogs, dailyLog.date, dailyLog.sleep_start, dailyLog.sleep_end]);

  const chartHeight = isMobile ? MOBILE_CHART_HEIGHT : SLEEP_CHART_HEIGHT;

  const formatHour = (h: number) => {
    const hh = Math.floor(h) % 24;
    const mm = Math.round((h % 1) * 60);
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  };

  const tickFontSize = isMobile ? CHART_TICK_FONT_SIZE_MOBILE : CHART_TICK_FONT_SIZE_DESKTOP;

  if (ranges.length === 0) {
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
    <div
      className="w-full overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-3"
      style={{ height: chartHeight, minHeight: chartHeight }}
    >
      <ResponsiveContainer width="100%" height={chartHeight - 24}>
        <ComposedChart data={data} layout="vertical" margin={{ top: 12, right: 12, left: 56, bottom: 12 }}>
          <XAxis
            type="number"
            domain={[0, 30]}
            ticks={[0, 6, 12, 18, 24]}
            tickFormatter={(v) => (v === 24 ? "24h" : `${v}h`)}
            tick={{ fontSize: tickFontSize, fill: "rgb(148 163 184)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={56}
            tick={{ fontSize: tickFontSize, fill: "rgb(148 163 184)" }}
            tickLine={false}
            axisLine={false}
            interval={0}
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
              const p = payload[0].payload;
              const r = ranges.find((x) => x.date === p.date);
              if (!r) return null;
              return (
                <div className="chart-tooltip flex flex-col gap-0.5">
                  <span className="chart-label font-medium">{r.label}</span>
                  <span className="text-foreground text-sm">
                    {formatHour(r.x1)} – {formatHour(r.x2 % 24)}
                  </span>
                  <span className="chart-value-sleep text-xs font-semibold tabular-nums">
                    {(r.x2 - r.x1).toFixed(1)}h
                  </span>
                </div>
              );
            }}
          />
          {ranges.map((r) => (
            <ReferenceArea
              key={r.date}
              x1={r.x1}
              x2={r.x2}
              y1={r.idx - 0.35}
              y2={r.idx + 0.35}
              fill="var(--color-sleep)"
              fillOpacity={0.6}
              stroke="var(--color-sleep)"
              strokeOpacity={0.9}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
