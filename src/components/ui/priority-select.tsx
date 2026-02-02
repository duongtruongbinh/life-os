"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { TaskPriority } from "@/types/database";

const PRIORITY_ORDER: TaskPriority[] = ["urgent", "high", "normal"];
const PRIORITY_LABELS: Record<TaskPriority, string> = {
  urgent: "Urgent",
  high: "High",
  normal: "Normal",
};
const PRIORITY_DOT: Record<TaskPriority, string> = {
  urgent: "bg-rose-600 dark:bg-rose-400",
  high: "bg-amber-500 dark:bg-amber-400",
  normal: "bg-slate-400 dark:bg-slate-300",
};

const PRIORITY_TRIGGER: Record<TaskPriority, string> = {
  urgent:
    "border-rose-500/30 hover:border-rose-500/45 focus:ring-rose-500/20",
  high:
    "border-amber-500/30 hover:border-amber-500/45 focus:ring-amber-500/20",
  normal:
    "border-slate-300/40 hover:border-slate-300/60 focus:ring-slate-400/20 dark:border-white/10 dark:hover:border-white/15",
};

const PRIORITY_ITEM: Record<TaskPriority, { selected: string; idle: string }> = {
  urgent: {
    selected: "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-[rgb(241_245_249)]",
    idle: "text-slate-700 hover:bg-rose-50 dark:text-[rgb(148_163_184)] dark:hover:bg-rose-500/10 dark:hover:text-[rgb(241_245_249)]",
  },
  high: {
    selected: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-[rgb(241_245_249)]",
    idle: "text-slate-700 hover:bg-amber-50 dark:text-[rgb(148_163_184)] dark:hover:bg-amber-500/10 dark:hover:text-[rgb(241_245_249)]",
  },
  normal: {
    selected: "bg-slate-100 text-slate-800 dark:bg-white/10 dark:text-[rgb(241_245_249)]",
    idle: "text-slate-700 hover:bg-slate-50 dark:text-[rgb(148_163_184)] dark:hover:bg-white/5 dark:hover:text-[rgb(241_245_249)]",
  },
};

type PrioritySelectProps = {
  value: TaskPriority;
  onChange: (value: TaskPriority) => void;
  size?: "icon" | "sm" | "default";
  className?: string;
};

/** Custom priority dropdown with rounded glass styling. Replaces native select. */
export function PrioritySelect({
  value,
  onChange,
  size = "default",
  className,
}: PrioritySelectProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-xl border bg-white transition-colors focus:outline-none focus:ring-2 hover:bg-slate-50 dark:bg-white/5 dark:hover:bg-white/[0.07]",
            size === "icon" && "min-h-[36px] min-w-[36px] justify-center px-1.5",
            size === "sm" && "min-h-[36px] gap-1.5 px-2 py-1.5 text-sm",
            size === "default" && "min-h-[44px] gap-2 px-3 py-2 text-base",
            "border-slate-200 text-slate-900 dark:border-white/10 dark:text-[rgb(241_245_249)]",
            PRIORITY_TRIGGER[value],
            className
          )}
          aria-label={`Priority: ${PRIORITY_LABELS[value]}`}
          title={PRIORITY_LABELS[value]}
        >
          <span className={cn("shrink-0 rounded-full", size === "icon" ? "size-2.5" : "size-2", PRIORITY_DOT[value])} />
          {size !== "icon" && (
            <span className="text-foreground font-medium">{PRIORITY_LABELS[value]}</span>
          )}
          <ChevronDown className={cn("shrink-0 text-muted-foreground", size === "icon" ? "size-3" : "size-4")} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={6}
        className="popover-lifeos w-[160px] p-1"
      >
        <div className="flex flex-col gap-0.5">
          {PRIORITY_ORDER.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                onChange(p);
                setOpen(false);
              }}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
                value === p ? PRIORITY_ITEM[p].selected : PRIORITY_ITEM[p].idle
              )}
            >
              <span className={cn("size-2 shrink-0 rounded-full", PRIORITY_DOT[p])} />
              {PRIORITY_LABELS[p]}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
