"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import type { ChartRange } from "@/lib/date-utils";

type ChartRangeToggleProps = {
  value: ChartRange;
  onChange: (v: ChartRange) => void;
  className?: string;
};

const OPTIONS: { value: ChartRange; label: string }[] = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

/** Segmented control for chart range (Week / Month / Year). Matches Habits filter bar style. */
export const ChartRangeToggle = memo(function ChartRangeToggle({
  value,
  onChange,
  className,
}: ChartRangeToggleProps) {
  return (
    <div className={cn("flex items-center gap-2", className)} role="tablist">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            value === opt.value
              ? "bg-primary text-primary-foreground"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
});
