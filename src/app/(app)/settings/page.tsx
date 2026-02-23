"use client";

import { useEffect, useReducer } from "react";
import { Settings, Target, Moon, Dumbbell, Database, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLifeOSStore } from "@/store/useLifeOSStore";
import { ExportButton } from "@/components/settings/ExportButton";
import { DEFAULT_TARGET_FOCUS_HOURS } from "@/lib/constants";

export default function SettingsPage() {
  const loadInitialData = useLifeOSStore((s) => s.loadInitialData);
  const userSettings = useLifeOSStore((s) => s.userSettings);
  const updateUserSettings = useLifeOSStore((s) => s.updateUserSettings);
  const initialState = {
    pushupGoal: "",
    targetSleep: "",
    targetFocus: ""
  };

  const [state, dispatch] = useReducer(
    (prev: typeof initialState, next: Partial<typeof initialState>) => ({ ...prev, ...next }),
    initialState
  );

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (userSettings) {
      dispatch({
        pushupGoal: String(userSettings.pushup_goal ?? 50),
        targetSleep: String(userSettings.target_sleep_hours ?? 8),
        targetFocus: String(userSettings.target_focus_hours ?? DEFAULT_TARGET_FOCUS_HOURS)
      });
    }
  }, [userSettings]);

  function handlePushupSave() {
    const n = parseInt(state.pushupGoal, 10);
    if (Number.isNaN(n) || n < 1) return;
    updateUserSettings({ pushup_goal: n });
  }

  function handleSleepSave() {
    const n = parseInt(state.targetSleep, 10);
    if (Number.isNaN(n) || n < 1 || n > 16) return;
    updateUserSettings({ target_sleep_hours: n });
  }

  function handleFocusSave() {
    const n = parseInt(state.targetFocus, 10);
    if (Number.isNaN(n) || n < 1 || n > 24) return;
    updateUserSettings({ target_focus_hours: n });
  }

  return (
    <div className="page-bg min-h-full">
      <div className="mx-auto max-w-3xl px-4 py-6 pb-24 md:px-6 md:pb-8">
        <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Settings className="size-6" />
          Settings
        </h1>

        {/* Goals Grid - 2 columns on desktop */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Focus Goal */}
          <section className="bento-tile">
            <div className="flex items-center gap-2 mb-2">
              <Target className="size-5 text-[var(--color-focus)]" />
              <h2 className="text-base font-semibold">Focus Goal</h2>
            </div>
            <p className="text-muted-foreground mb-3 text-sm">
              Daily focus hours target
            </p>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={24}
                value={state.targetFocus}
                onChange={(e) => dispatch({ targetFocus: e.target.value })}
                className="w-20 h-9"
              />
              <span className="text-muted-foreground text-sm">hrs</span>
              <Button onClick={handleFocusSave} size="sm" variant="ghost" className="ml-auto">
                <Save className="size-4" />
              </Button>
            </div>
          </section>

          {/* Sleep Goal */}
          <section className="bento-tile">
            <div className="flex items-center gap-2 mb-2">
              <Moon className="size-5 text-[var(--color-sleep)]" />
              <h2 className="text-base font-semibold">Sleep Goal</h2>
            </div>
            <p className="text-muted-foreground mb-3 text-sm">
              Nightly sleep hours target
            </p>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={16}
                value={state.targetSleep}
                onChange={(e) => dispatch({ targetSleep: e.target.value })}
                className="w-20 h-9"
              />
              <span className="text-muted-foreground text-sm">hrs</span>
              <Button onClick={handleSleepSave} size="sm" variant="ghost" className="ml-auto">
                <Save className="size-4" />
              </Button>
            </div>
          </section>

          {/* Pushup Goal */}
          <section className="bento-tile">
            <div className="flex items-center gap-2 mb-2">
              <Dumbbell className="size-5 text-[var(--color-pushup)]" />
              <h2 className="text-base font-semibold">Push-up Goal</h2>
            </div>
            <p className="text-muted-foreground mb-3 text-sm">
              Daily push-up reps target
            </p>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                value={state.pushupGoal}
                onChange={(e) => dispatch({ pushupGoal: e.target.value })}
                className="w-20 h-9"
              />
              <span className="text-muted-foreground text-sm">reps</span>
              <Button onClick={handlePushupSave} size="sm" variant="ghost" className="ml-auto">
                <Save className="size-4" />
              </Button>
            </div>
          </section>

          {/* Data Management */}
          <section className="bento-tile">
            <div className="flex items-center gap-2 mb-2">
              <Database className="size-5 text-primary" />
              <h2 className="text-base font-semibold">Data Export</h2>
            </div>
            <p className="text-muted-foreground mb-3 text-sm">
              Backup your data as JSON
            </p>
            <ExportButton />
          </section>
        </div>
      </div>
    </div>
  );
}
