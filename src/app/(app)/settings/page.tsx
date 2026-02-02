"use client";

import { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLifeOSStore } from "@/store/useLifeOSStore";
import { ManageHabitsDialog } from "@/components/dashboard/ManageHabitsDialog";

export default function SettingsPage() {
  const loadInitialData = useLifeOSStore((s) => s.loadInitialData);
  const userSettings = useLifeOSStore((s) => s.userSettings);
  const updateUserSettings = useLifeOSStore((s) => s.updateUserSettings);

  const [pushupGoal, setPushupGoal] = useState("");
  const [targetSleep, setTargetSleep] = useState("");
  const [manageHabitsOpen, setManageHabitsOpen] = useState(false);

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
      <div className="mx-auto max-w-2xl px-4 py-8 md:px-6">
        <h1 className="mb-8 flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Settings className="size-7" />
          Settings
        </h1>

        <div className="space-y-8">
          <section className="bento-tile">
            <h2 className="mb-4 text-xl font-semibold tracking-tight">
              Push-up goal
            </h2>
            <p className="text-muted-foreground mb-3 text-base">
              Daily target for push-ups (used in progress indicator).
            </p>
            <div className="flex gap-2">
              <Input
                type="number"
                min={1}
                value={pushupGoal}
                onChange={(e) => setPushupGoal(e.target.value)}
                className="input-lifeos w-24"
              />
              <Button onClick={handlePushupSave}>Save</Button>
            </div>
          </section>

          <section className="bento-tile">
            <h2 className="mb-4 text-xl font-semibold tracking-tight">
              Target sleep duration
            </h2>
            <p className="text-muted-foreground mb-3 text-base">
              Target hours of sleep per night (e.g. 8).
            </p>
            <div className="flex gap-2">
              <Input
                type="number"
                min={1}
                max={16}
                value={targetSleep}
                onChange={(e) => setTargetSleep(e.target.value)}
                className="input-lifeos w-24"
              />
              <span className="text-muted-foreground flex items-center text-sm">
                hours
              </span>
              <Button onClick={handleSleepSave}>Save</Button>
            </div>
          </section>

          <section className="bento-tile">
            <h2 className="mb-4 text-xl font-semibold tracking-tight">
              Habit management
            </h2>
            <p className="text-muted-foreground mb-3 text-base">
              Add, edit, or remove habits you track daily.
            </p>
            <Button onClick={() => setManageHabitsOpen(true)} variant="outline">
              Manage habits
            </Button>
          </section>
        </div>
      </div>

      <ManageHabitsDialog open={manageHabitsOpen} onOpenChange={setManageHabitsOpen} />
    </div>
  );
}
