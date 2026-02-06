"use client";

import { useEffect } from "react";
import { useLifeOSStore } from "@/store/useLifeOSStore";
import { DateNav } from "@/components/dashboard/DateNav";
import { FocusTracker } from "@/components/focus/FocusTracker";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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
            <main className="mx-auto flex min-h-0 max-w-2xl flex-col gap-4 p-4 pb-24 md:p-6 md:pb-24">
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
                        {/* Future specialized analysis or just move the chart here if we want separate view */}
                        <div className="bento-tile flex items-center justify-center p-8 text-muted-foreground">
                            Detailed analysis coming soon
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
