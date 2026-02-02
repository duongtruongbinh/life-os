import {
  BookOpen,
  Code,
  Brain,
  Dumbbell,
  Coffee,
  Palette,
  Music,
  Languages,
  GraduationCap,
  Circle,
  type LucideIcon,
} from "lucide-react";

const HABIT_ICONS: Record<string, LucideIcon> = {
  BookOpen,
  Code,
  Brain,
  Dumbbell,
  Coffee,
  Palette,
  Music,
  Languages,
  GraduationCap,
  Circle,
};

/** Returns Lucide icon component for habit icon name; defaults to Circle. */
export function getHabitIcon(iconName: string | null): LucideIcon {
  if (!iconName) return Circle;
  return HABIT_ICONS[iconName] ?? Circle;
}

export const HABIT_ICON_OPTIONS = Object.keys(HABIT_ICONS);
