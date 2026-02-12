"use client";

import { useMemo } from "react";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip
} from "recharts";
import { useLifeOSStore } from "@/store/useLifeOSStore";

const COLORS = {
    urgent: "#ef4444", // red-500
    high: "#f97316",   // orange-500
    normal: "#3b82f6", // blue-500
};

export function TaskPriorityChart() {
    const tasks = useLifeOSStore((s) => s.tasks);

    const { data, totalPending } = useMemo(() => {
        const pending = tasks.filter((t) => !t.is_completed);
        const counts = { urgent: 0, high: 0, normal: 0 };

        pending.forEach(t => {
            const p = (t.priority || "normal") as keyof typeof counts;
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
            <div className="flex flex-col items-center justify-center h-[260px] text-muted-foreground bg-slate-50/50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10">
                <span className="text-2xl">🎉</span>
                <p className="text-sm font-medium mt-2">No pending tasks</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full min-h-[260px] flex flex-col bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 p-4 shadow-sm relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 z-10 shrink-0">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <span className="size-2 rounded-full bg-slate-400" />
                    Workload
                </h3>
            </div>

            {/* Chart Area - Flex 1 để chiếm hết khoảng trống còn lại */}
            <div className="flex-1 min-h-0 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            // Dùng % để responsive chuẩn trên mọi màn hình
                            innerRadius="65%"
                            outerRadius="90%"
                            paddingAngle={5}
                            cornerRadius={5}
                            stroke="none"
                            dataKey="value"
                            startAngle={90}
                            endAngle={-270}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                borderRadius: '12px',
                                border: 'none',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                                backgroundColor: 'rgba(20,20,20,0.95)',
                                color: 'white',
                                fontSize: '12px'
                            }}
                            itemStyle={{ color: 'white' }}
                            formatter={(value: any) => [`${value} tasks`, '']}
                        />
                    </PieChart>
                </ResponsiveContainer>

                {/* Center Text Overlay - Tuyệt đối ở giữa div cha của chart */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                        {totalPending}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                        Pending
                    </span>
                </div>
            </div>

            {/* Custom Legend - Đưa ra ngoài để không ảnh hưởng layout biểu đồ */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 shrink-0">
                {data.map((item) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                        <span
                            className="size-2.5 rounded-full"
                            style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                            {item.name}
                        </span>
                        <span className="text-xs text-muted-foreground ml-0.5">
                            ({item.value})
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}