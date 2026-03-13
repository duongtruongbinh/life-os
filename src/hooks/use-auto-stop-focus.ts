"use client";

import { useEffect } from "react";
import { useLifeOSStore } from "@/store/useLifeOSStore";

/**
 * Automatically stops the focus timer when the user closes the website.
 * This triggers on `beforeunload` (desktop) and `pagehide` (mobile).
 * Because Zustand uses `persist`, the modified state is saved synchronously to localStorage.
 */
export function useAutoStopFocus() {
  useEffect(() => {
    const handleUnload = () => {
      const state = useLifeOSStore.getState();
      if (state.dailyLog.focus_start) {
        state.setFocusEnd();
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("pagehide", handleUnload);
    };
  }, []);
}
