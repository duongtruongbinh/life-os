"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, differenceInMinutes } from "date-fns";
import { Moon, Sun } from "lucide-react";
import { toast } from "sonner";
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
  const isInitialized = useLifeOSStore((s) => s.isInitialized);
  const loading = useLifeOSStore((s) => s.loading);
  const unsavedChanges = useLifeOSStore((s) => s.unsavedChanges);
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

  const isToday = selectedDate === getLocalDateKey();
  const controlsDisabled = !isInitialized || loading;
  const startStopDisabled = controlsDisabled || !isToday;

  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    if (!isSleeping || !isToday) return;
    const id = window.setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => window.clearInterval(id);
  }, [isSleeping, isToday]);

  const liveSleepHours = useMemo(
    () =>
      isSleeping && dailyLog.sleep_start
        ? calculateDurationHours(dailyLog.sleep_start, now.toISOString())
        : 0,
    [isSleeping, dailyLog.sleep_start, now]
  );

  const currentTimeLabel = useMemo(
    () =>
      now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    [now]
  );

  function handleSleep() {
    if (isSleeping) {
      if (!dailyLog.sleep_start) {
        setSleepEnd();
        return;
      }
      const nowDate = new Date();
      const startDate = new Date(dailyLog.sleep_start);
      let minutes = differenceInMinutes(nowDate, startDate);
      if (minutes < 0) {
        minutes += 24 * 60;
      }
      if (minutes < 10) {
        // Discard ultra-short sessions.
        useLifeOSStore.setState((s) => {
          const nextLog = { ...s.dailyLog, sleep_start: null, sleep_end: null };
          const nextModified = { ...s.modifiedLogs, [s.selectedDate]: nextLog };
          return {
            dailyLog: nextLog,
            modifiedLogs: nextModified,
            unsavedChanges: true,
          };
        });
        toast.info("Sleep session too short (<10m). Discarded.");
        return;
      }
      setSleepEnd();
    } else {
      setSleepStart();
    }
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
          isSleeping && isToday
            ? "border-[var(--color-sleep)]/80 bg-[var(--color-sleep)]/10 sleep-active-glow"
            : "border-transparent bg-transparent"
        )}
      >
        {(loading || !isInitialized || isSleeping || unsavedChanges) && (
          <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-muted-foreground">
            <span>
              {!isInitialized || loading
                ? "Syncing sleep data…"
                : isSleeping && isToday
                  ? "Sleep session in progress"
                  : isToday
                    ? "Ready to track tonight"
                    : "Editing past sleep log"}
            </span>
            {unsavedChanges && !loading && (
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-400">
                Unsaved changes
              </span>
            )}
          </div>
        )}

        {isSleeping && isToday ? (
          <div className="flex flex-col items-center gap-6 pt-2 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.35)]" />
                Sleeping now
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-semibold tabular-nums text-white">
                  {currentTimeLabel}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                Time asleep
              </span>
              <span className="rounded-full bg-slate-950/40 px-4 py-2 text-2xl font-semibold tabular-nums text-white shadow-sm">
                {liveSleepHours > 0 ? `${liveSleepHours.toFixed(1)} h` : "—"}
              </span>
            </div>

            <div className="flex items-center gap-3 text-slate-300">
              <Moon className="size-7 text-[var(--color-sleep)] animate-pulse" />
              <span className="text-sm font-medium tracking-wide">Sweet dreams… We’ll keep track.</span>
            </div>

            <Button
              size="lg"
              className="mt-2 flex w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/40 transition-transform hover:scale-[1.02] hover:bg-amber-300 active:scale-[0.99]"
              onClick={handleSleep}
            >
              <Sun className="size-5" />
              <span className="text-sm font-bold uppercase tracking-[0.2em]">I&apos;m awake</span>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex min-w-[140px] flex-col gap-2">
                <label className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Bed time
                </label>
                <TimeInputClock
                  value={hasStart ? timeFromIso(dailyLog.sleep_start) : "22:00"}
                  onChange={(v) => setSleepStartAt(isoForDateAndTime(selectedDate, v))}
                  disabled={controlsDisabled}
                  aria-label="Bed time"
                />
              </div>
              {hasStart && (
                <div className="flex flex-col items-center gap-1 pb-2">
                  <span className="rounded-full bg-muted/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Duration
                  </span>
                  <span className="rounded-full bg-background/60 px-3 py-1 text-sm font-semibold tabular-nums text-foreground shadow-sm">
                    {hoursSlept > 0 ? `${hoursSlept.toFixed(1)} hrs` : "—"}
                  </span>
                </div>
              )}
              <div className="flex min-w-[140px] flex-col gap-2">
                <label className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Wake time
                  {wakeIsNextDay && (
                    <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300">
                      +1 day
                    </span>
                  )}
                </label>
                <TimeInputClock
                  value={hasEnd ? timeFromIso(dailyLog.sleep_end) : defaultWakeTime(selectedDate)}
                  onChange={handleEndChange}
                  disabled={!hasStart || controlsDisabled}
                  aria-label="Wake time"
                />
              </div>
            </div>

            <Button
              size="lg"
              variant="secondary"
              className={cn(
                "min-h-[44px] w-full gap-2 rounded-xl border border-white/10 text-sm font-semibold shadow-sm transition-colors",
                isSleeping
                  ? "bg-[var(--color-sleep)] text-slate-950 hover:bg-[var(--color-sleep)]/90"
                  : "bg-slate-900/40 text-foreground hover:bg-slate-900/70"
              )}
              disabled={startStopDisabled}
              onClick={handleSleep}
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

            {!isToday && !loading && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Live “Start sleep” is only available for today. Use the time pickers above to edit this night.
              </p>
            )}

            {hasStart && (
              <p className="text-muted-foreground text-base">
                {isSleeping
                  ? `Started ${formatTime(dailyLog.sleep_start!)}`
                  : `${hoursSlept.toFixed(1)}h slept • Target ${targetHours}h`}
              </p>
            )}
          </>
        )}
      </div>

      <SleepDurationChart />
    </div>
  );
}
