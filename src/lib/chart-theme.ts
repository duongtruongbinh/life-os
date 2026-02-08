/**
 * Unified chart theme configuration for consistent, premium chart styling.
 * All charts should use these shared styles for visual consistency.
 */

// Chart gradient definitions for each feature type
export const CHART_GRADIENTS = {
    focus: {
        id: "focusGradient",
        colors: [
            { offset: "0%", color: "oklch(0.70 0.22 290)", opacity: 1 },
            { offset: "50%", color: "oklch(0.60 0.20 290)", opacity: 0.85 },
            { offset: "100%", color: "oklch(0.35 0.15 290)", opacity: 0.3 },
        ],
    },
    sleep: {
        id: "sleepGradient",
        colors: [
            { offset: "0%", color: "oklch(0.82 0.20 220)", opacity: 1 },
            { offset: "50%", color: "oklch(0.70 0.18 220)", opacity: 0.85 },
            { offset: "100%", color: "oklch(0.50 0.14 220)", opacity: 0.3 },
        ],
    },
    pushup: {
        id: "pushupGradient",
        colors: [
            { offset: "0%", color: "oklch(0.88 0.20 45)", opacity: 1 },
            { offset: "50%", color: "oklch(0.78 0.18 45)", opacity: 0.85 },
            { offset: "100%", color: "oklch(0.55 0.14 45)", opacity: 0.3 },
        ],
    },
    habit: {
        id: "habitGradient",
        colors: [
            { offset: "0%", color: "oklch(0.75 0.20 160)", opacity: 1 },
            { offset: "50%", color: "oklch(0.65 0.18 160)", opacity: 0.85 },
            { offset: "100%", color: "oklch(0.45 0.14 160)", opacity: 0.3 },
        ],
    },
    task: {
        id: "taskGradient",
        colors: [
            { offset: "0%", color: "oklch(0.72 0.18 320)", opacity: 1 },
            { offset: "50%", color: "oklch(0.62 0.16 320)", opacity: 0.85 },
            { offset: "100%", color: "oklch(0.42 0.12 320)", opacity: 0.3 },
        ],
    },
} as const;

// Shared tooltip styling
export const TOOLTIP_STYLE = {
    wrapperStyle: { outline: "none" },
    contentStyle: {
        background: "rgba(12, 14, 20, 0.98)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        borderRadius: "12px",
        padding: "10px 14px",
        boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.06), 0 24px 48px -12px rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(8px)",
    },
    cursor: {
        fill: "rgba(255, 255, 255, 0.04)",
        radius: 6
    },
} as const;

// Axis styling
export const AXIS_STYLE = {
    tick: {
        fill: "rgb(120, 130, 150)",
        fontSize: 11,
        fontWeight: 500,
    },
    tickLine: false,
    axisLine: false,
} as const;

// Grid styling
export const GRID_STYLE = {
    strokeDasharray: "3 3",
    stroke: "rgba(255, 255, 255, 0.04)",
    vertical: false,
} as const;

// Reference line styling (for goals)
export const REFERENCE_LINE_STYLE = {
    stroke: "rgba(148, 163, 184, 0.5)",
    strokeDasharray: "6 4",
    strokeWidth: 1.5,
} as const;

// Bar styling
export const BAR_STYLE = {
    radius: [6, 6, 0, 0] as [number, number, number, number],
    maxBarSize: 42,
} as const;

// Animation configuration
export const CHART_ANIMATION = {
    duration: 600,
    easing: "ease-out",
} as const;

// Chart container classes for consistent styling
export const CHART_CONTAINER_CLASSES = {
    wrapper: "w-full overflow-hidden rounded-2xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.06] p-4",
    empty: "flex w-full items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] text-muted-foreground/60 text-sm font-medium",
    legend: "text-xs font-semibold uppercase tracking-widest text-muted-foreground/80",
} as const;

// Generate gradient JSX for Recharts <defs>
export function createGradientDef(type: keyof typeof CHART_GRADIENTS) {
    const gradient = CHART_GRADIENTS[type];
    return {
        id: gradient.id,
        stops: gradient.colors.map((stop) => ({
            offset: stop.offset,
            stopColor: stop.color,
            stopOpacity: stop.opacity,
        })),
    };
}

// Get fill reference for a gradient
export function getGradientFill(type: keyof typeof CHART_GRADIENTS) {
    return `url(#${CHART_GRADIENTS[type].id})`;
}
