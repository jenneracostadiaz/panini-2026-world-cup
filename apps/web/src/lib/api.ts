import type { Session } from "next-auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

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
    window.location.href = "/login";
  }

  return res;
}
