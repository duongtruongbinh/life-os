"use client";

import { useMemo } from "react";
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip,
} from "recharts";
import { useLifeOSStore } from "@/store/useLifeOSStore";
import { calculateDurationHours, getLocalDateKey } from "@/lib/date-utils";
import { DEFAULT_TARGET_SLEEP_HOURS, DEFAULT_TARGET_FOCUS_HOURS } from "@/lib/constants";


export function WellnessRadar({ minimal = false }: { minimal?: boolean }) {
    const dailyLogsLast365 = useLifeOSStore((s) => s.dailyLogsLast365);
    const tasks = useLifeOSStore((s) => s.tasks);
    const habitDefinitions = useLifeOSStore((s) => s.habitDefinitions);


    const data = useMemo(() => {
        // ... (data calculation is same)
        const today = getLocalDateKey();
        // We need keys for last 7 days
        const last7DaysKeys = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            last7DaysKeys.push(getLocalDateKey(d));
        }

        let totalSleep = 0;
        let totalFocus = 0;
        let totalHabitRate = 0;
        let daysWithData = 0;

        last7DaysKeys.forEach((key) => {
            const log = dailyLogsLast365.find(l => l.date === key);
            if (log) {
                daysWithData++;
                if (log.sleep_start && log.sleep_end) {
                    totalSleep += calculateDurationHours(log.sleep_start, log.sleep_end);
                }
                totalFocus += (log.focus_minutes ?? 0) / 60;

                const completedHabits = Object.values(log.habits_status ?? {}).filter(Boolean).length;
                const totalHabits = habitDefinitions.length || 1;
                totalHabitRate += (completedHabits / totalHabits);
            }
        });

        // Normalize averages (divide by 7 or daysWithData? 7 represents "Actual / Week")
        // If no data, it pulls average down, which is correct for "Weekly Performance".
        const divisor = 7;

        const avgSleep = totalSleep / divisor;
        const avgFocus = totalFocus / divisor;
        const avgHabitRate = totalHabitRate / divisor;

        // Tasks Completion Rate
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoKey = getLocalDateKey(weekAgo);

        const relevantTasks = tasks.filter(t =>
            (t.completed_at && t.completed_at >= weekAgoKey) ||
            (t.due_date && t.due_date >= weekAgoKey && t.due_date <= today)
        );

        // If no tasks, assume 0 or 100? Let's say 50 neutral or 0.
        const completedTasks = relevantTasks.filter(t => t.is_completed).length;
        const totalRelevantTasks = relevantTasks.length || 1;
        const taskRate = relevantTasks.length ? (completedTasks / totalRelevantTasks) : 0;

        // Normalize to 0-100
        const sleepScore = Math.min(100, (avgSleep / DEFAULT_TARGET_SLEEP_HOURS) * 100);
        const focusScore = Math.min(100, (avgFocus / DEFAULT_TARGET_FOCUS_HOURS) * 100);
        const habitScore = Math.min(100, avgHabitRate * 100);
        const taskScore = Math.min(100, taskRate * 100);

        return [
            { subject: "Sleep", A: Math.round(sleepScore), fullMark: 100 },
            { subject: "Focus", A: Math.round(focusScore), fullMark: 100 },
            { subject: "Habits", A: Math.round(habitScore), fullMark: 100 },
            { subject: "Tasks", A: Math.round(taskScore), fullMark: 100 },
        ];
    }, [dailyLogsLast365, habitDefinitions, tasks]);

    const chartContent = (
        <RadarChart cx="50%" cy="50%" outerRadius={minimal ? "90%" : "70%"} data={data}>
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: "var(--foreground)", fontSize: minimal ? 10 : 11, fontWeight: 600 }}
            />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
                name="Score"
                dataKey="A"
                stroke="var(--primary)"
                fill="var(--primary)"
                fillOpacity={0.4}
            />
            <Tooltip
                contentStyle={{
                    backgroundColor: 'var(--background)',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
                itemStyle={{ color: 'var(--foreground)' }}
                formatter={(value: any) => [`${Math.round(Number(value))}%`, 'Score']}
            />
        </RadarChart>
    );

    if (minimal) {
        return (
            <div className="w-full h-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    {chartContent}
                </ResponsiveContainer>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 p-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 self-start">Life Balance (Last 7 Days)</h3>
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    {chartContent}
                </ResponsiveContainer>
            </div>
        </div>
    );
}
