"use client";

import dynamic from "next/dynamic";

const HabitSparklineClient = dynamic(() => import("./HabitSparklineClient"), {
    ssr: false,
    loading: () => (
        <div className="w-full flex h-[32px] items-center justify-center rounded bg-muted/50">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
    ),
});

export function HabitSparkline({
    habitId,
    color = "var(--color-habit)",
    compact = false,
}: {
    habitId: string;
    color?: string;
    compact?: boolean;
}) {
    return <HabitSparklineClient habitId={habitId} color={color} compact={compact} />;
}
