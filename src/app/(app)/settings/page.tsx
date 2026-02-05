"use client";

import { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLifeOSStore } from "@/store/useLifeOSStore";

export default function SettingsPage() {
  const loadInitialData = useLifeOSStore((s) => s.loadInitialData);
  const userSettings = useLifeOSStore((s) => s.userSettings);
  const updateUserSettings = useLifeOSStore((s) => s.updateUserSettings);

  const [pushupGoal, setPushupGoal] = useState("");
  const [targetSleep, setTargetSleep] = useState("");

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (userSettings) {
      setPushupGoal(String(userSettings.pushup_goal ?? 50));
      setTargetSleep(String(userSettings.target_sleep_hours ?? 8));
    }
  }, [userSettings]);

  function handlePushupSave() {
    const n = parseInt(pushupGoal, 10);
    if (Number.isNaN(n) || n < 1) return;
    updateUserSettings({ pushup_goal: n });
  }

  function handleSleepSave() {
    const n = parseInt(targetSleep, 10);
    if (Number.isNaN(n) || n < 1 || n > 16) return;
    updateUserSettings({ target_sleep_hours: n });
  }

  return (
    <div className="page-bg min-h-full">
      <div className="mx-auto max-w-2xl px-4 py-8 pb-24 md:px-6 md:pb-8">
        <h1 className="mb-8 flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Settings className="size-7" />
          Settings
        </h1>

        <div className="space-y-6">
          <section className="bento-tile">
            <h2 className="mb-3 text-lg font-semibold tracking-tight">
              Push-up Goal
            </h2>
            <p className="text-muted-foreground mb-4 text-sm">
              Daily target for push-ups (used in progress indicator).
            </p>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={1}
                value={pushupGoal}
                onChange={(e) => setPushupGoal(e.target.value)}
                className="w-24"
              />
              <span className="text-muted-foreground text-sm">reps</span>
              <Button onClick={handlePushupSave} size="sm">
                Save
              </Button>
            </div>
          </section>

          <section className="bento-tile">
            <h2 className="mb-3 text-lg font-semibold tracking-tight">
              Target Sleep
            </h2>
            <p className="text-muted-foreground mb-4 text-sm">
              Target hours of sleep per night.
            </p>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={1}
                max={16}
                value={targetSleep}
                onChange={(e) => setTargetSleep(e.target.value)}
                className="w-24"
              />
              <span className="text-muted-foreground text-sm">hours</span>
              <Button onClick={handleSleepSave} size="sm">
                Save
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
