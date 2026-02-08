"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
    value: number | null;
    onChange: (value: number) => void;
    max?: number;
    size?: "sm" | "md" | "lg";
    readonly?: boolean;
}

const SIZE_MAP = {
    sm: "size-4",
    md: "size-5",
    lg: "size-6",
} as const;

/**
 * Interactive star rating component (1-5).
 */
export function StarRating({
    value,
    onChange,
    max = 5,
    size = "md",
    readonly = false,
}: StarRatingProps) {
    const sizeClass = SIZE_MAP[size];

    return (
        <div className="flex items-center gap-0.5" role="group" aria-label="Rating">
            {Array.from({ length: max }, (_, i) => {
                const starValue = i + 1;
                const isFilled = value !== null && starValue <= value;

                return (
                    <button
                        key={starValue}
                        type="button"
                        disabled={readonly}
                        onClick={() => onChange(starValue)}
                        className={cn(
                            "transition-all duration-150",
                            readonly ? "cursor-default" : "cursor-pointer hover:scale-110",
                            isFilled
                                ? "text-amber-400"
                                : "text-muted-foreground/30 hover:text-amber-400/50"
                        )}
                        aria-label={`${starValue} star${starValue > 1 ? "s" : ""}`}
                    >
                        <Star
                            className={cn(sizeClass, isFilled && "fill-current")}
                        />
                    </button>
                );
            })}
        </div>
    );
}
