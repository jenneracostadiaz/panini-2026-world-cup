import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

import { DashboardSidebar } from "./dashboard-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <SidebarProvider>
      <DashboardSidebar email={session.user.email ?? null} />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-background px-4">
          <SidebarTrigger />
          <h1 className="text-sm font-medium text-muted-foreground">
            Álbum Mundial 2026
          </h1>
        </header>
        <div className="flex-1 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
