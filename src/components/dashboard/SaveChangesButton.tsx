"use client";

import { useState } from "react";
import { Cloud, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLifeOSStore } from "@/store/useLifeOSStore";
import { cn } from "@/lib/utils";

/** Save button: green when unsaved (modifiedLogs or tasks/habits/settings), spinner on save, toast on success. */
export function SaveChangesButton() {
  const unsavedChanges = useLifeOSStore((s) =>
    s.unsavedChanges || Object.keys(s.modifiedLogs).length > 0
  );
  const saveData = useLifeOSStore((s) => s.saveData);

  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const ok = await saveData();
    setSaving(false);
    if (ok) {
      toast.success("All saved");
    } else {
      toast.error("Save failed");
    }
  }

  return (
    <Button
      size="sm"
      variant={unsavedChanges ? "default" : "ghost"}
      onClick={handleSave}
      disabled={saving || !unsavedChanges}
      className={cn(
        "gap-2",
        unsavedChanges && "bg-emerald-600 hover:bg-emerald-700"
      )}
    >
      {saving ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Cloud className="size-4" />
      )}
      {saving ? "Saving…" : unsavedChanges ? "Save changes" : "Saved"}
    </Button>
  );
}
