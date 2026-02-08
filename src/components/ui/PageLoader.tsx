"use client";

import { Skeleton } from "@/components/ui/skeleton";

interface PageLoaderProps {
    variant?: "dashboard" | "detail" | "form";
}

/**
 * Unified page loading skeleton with consistent styling.
 * Uses animated shimmer effect from globals.css.
 */
export function PageLoader({ variant = "dashboard" }: PageLoaderProps) {
    if (variant === "form") {
        return (
            <div className="flex flex-col gap-4 p-4">
                <Skeleton className="h-8 w-48" />
                <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-3/4" />
                </div>
                <Skeleton className="h-10 w-32 mt-4" />
            </div>
        );
    }

    if (variant === "detail") {
        return (
            <div className="flex flex-col gap-4 p-4 max-w-2xl mx-auto">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-6 w-48" />
                <div className="bento-tile space-y-4 p-4">
                    <Skeleton className="h-[200px] w-full rounded-xl" />
                    <div className="grid grid-cols-2 gap-3">
                        <Skeleton className="h-20 rounded-xl" />
                        <Skeleton className="h-20 rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    // Dashboard variant (default)
    return (
        <div className="flex flex-col gap-3 p-3 lg:p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-32" />
            </div>

            {/* Weekly Summary */}
            <Skeleton className="h-24 w-full rounded-2xl" />

            {/* Grid */}
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
                <Skeleton className="lg:col-span-9 h-[280px] rounded-2xl" />
                <Skeleton className="lg:col-span-3 h-[280px] rounded-2xl" />
                <Skeleton className="lg:col-span-6 h-[300px] rounded-2xl" />
                <Skeleton className="lg:col-span-3 h-[300px] rounded-2xl" />
                <Skeleton className="lg:col-span-3 h-[300px] rounded-2xl" />
            </div>
        </div>
    );
}
