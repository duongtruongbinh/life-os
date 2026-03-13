"use client";

import { useState, useCallback } from "react";
import { Download, FileJson, FileSpreadsheet, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLifeOSStore } from "@/store/useLifeOSStore";
import { isHabitDone } from "@/lib/habit-utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, subDays } from "date-fns";
import { getLocalDateKey } from "@/lib/date-utils";

type ExportFormat = "json" | "csv";

interface ExportButtonProps {
    className?: string;
}

/**
 * Export button for downloading user data.
 * Uses local store data - no additional API calls needed.
 */
export function ExportButton({ className }: ExportButtonProps) {
    const dailyLogsLast365 = useLifeOSStore((s) => s.dailyLogsLast365);
    const habitDefinitions = useLifeOSStore((s) => s.habitDefinitions);
    const tasks = useLifeOSStore((s) => s.tasks);
    const userSettings = useLifeOSStore((s) => s.userSettings);

    const [isOpen, setIsOpen] = useState(false);

    const exportData = useCallback((formatType: ExportFormat, days: number) => {
        const today = getLocalDateKey();
        const startDate = format(subDays(new Date(), days), "yyyy-MM-dd");

        // Filter logs for the selected range
        const logsInRange = dailyLogsLast365.filter(
            (log) => log.date >= startDate && log.date <= today
        );

        if (formatType === "json") {
            const data = {
                exportDate: new Date().toISOString(),
                range: { startDate, endDate: today, days },
                userSettings,
                habitDefinitions,
                tasks,
                dailyLogs: logsInRange,
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: "application/json"
            });
            downloadBlob(blob, `lifeos-export-${today}.json`);
        } else {
            // CSV format - flatten daily logs
            const headers = [
                "date",
                "focus_minutes",
                "pushup_count",
                "sleep_start",
                "sleep_end",
                "notes",
                ...habitDefinitions.map((h) => `habit_${h.name}`),
            ];

            const rows = logsInRange.map((log) => [
                log.date,
                (log.focus_minutes ?? 0).toString(),
                (log.pushup_count ?? 0).toString(),
                log.sleep_start || "",
                log.sleep_end || "",
                (log.notes || "").replace(/"/g, '""'),
                ...habitDefinitions.map((h) =>
                    isHabitDone(log.habits_status, h.id) ? "completed" : ""
                ),
            ]);

            const csvContent = [
                headers.join(","),
                ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
            ].join("\n");

            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
            downloadBlob(blob, `lifeos-export-${today}.csv`);
        }

        setIsOpen(false);
    }, [dailyLogsLast365, habitDefinitions, tasks, userSettings]);

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={className}>
                    <Download className="size-4 mr-2" />
                    Export Data
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="start">
                <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Export Format</h4>

                    <div className="space-y-2">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="size-3" />
                            Last 30 days
                        </p>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => exportData("json", 30)}
                                className="flex-1 gap-1.5"
                            >
                                <FileJson className="size-4" />
                                JSON
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => exportData("csv", 30)}
                                className="flex-1 gap-1.5"
                            >
                                <FileSpreadsheet className="size-4" />
                                CSV
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="size-3" />
                            Last 365 days
                        </p>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => exportData("json", 365)}
                                className="flex-1 gap-1.5"
                            >
                                <FileJson className="size-4" />
                                JSON
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => exportData("csv", 365)}
                                className="flex-1 gap-1.5"
                            >
                                <FileSpreadsheet className="size-4" />
                                CSV
                            </Button>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
