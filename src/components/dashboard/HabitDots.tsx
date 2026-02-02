"use client";

import { useMemo } from "react";
import { getMergedLogs, useLifeOSStore } from "@/store/useLifeOSStore";
import { getLastNDateStrings } from "@/lib/date-utils";
import { CHART_DAYS } from "@/lib/constants";

/** 7 dots: last 7 days status. Gray=empty, color=done. Compact for dashboard. */
export function HabitDots({
  habitId,
  color,
}: {
  habitId: string;
  color: string;
}) {
  const dailyLogsLast7 = useLifeOSStore((s) => s.dailyLogsLast7);
  const modifiedLogs = useLifeOSStore((s) => s.modifiedLogs);
  const dailyLog = useLifeOSStore((s) => s.dailyLog);

  const dots = useMemo(() => {
    const mergedLast7 = getMergedLogs(dailyLogsLast7, modifiedLogs);
    return getLastNDateStrings(CHART_DAYS).map((dateStr) => {
      const isToday = dateStr === dailyLog.date;
      const log = isToday ? dailyLog : mergedLast7.find((l) => l.date === dateStr);
      return log?.habits_status?.[habitId] ?? false;
    });
  }, [habitId, dailyLogsLast7, modifiedLogs, dailyLog.date, dailyLog.habits_status]);

  return (
    <div className="flex shrink-0 items-center gap-0.5" title="Last 7 days">
      {dots.map((done, i) => (
        <div
          key={i}
          className="size-2 shrink-0 rounded-full"
          style={{
            backgroundColor: done ? color : "rgb(71 85 105 / 0.4)",
          }}
        />
      ))}
    </div>
  );
}
