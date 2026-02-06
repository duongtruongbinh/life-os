import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
    icon: LucideIcon;
    title: string;
    description: string;
    className?: string;
};

export function EmptyState({ icon: Icon, title, description, className }: EmptyStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center py-10 text-center animate-in fade-in zoom-in-95 duration-500", className)}>
            <div className="flex size-12 items-center justify-center rounded-full bg-slate-100 dark:bg-white/5 mb-4">
                <Icon className="size-6 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
            <p className="text-xs text-muted-foreground max-w-[200px]">{description}</p>
        </div>
    );
}
