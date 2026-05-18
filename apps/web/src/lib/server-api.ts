import { auth } from "@/auth";
import { apiFetch } from "@/lib/api";

export async function serverApiJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const session = await auth();
  const res = await apiFetch(
    path,
    { cache: "no-store", ...init },
    session,
  );
  if (!res.ok) {
    throw new Error(
      `API ${path} failed: ${res.status} ${res.statusText}`,
    );
  }
  return (await res.json()) as T;
}
