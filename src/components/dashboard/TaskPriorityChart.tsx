"use client";

import { useMemo } from "react";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend
} from "recharts";
import { useLifeOSStore } from "@/store/useLifeOSStore";
import { useIsMobile } from "@/hooks/use-mobile";

const COLORS = {
    urgent: "#ef4444", // red-500
    high: "#f97316",   // orange-500
    normal: "#3b82f6", // blue-500
};

const RADIAN = Math.PI / 180;

export function TaskPriorityChart() {
    const tasks = useLifeOSStore((s) => s.tasks);
    const isMobile = useIsMobile();

    const { data, totalPending } = useMemo(() => {
        const pending = tasks.filter((t) => !t.is_completed);
        const counts = { urgent: 0, high: 0, normal: 0 };

        pending.forEach(t => {
            const p = t.priority || "normal";
            if (counts[p] !== undefined) counts[p]++;
        });

        const data = [
            { name: "Urgent", value: counts.urgent, color: COLORS.urgent },
            { name: "High", value: counts.high, color: COLORS.high },
            { name: "Normal", value: counts.normal, color: COLORS.normal },
        ].filter(d => d.value > 0);

        return { data, totalPending: pending.length };
    }, [tasks]);

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[220px] text-muted-foreground bg-slate-50/50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10">
                <span className="text-2xl">🎉</span>
                <p className="text-sm font-medium mt-2">No pending tasks</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full min-h-[220px] flex flex-col bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 p-4 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-2 z-10">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <span className="size-2 rounded-full bg-slate-400" />
                    Workload
                </h3>
            </div>

            <div className="flex-1 min-h-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            paddingAngle={4}
                            cornerRadius={4}
                            stroke="none"
                            startAngle={90}
                            endAngle={-270}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', backgroundColor: 'rgba(20,20,20,0.95)', color: 'white' }}
                            itemStyle={{ color: 'white' }}
                            separator=""
                            formatter={(value: any) => [`${value} tasks`, '']}
                        />
                        <Legend
                            verticalAlign="bottom"
                            align="center"
                            iconType="circle"
                            wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                            formatter={(value, entry: any) => (
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 ml-1 mr-2">
                                    {value} <span className="text-muted-foreground font-normal">({entry.payload.value})</span>
                                </span>
                            )}
                        />
                    </PieChart>
                </ResponsiveContainer>

                {/* Center Text Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pr-[100px] pb-2">
                    <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{totalPending}</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pending</span>
                </div>
            </div>
        </div>
    );
}
