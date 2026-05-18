"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";

export function LogoutButton({
  variant = "ghost",
}: {
  variant?: "ghost" | "outline";
}) {
  return (
    <Button
      variant={variant}
      size="sm"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="w-full justify-start"
    >
      <LogOut className="h-4 w-4" />
      <span>Cerrar sesión</span>
    </Button>
  );
}
