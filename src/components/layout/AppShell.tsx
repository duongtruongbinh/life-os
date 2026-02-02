"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { SaveChangesButton } from "@/components/dashboard/SaveChangesButton";

type AppShellProps = {
  children: React.ReactNode;
};

/** App shell: sidebar, bottom nav (mobile), header. No navigation guards; data is persisted locally. */
export function AppShell({ children }: AppShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-6">
          <SidebarTrigger />
          <div className="flex-1" />
          <SaveChangesButton />
        </header>
        <div className="flex-1 pb-24 md:pb-0">{children}</div>
        <MobileBottomNav />
      </SidebarInset>
    </SidebarProvider>
  );
}
