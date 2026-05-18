"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

const order = ["light", "dark", "system"] as const;
type Theme = (typeof order)[number];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const current = (theme ?? "system") as Theme;

  function cycle() {
    const idx = order.indexOf(current);
    const next = order[(idx + 1) % order.length] ?? "system";
    setTheme(next);
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycle}
      aria-label={`Tema actual: ${current}. Cambiar tema`}
      title={`Tema: ${current}`}
    >
      {!mounted ? (
        <Sun className="h-4 w-4" />
      ) : current === "light" ? (
        <Sun className="h-4 w-4" />
      ) : current === "dark" ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Monitor className="h-4 w-4" />
      )}
    </Button>
  );
}
