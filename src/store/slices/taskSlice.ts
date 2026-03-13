import type { StateCreator } from "zustand";
import type { LifeOSStore } from "../types";
import type { TaskPriority, Task } from "@/types/database";

const TEMP_PREFIX = "temp-";
export const isTempId = (id: string) => id.startsWith(TEMP_PREFIX);

export const createTaskSlice: StateCreator<
  LifeOSStore,
  [],
  [],
  Pick<
    LifeOSStore,
    | "addTask"
    | "updateTaskPriority"
    | "updateTaskTitle"
    | "toggleTaskCompletion"
    | "updateTaskDueDate"
    | "removeTask"
  >
> = (set) => ({
  addTask: (title: string, priority: TaskPriority | null) => {
    const newTask: Task = {
      id: `${TEMP_PREFIX}${crypto.randomUUID()}`,
      user_id: "",
      title,
      is_completed: false,
      priority,
      due_date: null,
      created_at: new Date().toISOString(),
      completed_at: null,
    };
    set((s) => ({ tasks: [newTask, ...s.tasks], unsavedChanges: true }));
  },

  updateTaskPriority: (id: string, priority: TaskPriority) => {
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, priority } : t)),
      unsavedChanges: true,
    }));
  },

  updateTaskTitle: (id: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, title: trimmed } : t)),
      unsavedChanges: true,
    }));
  },

  toggleTaskCompletion: (id: string, isCompleted: boolean) => {
    const now = new Date().toISOString();
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id
          ? { ...t, is_completed: !isCompleted, completed_at: isCompleted ? null : now }
          : t
      ),
      unsavedChanges: true,
    }));
  },

  updateTaskDueDate: (id: string, dueDate: string | null) => {
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, due_date: dueDate } : t)),
      unsavedChanges: true,
    }));
  },

  removeTask: (id: string) => {
    set((s) => {
      if (isTempId(id)) {
        return { tasks: s.tasks.filter((t) => t.id !== id), unsavedChanges: true };
      }
      return {
        tasks: s.tasks.filter((t) => t.id !== id),
        deletedTaskIds: [...s.deletedTaskIds, id],
        unsavedChanges: true,
      };
    });
  },
});
