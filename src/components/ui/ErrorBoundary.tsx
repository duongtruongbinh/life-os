"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    onReset?: () => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error boundary component that catches JavaScript errors in child components.
 * Displays a fallback UI with retry option.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        this.props.onReset?.();
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
                    <div className="rounded-full bg-destructive/10 p-4">
                        <AlertTriangle className="size-8 text-destructive" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">
                            Something went wrong
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {this.state.error?.message || "An unexpected error occurred"}
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={this.handleReset}
                        className="gap-2"
                    >
                        <RefreshCw className="size-4" />
                        Try again
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * Functional wrapper for ErrorBoundary with reset key support.
 */
export function ErrorBoundaryWrapper({
    children,
    resetKey,
    fallback,
    onReset,
}: ErrorBoundaryProps & { resetKey?: string | number }) {
    return (
        <ErrorBoundary key={resetKey} fallback={fallback} onReset={onReset}>
            {children}
        </ErrorBoundary>
    );
}
