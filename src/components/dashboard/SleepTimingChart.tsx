"use client";

import dynamic from "next/dynamic";

const SleepTimingChartClient = dynamic(() => import("./SleepTimingChartClient"), {
    ssr: false,
    loading: () => (
        <div className="w-full flex h-[300px] items-center justify-center rounded-xl bg-muted/30">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
    ),
});

export function SleepTimingChart() {
    return <SleepTimingChartClient />;
}
