import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
    icon: LucideIcon;
    title: string;
    description: string;
    className?: string;
};

export function EmptyState({ icon: Icon, title, description, className }: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={cn("flex flex-col items-center justify-center py-10 text-center", className)}
        >
            <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="flex size-14 items-center justify-center rounded-full bg-slate-100 dark:bg-white/5 mb-4 shadow-sm"
            >
                <Icon className="size-6 text-muted-foreground" />
            </motion.div>
            <h3 className="text-sm font-semibold text-foreground mb-1 tracking-tight">{title}</h3>
            <p className="text-xs text-muted-foreground max-w-[200px] leading-relaxed">{description}</p>
        </motion.div>
    );
}
