/** Shared constants for Life OS. Centralized for consistency and easy tuning. */

export const CHART_DAYS = 7;
export const HEATMAP_DAYS = 91;
export const HEATMAP_DAYS_EXTENDED = 180; /* 6 months, horizontal scroll, current month centered */
export const HABIT_CHART_COLORS = [
  "var(--color-habit)",
  "var(--color-sleep)",
  "var(--color-pushup)",
];

export const DEFAULT_TARGET_SLEEP_HOURS = 8;
export const DEFAULT_PUSHUP_GOAL = 50;
export const MOBILE_CHART_HEIGHT = 140;
export const DESKTOP_CHART_HEIGHT = 200;
export const DESKTOP_SLEEP_CHART_HEIGHT = 220;
export const SLEEP_CHART_HEIGHT = 250;

export const CHART_MARGIN = { top: 16, right: 16, left: 8, bottom: 8 };
export const CHART_MARGIN_WITH_Y = { top: 16, right: 16, left: 40, bottom: 8 };
export const CHART_TICK_FONT_SIZE_MOBILE = 10;
export const CHART_TICK_FONT_SIZE_DESKTOP = 11;

export const CHART_RANGE_LABELS = {
  week: "Last 7 days",
  month: "Last 28 days",
  year: "Last 12 months",
} as const;
