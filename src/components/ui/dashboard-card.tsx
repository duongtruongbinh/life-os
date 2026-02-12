import { cn } from "@/lib/utils";

interface DashboardCardProps {
    title?: string;
    icon?: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
    children: React.ReactNode;
}

/** Reusable bento-tile card with optional header (icon + title + action). */
export function DashboardCard({
    title,
    icon,
    action,
    className,
    children,
}: DashboardCardProps) {
    return (
        <div className={cn("bento-tile", className)}>
            {(title || action) && (
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight">
                        {icon}
                        {title}
                    </h2>
                    {action}
                </div>
            )}
            {children}
        </div>
    );
}
