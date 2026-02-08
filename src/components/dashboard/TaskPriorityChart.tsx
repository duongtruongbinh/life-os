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
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't show label for small slices

    return (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={10} fontWeight="bold">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

export function TaskPriorityChart() {
    const tasks = useLifeOSStore((s) => s.tasks);
    const isMobile = useIsMobile();

    const data = useMemo(() => {
        const pending = tasks.filter((t) => !t.is_completed);
        const counts = { urgent: 0, high: 0, normal: 0 };

        pending.forEach(t => {
            const p = t.priority || "normal";
            if (counts[p] !== undefined) counts[p]++;
        });

        return [
            { name: "Urgent", value: counts.urgent, color: COLORS.urgent },
            { name: "High", value: counts.high, color: COLORS.high },
            { name: "Normal", value: counts.normal, color: COLORS.normal },
        ].filter(d => d.value > 0);
    }, [tasks]);

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                No pending tasks
            </div>
        );
    }

    return (
        <div className="w-full h-[200px] flex flex-col">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pending by Priority</h3>
            </div>
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={renderCustomizedLabel}
                            outerRadius={80}
                            innerRadius={40}
                            fill="#8884d8"
                            dataKey="value"
                            paddingAngle={2}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            itemStyle={{ color: 'var(--foreground)' }}
                        />
                        <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
