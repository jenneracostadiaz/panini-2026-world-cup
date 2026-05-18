import { auth } from "@/auth";

import { LogoutButton } from "./logout-button";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="text-lg">
        Sesión activa como:{" "}
        <span className="font-mono">{session?.user?.email ?? "—"}</span>
      </p>
      <LogoutButton />
    </main>
  );
}
