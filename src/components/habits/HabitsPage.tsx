"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { getMergedLogs, useLifeOSStore } from "@/store/useLifeOSStore";
import { DateNav } from "@/components/dashboard/DateNav";
import { getDailyLogsForRange } from "@/app/actions/daily-logs";
import { HABIT_CHART_COLORS } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconSelect } from "@/components/ui/icon-select";
import { getHabitIcon } from "@/lib/habit-icons";
import type { DailyLog, HabitDefinition } from "@/types/database";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

// Lazy load heavy heatmap component
const HabitHeatmap = dynamic(
  () => import("@/components/habits/HabitHeatmap").then((m) => m.HabitHeatmap),
  { ssr: false, loading: () => <Skeleton className="h-[180px] w-full rounded-xl" /> }
);

/** Single habit row with inline edit capability */
function HabitRow({
  habit,
  color,
  isEditing,
  editName,
  onToggle,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditNameChange,
  onDelete,
}: {
  habit: HabitDefinition;
  color: string;
  isEditing: boolean;
  editName: string;
  onToggle: () => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditNameChange: (name: string) => void;
  onDelete: () => void;
}) {
  const Icon = getHabitIcon(habit.icon);
  const habitsStatus = useLifeOSStore((s) => s.dailyLog.habits_status);
  const checked = habitsStatus[habit.id] ?? false;

  if (isEditing) {
    return (
      <div className="flex min-h-[52px] items-center gap-2 rounded-2xl border border-primary/30 bg-primary/5 px-3 py-2">
        <Input
          value={editName}
          onChange={(e) => onEditNameChange(e.target.value)}
          className="h-9 flex-1 text-sm"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") onSaveEdit();
            if (e.key === "Escape") onCancelEdit();
          }}
        />
        <Button size="icon" variant="ghost" onClick={onSaveEdit} className="size-8 text-primary">
          <Check className="size-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={onCancelEdit} className="size-8">
          <X className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="group flex min-h-[52px] items-center justify-between gap-3 rounded-2xl border border-border bg-muted/30 px-4 py-3 transition-colors hover:border-border hover:bg-muted/50">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Icon className="size-5 shrink-0 text-muted-foreground" style={{ color }} />
        <span className="truncate text-base font-medium">{habit.name}</span>
      </div>
      <div className="flex items-center gap-1">
        <Button
          size="icon"
          variant="ghost"
          onClick={onStartEdit}
          className="size-8 opacity-0 transition-opacity group-hover:opacity-100"
          title="Edit"
        >
          <Pencil className="size-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={onDelete}
          className="size-8 text-destructive opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
          title="Delete"
        >
          <Trash2 className="size-3.5" />
        </Button>
        <Button
          variant={checked ? "default" : "outline"}
          size="icon"
          onClick={onToggle}
          className="size-10 shrink-0"
          style={checked ? { backgroundColor: color, borderColor: color } : undefined}
          aria-label={checked ? "Mark incomplete" : "Mark complete"}
        >
          <Check className="size-5" />
        </Button>
      </div>
    </div>
  );
}

/** Full-screen habit tracking with inline management. */
export function HabitsPage() {
  const loadInitialData = useLifeOSStore((s) => s.loadInitialData);
  const habitDefinitions = useLifeOSStore((s) => s.habitDefinitions);
  const toggleHabit = useLifeOSStore((s) => s.toggleHabit);
  const addHabitDefinition = useLifeOSStore((s) => s.addHabitDefinition);
  const updateHabitDefinition = useLifeOSStore((s) => s.updateHabitDefinition);
  const removeHabitDefinition = useLifeOSStore((s) => s.removeHabitDefinition);
  const selectedDate = useLifeOSStore((s) => s.selectedDate);
  const setSelectedDate = useLifeOSStore((s) => s.setSelectedDate);
  const dailyLog = useLifeOSStore((s) => s.dailyLog);
  const modifiedLogs = useLifeOSStore((s) => s.modifiedLogs);
  const error = useLifeOSStore((s) => s.error);
  const loading = useLifeOSStore((s) => s.loading);

  const currentYear = new Date().getFullYear();
  const [heatmapYear, setHeatmapYear] = useState(currentYear);
  const [heatmapLogs, setHeatmapLogs] = useState<DailyLog[]>([]);
  const [heatmapFilter, setHeatmapFilter] = useState<string | "all">("all");

  // Add habit form
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState<string | null>("Circle");
  const [showAddForm, setShowAddForm] = useState(false);

  // Edit habit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    const start = `${heatmapYear}-01-01`;
    const end = `${heatmapYear}-12-31`;
    getDailyLogsForRange(start, end).then(({ data }) => {
      setHeatmapLogs(data ?? []);
    });
  }, [heatmapYear]);

  const yearLogs = useMemo(() => {
    const overlay = { ...modifiedLogs, [dailyLog.date]: dailyLog };
    const merged = getMergedLogs(heatmapLogs, overlay);
    return merged.filter((l) => l.date.startsWith(`${heatmapYear}-`));
  }, [heatmapLogs, modifiedLogs, dailyLog, heatmapYear]);

  function handleToggle(habitId: string) {
    const habitsStatus = useLifeOSStore.getState().dailyLog.habits_status;
    const wasDone = habitsStatus[habitId] ?? false;
    toggleHabit(habitId);
    if (!wasDone) {
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#22c55e", "#10b981", "#34d399"],
      });
    }
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    addHabitDefinition(newName.trim(), newIcon);
    setNewName("");
    setNewIcon("Circle");
    setShowAddForm(false);
  }

  function startEdit(h: HabitDefinition) {
    setEditingId(h.id);
    setEditName(h.name);
  }

  function saveEdit() {
    if (editingId && editName.trim()) {
      updateHabitDefinition(editingId, { name: editName.trim() });
    }
    setEditingId(null);
  }

  return (
    <div className="page-bg min-h-full">
      <main className="mx-auto flex min-h-0 max-w-3xl flex-col p-4 pb-24 md:p-6 md:pb-6">
        <DateNav value={selectedDate} onChange={setSelectedDate} />

        {error && (
          <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2 text-destructive text-sm backdrop-blur">
            {error}
          </div>
        )}
        {loading && (
          <div className="mb-4 text-muted-foreground text-sm">Loading…</div>
        )}

        <div className="flex flex-col gap-4">
          {/* Habits List with inline management */}
          <div className="bento-tile">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold tracking-tight">Habits</h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddForm(!showAddForm)}
                className="gap-1.5"
              >
                <Plus className="size-4" />
                Add
              </Button>
            </div>

            {/* Add habit form */}
            {showAddForm && (
              <form onSubmit={handleAdd} className="mb-4 flex gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
                <Input
                  placeholder="Habit name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1"
                  autoFocus
                />
                <IconSelect value={newIcon ?? "Circle"} onChange={setNewIcon} />
                <Button type="submit" disabled={!newName.trim()}>
                  Add
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </form>
            )}

            {/* Habits list */}
            {habitDefinitions.length === 0 ? (
              <div className="flex min-h-[120px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 py-6 text-center">
                <p className="text-muted-foreground text-sm">No habits yet</p>
                <Button size="sm" variant="outline" onClick={() => setShowAddForm(true)}>
                  <Plus className="mr-1.5 size-4" />
                  Create your first habit
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {habitDefinitions.map((h, idx) => {
                  const color = h.color ?? HABIT_CHART_COLORS[idx % HABIT_CHART_COLORS.length];
                  return (
                    <HabitRow
                      key={h.id}
                      habit={h}
                      color={color}
                      isEditing={editingId === h.id}
                      editName={editName}
                      onToggle={() => handleToggle(h.id)}
                      onStartEdit={() => startEdit(h)}
                      onSaveEdit={saveEdit}
                      onCancelEdit={() => setEditingId(null)}
                      onEditNameChange={setEditName}
                      onDelete={() => removeHabitDefinition(h.id)}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Heatmap */}
          {habitDefinitions.length > 0 && (
            <div className="bento-tile flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xl font-bold tracking-tight">Heatmap</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setHeatmapFilter("all")}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                      heatmapFilter === "all"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    All
                  </button>
                  {habitDefinitions.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => setHeatmapFilter(h.id)}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                        heatmapFilter === h.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {h.name}
                    </button>
                  ))}
                  <div className="ml-auto flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2 py-1">
                    <button
                      type="button"
                      onClick={() => setHeatmapYear((y) => y - 1)}
                      className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
                      aria-label="Previous year"
                    >
                      <ChevronLeft className="size-5" />
                    </button>
                    <span className="min-w-[52px] text-center text-sm font-semibold tabular-nums">
                      {heatmapYear}
                    </span>
                    <button
                      type="button"
                      onClick={() => setHeatmapYear((y) => Math.min(currentYear, y + 1))}
                      disabled={heatmapYear >= currentYear}
                      className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground disabled:opacity-40"
                      aria-label="Next year"
                    >
                      <ChevronRight className="size-5" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="min-h-0">
                {heatmapFilter === "all" ? (
                  <HabitHeatmap
                    mode="all"
                    habitDefinitions={habitDefinitions.map((h) => ({ id: h.id, name: h.name }))}
                    year={heatmapYear}
                    yearLogs={yearLogs}
                  />
                ) : (() => {
                  const h = habitDefinitions.find((x) => x.id === heatmapFilter);
                  if (!h) return null;
                  const idx = habitDefinitions.indexOf(h);
                  const color = h.color ?? HABIT_CHART_COLORS[idx % HABIT_CHART_COLORS.length];
                  return (
                    <HabitHeatmap
                      mode="single"
                      habitId={h.id}
                      habitName={h.name}
                      color={color}
                      year={heatmapYear}
                      yearLogs={yearLogs}
                    />
                  );
                })()
                }
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
