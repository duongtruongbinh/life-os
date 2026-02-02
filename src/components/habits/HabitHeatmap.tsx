"use client";

import { useMemo, useRef, useEffect } from "react";
import { useLifeOSStore } from "@/store/useLifeOSStore";
import { getDateStringsForYearByWeeks } from "@/lib/date-utils";
import { format } from "date-fns";
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
const LABEL_WIDTH_DESKTOP = 36;
const LABEL_WIDTH_MOBILE = 28;

const GRAY_EMPTY = "rgb(71 85 105 / 0.2)";

function getAllModeColor(ratio: number): string {
  if (ratio <= 0) return GRAY_EMPTY;
  const opacity = 0.3 + ratio * 0.7;
  return `rgb(34 197 94 / ${opacity})`;
}

export type HabitHeatmapProps =
  | {
    mode: "all";
    habitDefinitions: { id: string; name: string }[];
    year: number;
    yearLogs: { date: string; habits_status?: Record<string, boolean> }[];
  }
  | {
    mode: "single";
    habitId: string;
    habitName: string;
    color: string;
    year: number;
    yearLogs: { date: string; habits_status?: Record<string, boolean> }[];
  };

/** GitHub-style grid: 7 rows x N cols. Supports "all" (percentage intensity) or "single" (boolean) mode. */
export function HabitHeatmap(props: HabitHeatmapProps) {
  const dailyLog = useLifeOSStore((s) => s.dailyLog);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const cellSize = isMobile ? CELL_SIZE_MOBILE : CELL_SIZE_DESKTOP;
  const labelWidth = isMobile ? LABEL_WIDTH_MOBILE : LABEL_WIDTH_DESKTOP;
  const { year, yearLogs } = props;

  const { cells, monthSpans, todayCol, cols, title } = useMemo(() => {
    const datesArr = getDateStringsForYearByWeeks(year);
    const cols = datesArr.length / 7;
    const yearPrefix = `${year}-`;

    type CellData =
      | { date: string; row: number; col: number; mode: "single"; done: boolean }
      | {
        date: string;
        row: number;
        col: number;
        mode: "all";
        ratio: number;
        doneNames: string[];
      };

    const cells: CellData[] = [];

    if (props.mode === "single") {
      const { habitId } = props;
      for (let i = 0; i < datesArr.length; i++) {
        const dateStr = datesArr[i];
        if (!dateStr.startsWith(yearPrefix)) continue;
        const row = Math.floor(i % 7);
        const col = Math.floor(i / 7);
        const isToday = dateStr === dailyLog.date;
        const log = isToday ? dailyLog : yearLogs.find((l) => l.date === dateStr);
        const done = (log?.habits_status?.[habitId] ?? false) === true;
        cells.push({ date: dateStr, done, row, col, mode: "single" });
      }
    } else {
      const { habitDefinitions } = props;
      const ids = habitDefinitions.map((h) => h.id);
      const nameById = Object.fromEntries(habitDefinitions.map((h) => [h.id, h.name]));
      const total = ids.length || 1;

      for (let i = 0; i < datesArr.length; i++) {
        const dateStr = datesArr[i];
        if (!dateStr.startsWith(yearPrefix)) continue;
        const row = Math.floor(i % 7);
        const col = Math.floor(i / 7);
        const isToday = dateStr === dailyLog.date;
        const log = isToday ? dailyLog : yearLogs.find((l) => l.date === dateStr);
        const status = log?.habits_status ?? {};
        const doneNames = ids.filter((id) => status[id]).map((id) => nameById[id] ?? id);
        const ratio = doneNames.length / total;
        cells.push({ date: dateStr, row, col, mode: "all", ratio, doneNames });
      }
    }

    const monthSpans: { label: string; colStart: number; colEnd: number }[] = [];
    let curMonth = "";
    let curStart = 0;
    for (let c = 0; c <= cols; c++) {
      const firstDayIdx = c * 7;
      const d =
        firstDayIdx < datesArr.length
          ? new Date(datesArr[firstDayIdx] + "T12:00:00")
          : null;
      const monthKey = d ? `${d.getFullYear()}-${d.getMonth()}` : "";
      if (c > 0 && (monthKey !== curMonth || c === cols)) {
        if (curMonth) {
          monthSpans.push({
            label: format(new Date(datesArr[curStart * 7] + "T12:00:00"), "MMM"),
            colStart: curStart,
            colEnd: c,
          });
        }
        curMonth = monthKey;
        curStart = c;
      }
    }
    const todayIdx = datesArr.findIndex((d) => d === dailyLog.date);
    const todayCol = todayIdx >= 0 ? Math.floor(todayIdx / 7) : cols - 1;
    const title = props.mode === "single" ? props.habitName : "All Activity";
    return { cells, monthSpans, todayCol, cols, title };
  }, [
    year,
    yearLogs,
    dailyLog.date,
    dailyLog.habits_status,
    props.mode,
    ...(props.mode === "single" ? [props.habitId] : [props.habitDefinitions]),
  ]);

  const dayLabels = isMobile
    ? ["S", "M", "T", "W", "T", "F", "S"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const colWidth = cellSize + GAP;
    const dataAreaLeft = labelWidth + GAP;
    const colCenter = dataAreaLeft + todayCol * colWidth + cellSize / 2;
    el.scrollLeft = Math.max(0, colCenter - el.clientWidth / 2);
  }, [todayCol, labelWidth, cellSize]);

  return (
    <div className="space-y-2">
      <p className="chart-legend text-sm font-medium">{title}</p>
      <TooltipProvider delayDuration={150}>
        <div
          ref={scrollRef}
          className="heatmap-scroll w-full overflow-x-auto overflow-y-hidden pb-1"
        >
          <div className="flex shrink-0 gap-1">
            <div
              className="flex shrink-0 flex-col justify-end gap-1"
              style={{ width: labelWidth }}
            >
              <div style={{ height: Math.max(14, cellSize) }} aria-hidden />
              {dayLabels.map((l) => (
                <div
                  key={l}
                  className="chart-legend flex items-center text-xs"
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
                gridTemplateRows: `${Math.max(14, cellSize)}px repeat(7, ${cellSize}px)`,
                minWidth: cols * cellSize + (cols - 1) * GAP,
              }}
            >
              {monthSpans.map((m, i) => (
                <span
                  key={i}
                  className="chart-legend flex min-w-0 items-end justify-center overflow-hidden text-center text-xs"
                  style={{
                    gridColumn: `${m.colStart + 1} / ${m.colEnd + 1}`,
                    gridRow: 1,
                  }}
                >
                  <span className="truncate">{m.label}</span>
                </span>
              ))}
              {cells.map((cell) => {
                const tooltip =
                  cell.mode === "single"
                    ? `${format(new Date(cell.date + "T12:00:00"), "EEE MMM d")} · ${cell.done ? "Done" : "Missed"}`
                    : `${format(new Date(cell.date + "T12:00:00"), "EEE MMM d")} · ${cell.doneNames.length > 0 ? cell.doneNames.join(", ") : "None"}`;
                const bgColor =
                  cell.mode === "single"
                    ? cell.done
                      ? (props as { color: string }).color
                      : GRAY_EMPTY
                    : getAllModeColor(cell.ratio);
                const cellEl = (
                  <div
                    className="heatmap-cell rounded-[3px] cursor-default"
                    style={{
                      gridColumn: cell.col + 1,
                      gridRow: cell.row + 2,
                      width: cellSize,
                      height: cellSize,
                      minWidth: cellSize,
                      minHeight: cellSize,
                      backgroundColor: bgColor,
                    }}
                  />
                );
                return (
                  <Tooltip key={cell.date} delayDuration={150}>
                    <TooltipTrigger asChild>{cellEl}</TooltipTrigger>
                    <TooltipContent side="top" className="chart-tooltip text-xs">
                      {tooltip}
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
