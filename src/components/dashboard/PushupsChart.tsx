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
  getLastNMonthKeys,
  formatChartLabelByRange,
  type ChartRange,
} from "@/lib/date-utils";
import {
  MOBILE_CHART_HEIGHT,
  DESKTOP_CHART_HEIGHT,
  CHART_MARGIN,
  CHART_RANGE_LABELS,
} from "@/lib/constants";
import {
  CHART_GRADIENTS,
  TOOLTIP_STYLE,
  GRID_STYLE,
  BAR_STYLE,
  CHART_CONTAINER_CLASSES,
} from "@/lib/chart-theme";
import { ChartRangeToggle } from "./ChartRangeToggle";
import { PushupEditDialog } from "@/components/pushups/PushupEditDialog";

/** Bar chart of push-ups with week/month/year range toggle. Click bar to edit. */
export function PushupsChart() {
  const dailyLogsLast7 = useLifeOSStore((s) => s.dailyLogsLast7);
  const dailyLogsLast28 = useLifeOSStore((s) => s.dailyLogsLast28);
  const dailyLogsLast365 = useLifeOSStore((s) => s.dailyLogsLast365);
  const modifiedLogs = useLifeOSStore((s) => s.modifiedLogs);
  const dailyLog = useLifeOSStore((s) => s.dailyLog);
  const isMobile = useIsMobile();
  const [range, setRange] = useState<ChartRange>("week");
  const [editData, setEditData] = useState<{ date: string; count: number } | null>(null);

  const chartData = useMemo(() => {
    const mergedLast7 = mergeLogs(dailyLogsLast7, modifiedLogs);
    const mergedLast28 = mergeLogs(dailyLogsLast28, modifiedLogs);
    const mergedLast365 = mergeLogs(dailyLogsLast365, modifiedLogs);

    if (range === "week") {
      const dates = getLastNDateStrings(7);
      return dates.map((dateStr) => {
        const log = mergedLast7.find((l) => l.date === dateStr);
        const pushups =
          dateStr === dailyLog.date ? dailyLog.pushup_count : log?.pushup_count ?? 0;
        return { date: dateStr, label: formatChartLabelByRange(dateStr, "week"), pushups };
      });
    }
    if (range === "month") {
      const dates = getLastNDateStrings(28);
      return dates.map((dateStr) => {
        const log = mergedLast28.find((l) => l.date === dateStr);
        const pushups =
          dateStr === dailyLog.date ? dailyLog.pushup_count : log?.pushup_count ?? 0;
        return { date: dateStr, label: formatChartLabelByRange(dateStr, "month"), pushups };
      });
    }
    // year - group by month (no individual day edit for year view)
    const monthKeys = getLastNMonthKeys(12);
    return monthKeys.map((monthKey) => {
      const logs = mergedLast365.filter((l) => l.date.startsWith(monthKey));
      let pushups = logs.reduce((sum, l) => sum + (l.pushup_count ?? 0), 0);
      if (dailyLog.date.startsWith(monthKey)) {
        const existing = logs.find((l) => l.date === dailyLog.date);
        pushups -= existing?.pushup_count ?? 0;
        pushups += dailyLog.pushup_count ?? 0;
      }
      return { date: monthKey, label: formatChartLabelByRange(monthKey, "year"), pushups };
    });
  }, [range, dailyLogsLast7, dailyLogsLast28, dailyLogsLast365, modifiedLogs, dailyLog.date, dailyLog.pushup_count]);

  const chartHeight = isMobile ? MOBILE_CHART_HEIGHT : DESKTOP_CHART_HEIGHT;
  const tickFontSize = isMobile ? 10 : 11;

  const handleBarClick = (data: { date: string; pushups: number }) => {
    if (range === "year") return;
    setEditData({ date: data.date, count: data.pushups });
  };

  const gradient = CHART_GRADIENTS.pushup;

  return (
    <div className="min-h-0 flex-1">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className={CHART_CONTAINER_CLASSES.legend}>
          {CHART_RANGE_LABELS[range]}
        </p>
        <ChartRangeToggle value={range} onChange={setRange} />
      </div>
      <div
        className={CHART_CONTAINER_CLASSES.wrapper}
        style={{ height: chartHeight, minHeight: chartHeight }}
      >
        {(!chartData || chartData.length === 0) ? (
          <div className={CHART_CONTAINER_CLASSES.empty} style={{ height: "100%" }}>
            No push-up data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={chartHeight - 32}>
            <BarChart data={chartData} margin={CHART_MARGIN}>
              <defs>
                <linearGradient id={gradient.id} x1="0" y1="0" x2="0" y2="1">
                  {gradient.colors.map((stop) => (
                    <stop
                      key={`${stop.color}-${stop.offset}`}
                      offset={stop.offset}
                      stopColor={stop.color}
                      stopOpacity={stop.opacity}
                    />
                  ))}
                </linearGradient>
              </defs>
              <CartesianGrid {...GRID_STYLE} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: tickFontSize, fill: "rgb(120, 130, 150)", fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
                interval={range === "month" ? 3 : 0}
              />
              <YAxis
                tick={{ fontSize: tickFontSize, fill: "rgb(120, 130, 150)", fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                hide={isMobile}
                width={32}
              />
              <Tooltip
                cursor={TOOLTIP_STYLE.cursor}
                wrapperStyle={TOOLTIP_STYLE.wrapperStyle}
                contentStyle={TOOLTIP_STYLE.contentStyle}
                content={({ active, payload }) =>
                  active && payload?.[0] ? (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium text-muted-foreground">
                        {payload[0].payload.label}
                      </span>
                      <span
                        className="text-lg font-bold tabular-nums"
                        style={{ color: "var(--color-pushup)" }}
                      >
                        {payload[0].value} push-ups
                      </span>
                      {range !== "year" && (
                        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wide">
                          Click to edit
                        </span>
                      )}
                    </div>
                  ) : null
                }
              />
              <Bar
                dataKey="pushups"
                fill={`url(#${gradient.id})`}
                radius={BAR_STYLE.radius}
                maxBarSize={BAR_STYLE.maxBarSize}
                onClick={(data: unknown) => {
                  const payload = (data as { payload?: { date: string; pushups: number } }).payload;
                  if (payload) handleBarClick(payload);
                }}
                style={{ cursor: range !== "year" ? "pointer" : "default" }}
                animationDuration={600}
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {editData && (
        <PushupEditDialog
          date={editData.date}
          currentCount={editData.count}
          open={!!editData}
          onOpenChange={(open) => !open && setEditData(null)}
        />
      )}
    </div>
  );
}
