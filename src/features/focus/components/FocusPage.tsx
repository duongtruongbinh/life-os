"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { m } from "framer-motion";
import { useLifeOSStore } from "@/store/useLifeOSStore";
import { DateNav } from "@/components/dashboard/DateNav";
import { FocusTracker } from "@/features/focus/components/FocusTracker";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load analysis component for better performance
const FocusAnalysis = dynamic(
    () => import("@/features/focus/components/FocusAnalysis").then((m) => m.FocusAnalysis),
    { ssr: false, loading: () => <Skeleton className="h-[400px] w-full rounded-xl" /> }
);

/** Dedicated focus timer and analysis page. */
export function FocusPage() {
    const loadInitialData = useLifeOSStore((s) => s.loadInitialData);
    const selectedDate = useLifeOSStore((s) => s.selectedDate);
    const setSelectedDate = useLifeOSStore((s) => s.setSelectedDate);
    const error = useLifeOSStore((s) => s.error);
    const loading = useLifeOSStore((s) => s.loading);

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    return (
        <div className="page-bg min-h-full">
            <m.main
                initial="hidden"
                animate="visible"
                variants={{
                    hidden: { opacity: 0 },
                    visible: {
                        opacity: 1,
                        transition: { staggerChildren: 0.1 }
                    }
                }}
                className="mx-auto flex min-h-0 max-w-2xl flex-col gap-4 p-4 pb-24 md:p-6 md:pb-24 animate-stagger"
            >
                {error && (
                    <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2 text-destructive text-sm backdrop-blur">
                        {error}
                    </div>
                )}
                {loading && (
                    <div className="text-muted-foreground text-sm">Loading…</div>
                )}

                <Tabs defaultValue="tracker" className="flex-1">
                    <TabsList className="w-full">
                        <TabsTrigger value="tracker" className="flex-1">Tracker</TabsTrigger>
                        <TabsTrigger value="analysis" className="flex-1">Analysis</TabsTrigger>
                    </TabsList>

                    <TabsContent value="tracker" className="mt-4 space-y-4">
                        <DateNav value={selectedDate} onChange={setSelectedDate} />
                        <div className="bento-tile min-h-0">
                            <FocusTracker />
                        </div>
                    </TabsContent>

                    <TabsContent value="analysis" className="mt-4 space-y-4">
                        <FocusAnalysis />
                    </TabsContent>
                </Tabs>
            </m.main>
        </div>
    );
}
