import { AppShell } from "@/components/layout/AppShell";

/** Layout for app routes: sidebar, header, bottom nav (mobile). */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
