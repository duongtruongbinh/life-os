"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLifeOSStore } from "@/store/useLifeOSStore";
import type { HabitDefinition } from "@/types/database";
import { IconSelect } from "@/components/ui/icon-select";

type ManageHabitsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Add / Edit / Delete habit definitions. */
export function ManageHabitsDialog({
  open,
  onOpenChange,
}: ManageHabitsDialogProps) {
  const habitDefinitions = useLifeOSStore((s) => s.habitDefinitions);
  const addHabitDefinition = useLifeOSStore((s) => s.addHabitDefinition);
  const updateHabitDefinition = useLifeOSStore((s) => s.updateHabitDefinition);
  const removeHabitDefinition = useLifeOSStore((s) => s.removeHabitDefinition);

  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState<string | null>("Circle");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    addHabitDefinition(newName.trim(), newIcon);
    setNewName("");
    setNewIcon("Circle");
  }

  function startEdit(h: HabitDefinition) {
    setEditingId(h.id);
    setEditName(h.name);
  }

  function saveEdit(id: string) {
    if (editName.trim()) {
      updateHabitDefinition(id, { name: editName.trim() });
    }
    setEditingId(null);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage habits</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Input
              placeholder="Habit name (e.g. English, Gym)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <IconSelect value={newIcon ?? "Circle"} onChange={setNewIcon} />
            <Button type="submit" size="icon" disabled={!newName.trim()}>
              <Plus className="size-4" />
            </Button>
          </div>
        </form>
        <ul className="space-y-2">
          {habitDefinitions.map((h) => (
            <li
              key={h.id}
              className="flex items-center gap-2 rounded-lg border px-3 py-2"
            >
              {editingId === h.id ? (
                <>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1"
                    autoFocus
                  />
                  <Button size="sm" onClick={() => saveEdit(h.id)}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 font-medium">{h.name}</span>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    onClick={() => startEdit(h)}
                    title="Edit"
                  >
                    <Pencil className="size-3" />
                  </Button>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    onClick={() => removeHabitDefinition(h.id)}
                    title="Delete"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
