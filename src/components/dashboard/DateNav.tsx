"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import { format, parseISO, addDays, subDays } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { getLocalDateKey } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

type DateNavProps = {
  value: string;
  onChange: (date: string) => void;
};

const isValidDateKey = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

/** Date navigation: < Prev | Today | Next > with calendar. No blocking; navigation is seamless. */
export function DateNav({ value, onChange }: DateNavProps) {
  const [isToday, setIsToday] = useState(false);
  const date = isValidDateKey(value) ? parseISO(value) : parseISO(getLocalDateKey(new Date()));

  useEffect(() => {
    setIsToday(value === getLocalDateKey());
  }, [value]);

  function toDateKey(d: Date): string {
    return getLocalDateKey(d);
  }

  function handlePrev() {
    onChange(toDateKey(subDays(date, 1)));
  }

  function handleNext() {
    onChange(toDateKey(addDays(date, 1)));
  }

  function handleToday() {
    onChange(getLocalDateKey());
  }

  function handleSelect(d: Date | undefined) {
    if (d) onChange(toDateKey(d));
  }

  return (
    <div className="mb-4 flex items-center justify-between gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePrev}
        aria-label="Previous day"
        className="size-11 shrink-0"
      >
        <ChevronLeft className="size-5 md:size-5" />
      </Button>
      <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={isToday ? "default" : "outline"}
              className={cn(
                "min-h-[44px] min-w-0 max-w-[180px] justify-center gap-2 text-base font-bold tracking-tight sm:min-w-[140px] sm:max-w-[200px] md:min-w-[160px]",
                isToday && "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
              )}
            >
              <CalendarIcon className="size-4 shrink-0" />
              <span className="truncate">
                {isToday ? "Today" : format(date, "EEE d")}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {!isToday && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleToday}
            className="min-h-[44px] shrink-0"
          >
            Today
          </Button>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleNext}
        aria-label="Next day"
        className="size-11 shrink-0"
      >
        <ChevronRight className="size-5 md:size-5" />
      </Button>
    </div>
  );
}
