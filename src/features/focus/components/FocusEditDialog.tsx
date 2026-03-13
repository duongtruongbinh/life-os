"use client";

import { useState } from "react";
import { Timer, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { useLifeOSStore } from "@/store/useLifeOSStore";

interface Props {
    date: string;
    currentMinutes: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/** Dialog to edit focus minutes for a specific date */
export function FocusEditDialog({ date, currentMinutes, open, onOpenChange }: Props) {
    const setFocusMinutesForDate = useLifeOSStore((s) => s.setFocusMinutesForDate);

    // Convert minutes to hours for easier input
    const [hours, setHours] = useState(String(Math.floor(currentMinutes / 60)));
    const [minutes, setMinutes] = useState(String(currentMinutes % 60));

    function handleSave() {
        const h = parseInt(hours, 10) || 0;
        const m = parseInt(minutes, 10) || 0;
        const totalMinutes = h * 60 + m;
        if (totalMinutes >= 0) {
            setFocusMinutesForDate(date, totalMinutes);
            onOpenChange(false);
        }
    }


    // Format date for display
    const displayDate = new Date(date).toLocaleDateString("vi-VN", {
        weekday: "short",
        day: "numeric",
        month: "short",
    });

    const currentHours = (currentMinutes / 60).toFixed(1);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xs">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <Timer className="size-4 text-[var(--color-focus)]" />
                        Edit Focus Time
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">{displayDate}</p>
                        <p className="text-xs text-muted-foreground">
                            Current: {currentHours}h
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex-1">
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                Hours
                            </label>
                            <Input
                                type="number"
                                min={0}
                                max={24}
                                value={hours}
                                onChange={(e) => setHours(e.target.value)}
                                className="h-12 text-center text-xl font-bold"
                                autoFocus
                            />
                        </div>
                        <span className="text-2xl font-bold text-muted-foreground pt-5">:</span>
                        <div className="flex-1">
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                Minutes
                            </label>
                            <Input
                                type="number"
                                min={0}
                                max={59}
                                value={minutes}
                                onChange={(e) => setMinutes(e.target.value)}
                                className="h-12 text-center text-xl font-bold"
                            />
                        </div>
                    </div>

                    {/* Quick presets */}
                    <div className="flex gap-2 flex-wrap">
                        {[1, 2, 4, 8].map((h) => (
                            <Button
                                key={h}
                                variant="outline"
                                size="sm"
                                onClick={() => { setHours(String(h)); setMinutes("0"); }}
                                className="text-xs flex-1"
                            >
                                {h}h
                            </Button>
                        ))}
                    </div>
                </div>
                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        className="gap-1"
                    >
                        <X className="size-3.5" />
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSave}
                        className="gap-1 bg-[var(--color-focus)] hover:bg-[var(--color-focus)]/90"
                    >
                        <Check className="size-3.5" />
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
