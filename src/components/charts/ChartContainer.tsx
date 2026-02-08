"use client";

import { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { BarChart3 } from "lucide-react";

interface ChartContainerProps {
    title?: string;
    loading?: boolean;
    error?: string | null;
    empty?: boolean;
    emptyMessage?: string;
    height?: number | string;
    children: ReactNode;
    headerAction?: ReactNode;
}

/**
 * Reusable chart container with consistent loading, error, and empty states.
 * Wraps children in ErrorBoundary for crash protection.
 */
export function ChartContainer({
    title,
    loading = false,
    error = null,
    empty = false,
    emptyMessage = "No data available",
    height = 200,
    children,
    headerAction,
}: ChartContainerProps) {
    const heightStyle = typeof height === "number" ? `${height}px` : height;

    if (loading) {
        return (
            <div className="space-y-3">
                {title && (
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-32" />
                        {headerAction && <Skeleton className="h-8 w-24" />}
                    </div>
                )}
                <Skeleton
                    className="w-full rounded-xl"
                    style={{ height: heightStyle, minHeight: heightStyle }}
                />
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-3">
                {title && (
                    <h3 className="text-lg font-bold tracking-tight">{title}</h3>
                )}
                <div
                    className="flex items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 text-destructive text-sm"
                    style={{ height: heightStyle, minHeight: heightStyle }}
                >
                    {error}
                </div>
            </div>
        );
    }

    if (empty) {
        return (
            <div className="space-y-3">
                {title && (
                    <h3 className="text-lg font-bold tracking-tight">{title}</h3>
                )}
                <div
                    className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 text-muted-foreground"
                    style={{ height: heightStyle, minHeight: heightStyle }}
                >
                    <BarChart3 className="size-8 opacity-50" />
                    <p className="text-sm">{emptyMessage}</p>
                </div>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <div className="space-y-3">
                {(title || headerAction) && (
                    <div className="flex items-center justify-between">
                        {title && (
                            <h3 className="text-lg font-bold tracking-tight">{title}</h3>
                        )}
                        {headerAction}
                    </div>
                )}
                <div style={{ height: heightStyle, minHeight: heightStyle }}>
                    {children}
                </div>
            </div>
        </ErrorBoundary>
    );
}
