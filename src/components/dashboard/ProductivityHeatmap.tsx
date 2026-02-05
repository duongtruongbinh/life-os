"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { useLifeOSStore, getMergedLogs } from "@/store/useLifeOSStore";
import { getLocalDateKey } from "@/lib/date-utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const CELL_SIZE_DESKTOP = 12;
const CELL_SIZE_MOBILE = 10;
const GAP = 4;
const LABEL_HEIGHT = 14;
const EMPTY = "rgb(71 85 105 / 0.2)";
const RANGE_START = "2026-01-01";
const YEAR_END_SUFFIX = "-12-31";

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function intensityColor(score: number): string {
  if (score <= 0) return EMPTY;
  // Use CSS variable --color-habit for theme consistency
  if (score <= 0.25) return "color-mix(in oklch, var(--color-habit) 28%, transparent)";
  if (score <= 0.5) return "color-mix(in oklch, var(--color-habit) 48%, transparent)";
  if (score <= 0.75) return "color-mix(in oklch, var(--color-habit) 68%, transparent)";
  return "color-mix(in oklch, var(--color-habit) 90%, transparent)";
}

function getRangeByWeeks(startKey: string, endKey: string): string[] {
  const start = new Date(startKey + "T12:00:00");
  const end = new Date(endKey + "T12:00:00");

  const startSun = new Date(start);
  startSun.setDate(startSun.getDate() - startSun.getDay());
  const endSat = new Date(end);
  endSat.setDate(endSat.getDate() + (6 - endSat.getDay()));

  const out: string[] = [];
  for (let d = new Date(startSun); d <= endSat; d.setDate(d.getDate() + 1)) {
    out.push(getLocalDateKey(d));
  }
  return out;
}

/** All-in-one GitHub-style heatmap from 2026 onwards (client local time). */
export function ProductivityHeatmap() {
  const dailyLogsLast365 = useLifeOSStore((s) => s.dailyLogsLast365);
  const modifiedLogs = useLifeOSStore((s) => s.modifiedLogs);
  const dailyLog = useLifeOSStore((s) => s.dailyLog);
  const habitDefinitions = useLifeOSStore((s) => s.habitDefinitions);
  const userSettings = useLifeOSStore((s) => s.userSettings);
  const tasks = useLifeOSStore((s) => s.tasks);
  const isMobile = useIsMobile();
  const cellSize = isMobile ? CELL_SIZE_MOBILE : CELL_SIZE_DESKTOP;

  const { dates, cols, monthSpans, dayLabels, scoreByDate, breakdownByDate, todayKey, endRangeKey } = useMemo(() => {
    const todayKey = getLocalDateKey();
    const year = Number(todayKey.slice(0, 4));
    const endRangeKey = `${year}${YEAR_END_SUFFIX}`;

    // Extend through future days (until end of year) so the heatmap isn't limited to "today".
    const dates = getRangeByWeeks(RANGE_START, endRangeKey);
    const cols = Math.floor(dates.length / 7);

    const merged = getMergedLogs(dailyLogsLast365, { ...modifiedLogs, [dailyLog.date]: dailyLog });
    const logByDate = new Map(merged.map((l) => [l.date, l]));

    const pad = (n: number) => String(n).padStart(2, "0");
    const tasksDoneByDate: Record<string, number> = {};
    for (const t of tasks) {
      if (!t.completed_at) continue;
      const d = getLocalDateKey(new Date(t.completed_at));
      tasksDoneByDate[d] = (tasksDoneByDate[d] ?? 0) + 1;
    }

    const habitTotal = habitDefinitions.length;
    const pushupGoal = userSettings?.pushup_goal ?? 50;

    const scoreByDate: Record<string, number> = {};
    const breakdownByDate: Record<
      string,
      { habitsDone: number; habitTotal: number; pushups: number; pushupGoal: number; tasksDone: number }
    > = {};
    for (const date of dates) {
      if (date < RANGE_START || date > endRangeKey) {
        scoreByDate[date] = 0;
        continue;
      }
      // Future days are shown (empty / score 0) but have no breakdown.
      if (date > todayKey) {
        scoreByDate[date] = 0;
        continue;
      }
      const log = logByDate.get(date);
      const habitsDone =
        habitTotal > 0
          ? habitDefinitions.filter((h) => log?.habits_status?.[h.id]).length
          : 0;
      const habitsRatio = habitTotal > 0 ? habitsDone / habitTotal : 0;
      const pushups = log?.pushup_count ?? 0;
      const pushupRatio = clamp01(pushups / Math.max(pushupGoal, 1));
      const tasksDone = tasksDoneByDate[date] ?? 0;
      const tasksRatio = clamp01(tasksDone / 5);
      const score = (habitsRatio + pushupRatio + tasksRatio) / 3;
      scoreByDate[date] = clamp01(score);
      breakdownByDate[date] = { habitsDone, habitTotal, pushups, pushupGoal, tasksDone };
    }

    const monthSpans: { label: string; colStart: number; colEnd: number }[] = [];
    let curMonth = "";
    let curStart = 0;
    for (let c = 0; c <= cols; c++) {
      const idx = c * 7;
      const d = idx < dates.length ? new Date(dates[idx] + "T12:00:00") : null;
      const monthKey = d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}` : "";
      if (c > 0 && (monthKey !== curMonth || c === cols)) {
        if (curMonth) {
          monthSpans.push({
            label: format(new Date(dates[curStart * 7] + "T12:00:00"), "MMM"),
            colStart: curStart,
            colEnd: c,
          });
        }
        curMonth = monthKey;
        curStart = c;
      } else if (c === 0) {
        curMonth = monthKey;
        curStart = 0;
      }
    }

    const dayLabels = isMobile
      ? ["S", "M", "T", "W", "T", "F", "S"]
      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return { dates, cols, monthSpans, dayLabels, scoreByDate, breakdownByDate, todayKey, endRangeKey };
  }, [
    dailyLogsLast365,
    modifiedLogs,
    dailyLog.date,
    dailyLog.habits_status,
    habitDefinitions,
    userSettings?.pushup_goal,
    tasks,
    isMobile,
  ]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
          Productivity
        </h2>
        <div className="chart-legend flex items-center gap-1 text-xs">
          <span>Less</span>
          {[0.15, 0.35, 0.6, 0.9].map((s) => (
            <span
              key={s}
              className="heatmap-cell inline-block rounded-[3px]"
              style={{
                width: cellSize,
                height: cellSize,
                background: intensityColor(s),
              }}
            />
          ))}
          <span>More</span>
        </div>
      </div>

      <TooltipProvider delayDuration={150}>
        <div className="heatmap-scroll w-full overflow-x-auto overflow-y-hidden pb-1">
          <div className="flex shrink-0 gap-1">
            <div className="flex shrink-0 flex-col justify-end gap-1" style={{ width: 36 }}>
              <div style={{ height: Math.max(LABEL_HEIGHT, cellSize) }} aria-hidden />
              {dayLabels.map((l) => (
                <div
                  key={l}
                  className="chart-legend text-xs"
                  style={{ height: cellSize }}
                >
                  {l}
                </div>
              ))}
            </div>

            <div
              className="grid shrink-0 gap-1"
              style={{
                gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
                gridTemplateRows: `${Math.max(LABEL_HEIGHT, cellSize)}px repeat(7, ${cellSize}px)`,
                minWidth: cols * cellSize + (cols - 1) * GAP,
              }}
            >
              {monthSpans.map((m, i) => (
                <span
                  key={i}
                  className="chart-legend text-xs"
                  style={{
                    gridColumn: `${m.colStart + 1} / ${m.colEnd + 1}`,
                    gridRow: 1,
                    textAlign: "center",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                  }}
                >
                  {m.label}
                </span>
              ))}

              {dates.map((dateStr, i) => {
                const inRange = dateStr >= RANGE_START && dateStr <= endRangeKey;
                const isFuture = dateStr > todayKey;
                const row = i % 7;
                const col = Math.floor(i / 7);
                const score = scoreByDate[dateStr] ?? 0;
                const bg = intensityColor(score);
                const pretty = format(new Date(dateStr + "T12:00:00"), "EEE MMM d, yyyy");
                const pct = `${Math.round(score * 100)}%`;
                const b = breakdownByDate[dateStr];
                if (!inRange) {
                  return (
                    <div
                      key={dateStr}
                      className="heatmap-cell"
                      style={{
                        gridRow: row + 2,
                        gridColumn: col + 1,
                        width: cellSize,
                        height: cellSize,
                        borderRadius: 3,
                        background: "transparent",
                        opacity: 0,
                      }}
                      aria-hidden
                    />
                  );
                }
                const cell = (
                  <div
                    className="heatmap-cell"
                    style={{
                      gridRow: row + 2,
                      gridColumn: col + 1,
                      width: cellSize,
                      height: cellSize,
                      borderRadius: 3,
                      background: bg,
                      opacity: isFuture ? 0.6 : 1,
                    }}
                    aria-label={`${pretty}: ${pct}`}
                  />
                );
                return (
                  <Tooltip key={dateStr} delayDuration={150}>
                    <TooltipTrigger asChild>{cell}</TooltipTrigger>
                    <TooltipContent side="top" className="chart-tooltip text-xs">
                      <div className="flex flex-col gap-0.5">
                        <div className="text-sm font-semibold text-foreground">{pretty}</div>
                        <div className="chart-label text-xs">
                          {isFuture ? "Future day" : `Intensity: ${pct}`}
                        </div>
                        {!isFuture && b && (
                          <div className="chart-label mt-1 text-xs">
                            Habits: {b.habitsDone}/{b.habitTotal || 0} · Pushups: {b.pushups}/{b.pushupGoal} · Tasks: {b.tasksDone}/5
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
}

