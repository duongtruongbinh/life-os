"use client";

import { useState } from "react";
import { Pencil, X, Check } from "lucide-react";
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
    currentCount: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/** Dialog to edit push-up count for a specific date */
export function PushupEditDialog({ date, currentCount, open, onOpenChange }: Props) {
    const setPushupCountForDate = useLifeOSStore((s) => s.setPushupCountForDate);
    const [count, setCount] = useState(String(currentCount));

    function handleSave() {
        const n = parseInt(count, 10);
        if (!Number.isNaN(n) && n >= 0) {
            setPushupCountForDate(date, n);
            onOpenChange(false);
        }
    }

    function handleReset() {
        setCount(String(currentCount));
    }

    // Format date for display
    const displayDate = new Date(date).toLocaleDateString("vi-VN", {
        weekday: "short",
        day: "numeric",
        month: "short",
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xs">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <Pencil className="size-4 text-[var(--color-pushup)]" />
                        Edit Push-ups
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">{displayDate}</p>
                    <Input
                        type="number"
                        min={0}
                        value={count}
                        onChange={(e) => setCount(e.target.value)}
                        className="h-12 text-center text-xl font-bold"
                        autoFocus
                    />
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
                    <Button size="sm" onClick={handleSave} className="gap-1">
                        <Check className="size-3.5" />
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
