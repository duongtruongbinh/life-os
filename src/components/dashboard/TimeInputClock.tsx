"use client";

import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

type TimeInputClockProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  "aria-label"?: string;
};

/** Digital-clock styled time input. Hidden native input receives clicks for picker. */
export function TimeInputClock({
  value,
  onChange,
  disabled = false,
  "aria-label": ariaLabel = "Time",
}: TimeInputClockProps) {
  return (
    <label
      className={cn(
        "input-lifeos relative flex h-14 w-full min-w-[120px] cursor-pointer items-center justify-between gap-2 rounded-xl px-4 transition-colors hover:border-white/15 hover:bg-white/[0.07] focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20",
        disabled && "cursor-not-allowed opacity-50 hover:border-white/10 hover:bg-white/5"
      )}
      aria-label={ariaLabel}
    >
      <span className="pointer-events-none min-w-[4ch] font-mono text-2xl font-bold tabular-nums">
        {value || "——"}
      </span>
      {!disabled && (
        <Pencil className="pointer-events-none size-4 shrink-0 text-muted-foreground/50" />
      )}
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="absolute inset-0 cursor-pointer opacity-0"
        tabIndex={0}
      />
    </label>
  );
}
