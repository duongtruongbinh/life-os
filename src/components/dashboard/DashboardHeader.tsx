"use client";

import { motion } from "framer-motion";
import { useLifeOSStore } from "@/store/useLifeOSStore";
import { useEffect, useMemo, useState } from "react";
import { calculateDurationHours } from "@/lib/date-utils";

function getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
}

export function DashboardHeader() {
    const dailyLog = useLifeOSStore((s) => s.dailyLog);
    const tasks = useLifeOSStore((s) => s.tasks);
    const [greeting, setGreeting] = useState("");

    useEffect(() => {
        setGreeting(getGreeting());
    }, []);

    const tasksRemaining = tasks.filter((t) => !t.is_completed).length;

    const sleepHours = useMemo(
        () => calculateDurationHours(dailyLog.sleep_start, dailyLog.sleep_end),
        [dailyLog.sleep_start, dailyLog.sleep_end]
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mb-1"
        >
            <p className="text-sm text-muted-foreground px-1 font-medium">
                {greeting ? `${greeting}.` : "Welcome back."}
                {dailyLog.sleep_start && dailyLog.sleep_end && (
                    <span className="ml-1 text-slate-600 dark:text-slate-400">
                        Slept <span className="text-foreground font-semibold">{sleepHours.toFixed(1)}h</span>.
                    </span>
                )}
                {tasksRemaining > 0 ? (
                    <span className="ml-1 text-slate-600 dark:text-slate-400">
                        <span className="text-foreground font-semibold">{tasksRemaining}</span> tasks left.
                    </span>
                ) : (
                    <span className="ml-1 text-green-600 dark:text-green-400 font-medium"> All done.</span>
                )}
            </p>
        </motion.div>
    );
}
