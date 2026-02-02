"use client";

import { useMemo } from "react";
import { addDays } from "date-fns";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TimeInputClock } from "@/components/dashboard/TimeInputClock";
import { useLifeOSStore } from "@/store/useLifeOSStore";
import { SleepDurationChart } from "@/components/dashboard/SleepDurationChart";
import { DEFAULT_TARGET_SLEEP_HOURS } from "@/lib/constants";
import { calculateDurationHours, getLocalDateKey } from "@/lib/date-utils";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function isoForDateAndTime(dateStr: string, timeStr: string): string {
  return `${dateStr}T${timeStr}:00`;
}

function timeFromIso(iso: string | null): string {
  if (!iso) return "22:00";
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function defaultWakeTime(dateStr: string): string {
  const d = new Date(`${dateStr}T07:00:00`);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function isWakeNextDay(bedTimeStr: string, wakeTimeStr: string): boolean {
  return timeToMinutes(wakeTimeStr) <= timeToMinutes(bedTimeStr);
}

/** Sleep tracker: bed/wake times, start/end buttons, duration chart. */
export function SleepTracker() {
  const dailyLog = useLifeOSStore((s) => s.dailyLog);
  const selectedDate = useLifeOSStore((s) => s.selectedDate);
  const userSettings = useLifeOSStore((s) => s.userSettings);
  const setSleepStart = useLifeOSStore((s) => s.setSleepStart);
  const setSleepEnd = useLifeOSStore((s) => s.setSleepEnd);
  const setSleepStartAt = useLifeOSStore((s) => s.setSleepStartAt);
  const setSleepEndAt = useLifeOSStore((s) => s.setSleepEndAt);

  const targetHours = userSettings?.target_sleep_hours ?? DEFAULT_TARGET_SLEEP_HOURS;

  const hasStart = !!dailyLog.sleep_start;
  const hasEnd = !!dailyLog.sleep_end;
  const isSleeping = hasStart && !hasEnd;
  const wakeIsNextDay =
    hasEnd &&
    dailyLog.sleep_end &&
    dailyLog.sleep_end.slice(0, 10) !== selectedDate;
  const hoursSlept = useMemo(
    () => calculateDurationHours(dailyLog.sleep_start, dailyLog.sleep_end),
    [dailyLog.sleep_start, dailyLog.sleep_end]
  );

  function handleSleep() {
    if (isSleeping) setSleepEnd();
    else setSleepStart();
  }

  function handleEndChange(wakeTimeStr: string) {
    const bedTimeStr = hasStart ? timeFromIso(dailyLog.sleep_start) : "22:00";
    const bedDate = hasStart && dailyLog.sleep_start
      ? dailyLog.sleep_start.slice(0, 10)
      : selectedDate;
    const wakeDate = isWakeNextDay(bedTimeStr, wakeTimeStr)
      ? getLocalDateKey(addDays(new Date(bedDate + "T12:00:00"), 1))
      : bedDate;
    setSleepEndAt(isoForDateAndTime(wakeDate, wakeTimeStr));
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
        <Moon className="size-7 text-[var(--color-sleep)]" />
        Sleep
      </h2>

      <div
        className={cn(
          "flex flex-col gap-4 rounded-2xl border-2 p-5 transition-all duration-300",
          isSleeping
            ? "border-[var(--color-sleep)]/60 bg-[var(--color-sleep)]/5 sleep-active-glow"
            : "border-transparent bg-transparent"
        )}
      >
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex min-w-[140px] flex-col gap-2">
            <label className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
              Bed time
            </label>
            <TimeInputClock
              value={hasStart ? timeFromIso(dailyLog.sleep_start) : "22:00"}
              onChange={(v) => setSleepStartAt(isoForDateAndTime(selectedDate, v))}
              aria-label="Bed time"
            />
          </div>
          {hasStart && (
            <div className="flex flex-col items-center gap-1 pb-2">
              <span className="rounded-full bg-muted px-3 py-1 text-sm font-semibold tabular-nums text-muted-foreground">
                {hoursSlept > 0 ? `${hoursSlept.toFixed(1)} hrs` : "—"}
              </span>
            </div>
          )}
          <div className="flex min-w-[140px] flex-col gap-2">
            <label className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wider">
              Wake time
              {wakeIsNextDay && (
                <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                  Tomorrow (+1 day)
                </span>
              )}
            </label>
            <TimeInputClock
              value={hasEnd ? timeFromIso(dailyLog.sleep_end) : defaultWakeTime(selectedDate)}
              onChange={handleEndChange}
              disabled={!hasStart}
              aria-label="Wake time"
            />
          </div>
        </div>

        <Button
          size="lg"
          variant={isSleeping ? "default" : "secondary"}
          className="min-h-[44px] w-full gap-2 rounded-xl border-border"
          onClick={handleSleep}
          style={isSleeping ? { backgroundColor: "var(--color-sleep)" } : undefined}
        >
          {isSleeping ? (
            <>
              <Sun className="size-5" />
              I'm awake
            </>
          ) : (
            <>
              <Moon className="size-5" />
              Start sleep
            </>
          )}
        </Button>

        {hasStart && (
          <p className="text-muted-foreground text-base">
            {isSleeping
              ? `Started ${formatTime(dailyLog.sleep_start!)}`
              : `${hoursSlept.toFixed(1)}h slept • Target ${targetHours}h`}
          </p>
        )}
      </div>

      <SleepDurationChart />
    </div>
  );
}
