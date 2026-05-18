"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="rounded border border-neutral-400 px-4 py-2 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800"
    >
      Cerrar sesión
    </button>
  );
}
