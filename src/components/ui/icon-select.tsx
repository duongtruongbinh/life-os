"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getHabitIcon } from "@/lib/habit-icons";
import { HABIT_ICON_OPTIONS } from "@/lib/habit-icons";

type IconSelectProps = {
  value: string | null;
  onChange: (value: string | null) => void;
  className?: string;
};

/** Custom icon dropdown with rounded glass styling. Replaces native select. */
export function IconSelect({ value, onChange, className }: IconSelectProps) {
  const [open, setOpen] = useState(false);
  const Icon = getHabitIcon(value ?? "Circle");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-base transition-colors hover:border-white/15 hover:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-primary/20",
            "dark:border-white/10 dark:bg-white/5",
            className
          )}
          aria-label={`Icon: ${value ?? "Circle"}`}
        >
          <Icon className="size-4 shrink-0 text-muted-foreground" />
          <span className="text-foreground font-medium">{value ?? "Circle"}</span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="popover-lifeos w-[180px] p-2"
      >
        <div className="grid grid-cols-4 gap-1">
          {HABIT_ICON_OPTIONS.map((opt) => {
            const OptIcon = getHabitIcon(opt);
            const selected = (value ?? "Circle") === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={cn(
                  "flex size-10 items-center justify-center rounded-xl transition-colors",
                  selected
                    ? "bg-white/10 text-[rgb(241_245_249)]"
                    : "text-[rgb(148_163_184)] hover:bg-white/5 hover:text-[rgb(241_245_249)]"
                )}
                title={opt}
              >
                <OptIcon className="size-5" />
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
