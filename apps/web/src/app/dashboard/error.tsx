"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center p-4">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Algo salió mal cargando esta sección</CardTitle>
          <CardDescription>
            Hubo un problema procesando tu pedido. Probá reintentar.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {error.digest ? (
            <p className="text-xs text-muted-foreground">
              Código: <span className="font-mono">{error.digest}</span>
            </p>
          ) : null}
          <Button onClick={reset}>Reintentar</Button>
        </CardContent>
      </Card>
    </div>
  );
}
