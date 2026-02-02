"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { Moon, Sun, Target, ChevronRight, Dumbbell, Plus } from "lucide-react";
import { useLifeOSStore } from "@/store/useLifeOSStore";
import { calculateDurationHours } from "@/lib/date-utils";
import { HabitDots } from "@/components/dashboard/HabitDots";
import { getHabitIcon } from "@/lib/habit-icons";
import { PushupRadial } from "@/components/dashboard/PushupRadial";
import { SleepDurationChart } from "@/components/dashboard/SleepDurationChart";
import { ProductivityHeatmap } from "@/components/dashboard/ProductivityHeatmap";
import { TaskItem } from "@/components/tasks/TaskItem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PrioritySelect } from "@/components/ui/priority-select";
import type { TaskPriority } from "@/types/database";
import { HABIT_CHART_COLORS } from "@/lib/constants";

const PRIORITY_ORDER: TaskPriority[] = ["urgent", "high", "normal"];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/** Dashboard: 12-col grid. Tasks (5) | Sleep+Pushups (4) | Habits (3). */
export function Dashboard() {
  const loadInitialData = useLifeOSStore((s) => s.loadInitialData);
  const dailyLog = useLifeOSStore((s) => s.dailyLog);
  const tasks = useLifeOSStore((s) => s.tasks);
  const habitDefinitions = useLifeOSStore((s) => s.habitDefinitions);
  const setSleepStart = useLifeOSStore((s) => s.setSleepStart);
  const setSleepEnd = useLifeOSStore((s) => s.setSleepEnd);
  const addTask = useLifeOSStore((s) => s.addTask);
  const toggleTaskCompletion = useLifeOSStore((s) => s.toggleTaskCompletion);
  const updateTaskPriority = useLifeOSStore((s) => s.updateTaskPriority);
  const updateTaskTitle = useLifeOSStore((s) => s.updateTaskTitle);
  const removeTask = useLifeOSStore((s) => s.removeTask);
  const error = useLifeOSStore((s) => s.error);
  const loading = useLifeOSStore((s) => s.loading);

  const [greeting, setGreeting] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("normal");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const sleepHours = useMemo(
    () => calculateDurationHours(dailyLog.sleep_start, dailyLog.sleep_end),
    [dailyLog.sleep_start, dailyLog.sleep_end]
  );
  const hasSleepStart = !!dailyLog.sleep_start;
  const hasSleepEnd = !!dailyLog.sleep_end;
  const isSleeping = hasSleepStart && !hasSleepEnd;
  const tasksRemaining = tasks.filter((t) => !t.is_completed).length;
  const topTasks = useMemo(() => {
    const byPriority = PRIORITY_ORDER.flatMap((p) =>
      tasks.filter((t) => !t.is_completed && (t.priority ?? "normal") === p)
    );
    return byPriority.slice(0, 8);
  }, [tasks]);

  function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    addTask(taskTitle.trim(), taskPriority);
    setTaskTitle("");
    setTaskPriority("normal");
    inputRef.current?.focus();
  }

  return (
    <div className="page-bg min-h-full">
      <main className="mx-auto flex min-h-0 max-w-6xl flex-col gap-2 p-4 lg:p-4">
        {error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2 text-destructive text-base backdrop-blur">
            {error}
          </div>
        )}
        {loading && (
          <div className="text-muted-foreground text-base">
            Loading…
          </div>
        )}

        {/* Greeting: client-only to avoid hydration mismatch */}
        <p className="text-sm text-muted-foreground">
          {greeting ? `${greeting}.` : ""}
          {dailyLog.sleep_start && dailyLog.sleep_end && (
            <> Slept {sleepHours.toFixed(1)}h.</>
          )}
          {tasksRemaining > 0 ? ` ${tasksRemaining} tasks left.` : " All done."}
        </p>

        {/* Top: Productivity heatmap (merged local-first view) */}
        <div className="bento-tile p-4">
          <ProductivityHeatmap />
        </div>

        <div className="grid min-h-0 grid-cols-1 gap-2 lg:grid-cols-12 lg:grid-rows-2 lg:gap-2">
          {/* Left: Tasks (5 cols, 2 rows) */}
          <div className="bento-tile flex min-h-0 flex-col gap-3 p-4 lg:col-span-5 lg:row-span-2 lg:row-start-1">
            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              Tasks
            </h2>
            <form
              onSubmit={handleAddTask}
              className="flex h-12 min-w-0 items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
            >
              <Input
                ref={inputRef}
                placeholder="Add task…"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="h-full min-w-0 flex-1 rounded-l-xl rounded-r-none border-0 bg-transparent px-4 text-base placeholder:text-slate-400 shadow-none focus-visible:ring-0"
              />
              <div
                className="flex h-full shrink-0 items-center gap-2 border-l border-slate-200 pl-3 pr-2 dark:border-white/10"
                aria-hidden
              >
                <PrioritySelect
                  value={taskPriority}
                  onChange={setTaskPriority}
                  size="sm"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!taskTitle.trim()}
                  className="size-8 shrink-0 rounded-lg"
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </form>
            <div className="flex min-h-0 flex-1 flex-col overflow-auto">
              {topTasks.length === 0 ? (
                <p className="text-muted-foreground py-6 text-center text-sm">
                  No pending tasks
                </p>
              ) : (
                <ul className="space-y-2">
                  {topTasks.map((t) => (
                    <TaskItem
                      key={t.id}
                      task={t}
                      onToggle={toggleTaskCompletion}
                      onUpdatePriority={updateTaskPriority}
                      onUpdateTitle={updateTaskTitle}
                      onRemove={removeTask}
                    />
                  ))}
                </ul>
              )}
              <Link
                href="/tasks"
                className="mt-2 flex items-center gap-1 text-muted-foreground text-sm hover:text-foreground"
              >
                View all <ChevronRight className="size-3.5" />
              </Link>
            </div>
          </div>

          {/* Middle: Sleep (2 rows, interactive; arrow navigates to /sleep) */}
          <div className="bento-tile group flex min-h-0 flex-col gap-3 p-4 transition-colors hover:border-primary/30 lg:col-span-4 lg:row-span-2 lg:row-start-1">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                <Moon className="size-4 text-[var(--color-sleep)]" />
                Sleep
              </h2>
              <Link
                href="/sleep"
                aria-label="Open sleep page"
                className="rounded-lg p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted/40 hover:text-foreground group-hover:opacity-100"
              >
                <ChevronRight className="size-4" />
              </Link>
            </div>
            <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
              {dailyLog.sleep_start && dailyLog.sleep_end
                ? sleepHours.toFixed(1)
                : "—"}
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-muted-foreground text-xs font-medium">hours sleep</p>
              <Button
                type="button"
                size="sm"
                variant={isSleeping ? "default" : "secondary"}
                onClick={() => (isSleeping ? setSleepEnd() : setSleepStart())}
                className={isSleeping ? "bg-[var(--color-sleep)]/25 text-foreground hover:bg-[var(--color-sleep)]/35" : ""}
              >
                {isSleeping ? (
                  <>
                    <Sun className="mr-2 size-4" />
                    Wake
                  </>
                ) : (
                  <>
                    <Moon className="mr-2 size-4" />
                    Start
                  </>
                )}
              </Button>
            </div>
            <div className="min-h-[100px] flex-1">
              <SleepDurationChart />
            </div>
          </div>

          {/* Right: Habits (3 cols, row 1) */}
          <Link
            href="/habits"
            className="bento-tile group flex min-h-0 flex-col gap-3 p-4 transition-colors hover:border-primary/30 lg:col-span-3 lg:row-start-1"
          >
            <h2 className="flex items-center justify-between text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              <span className="flex items-center gap-2">
                <Target className="size-4 text-[var(--color-habit)]" />
                Habits
              </span>
              <ChevronRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </h2>
            {habitDefinitions.length === 0 ? (
              <p className="text-muted-foreground py-4 text-sm">No habits yet</p>
            ) : (
              <div className="flex flex-col gap-2 overflow-auto">
                {habitDefinitions.slice(0, 5).map((h, idx) => {
                  const Icon = getHabitIcon(h.icon);
                  const color = h.color ?? HABIT_CHART_COLORS[idx % 3];
                  return (
                    <div
                      key={h.id}
                      className="flex min-h-[36px] items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 dark:border-white/10 dark:bg-white/5"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <Icon className="size-4 shrink-0" style={{ color }} />
                        <span className="truncate text-sm font-medium">
                          {h.name}
                        </span>
                      </div>
                      <HabitDots habitId={h.id} color={color} />
                    </div>
                  );
                })}
              </div>
            )}
          </Link>

          {/* Right: Push-ups (stacked under Habits, 3 cols) */}
          <Link
            href="/pushups"
            className="bento-tile group flex flex-col gap-3 p-4 transition-colors hover:border-primary/30 lg:col-span-3 lg:row-start-2"
          >
            <h2 className="flex items-center justify-between text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              <span className="flex items-center gap-2">
                <Dumbbell className="size-4 text-[var(--color-pushup)]" />
                Push-ups
              </span>
              <ChevronRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </h2>
            <div className="flex min-h-14 min-w-0 items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex min-w-0 flex-1 items-center gap-3 px-4">
                <span className="text-xl font-bold tabular-nums text-slate-900 dark:text-white">
                  {dailyLog.pushup_count}
                </span>
                <span className="text-muted-foreground text-sm">push-ups</span>
              </div>
              <div className="flex shrink-0 items-center border-l border-slate-200 py-1 pl-3 pr-3 dark:border-white/10">
                <PushupRadial compact />
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
