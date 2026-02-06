"use client";

import { useState } from "react";
import { Cloud, Loader2, Check } from "lucide-react";
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

  const [status, setStatus] = useState<"idle" | "saving" | "success">("idle");

  async function handleSave() {
    setStatus("saving");
    const ok = await saveData();

    if (ok) {
      setStatus("success");
      setTimeout(() => {
        setStatus("idle");
      }, 2000);
      toast.success("All saved");
    } else {
      setStatus("idle");
      // Read the error from store if possible, or generic
      const currentError = useLifeOSStore.getState().error;
      toast.error(currentError || "Save failed");
    }
  }

  // Effect to reset success if changes happen? No, maybe keep it simple.

  const isSuccess = status === "success";

  return (
    <Button
      size="sm"
      variant={unsavedChanges ? "default" : "ghost"}
      onClick={handleSave}
      disabled={status === "saving" || (!unsavedChanges && !isSuccess)}
      className={cn(
        "gap-2 transition-all duration-300",
        unsavedChanges && "bg-emerald-600 hover:bg-emerald-700",
        isSuccess && "bg-green-500 hover:bg-green-600 text-white"
      )}
    >
      {status === "saving" ? (
        <Loader2 className="size-4 animate-spin" />
      ) : isSuccess ? (
        <Check className="size-4" />
      ) : (
        <Cloud className="size-4" />
      )}
      {status === "saving" ? "Saving…" : isSuccess ? "Saved!" : unsavedChanges ? "Save changes" : "Saved"}
    </Button>
  );
}
