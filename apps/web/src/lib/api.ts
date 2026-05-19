import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

if (typeof window !== "undefined" && !process.env.NEXT_PUBLIC_API_URL) {
  console.error(
    "[api] NEXT_PUBLIC_API_URL no está definido — usando fallback http://localhost:3001. Revisá los build args.",
  );
}

let sessionExpiredHandled = false;

export async function apiFetch(
  path: string,
  options: RequestInit = {},
  session?: Session | null,
): Promise<Response> {
  const headers = new Headers(options.headers);
  if (!headers.has("content-type") && options.body) {
    headers.set("content-type", "application/json");
  }
  if (session?.apiToken) {
    headers.set("Authorization", `Bearer ${session.apiToken}`);
  }

  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const res = await fetch(url, { ...options, headers });

  if (res.status === 401 && typeof window !== "undefined") {
    if (!sessionExpiredHandled) {
      sessionExpiredHandled = true;
      toast.error("Sesión expirada, volvé a iniciar sesión");
      void signOut({ redirectTo: "/login" });
    }
  }

  return res;
}
