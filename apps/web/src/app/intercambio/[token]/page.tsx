import { notFound } from "next/navigation";

import { Flag } from "@/components/flag";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import type { ExchangeView } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PublicExchangePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const res = await apiFetch(
    `/api/exchange/${token}`,
    { cache: "no-store" },
    null,
  );
  if (res.status === 404) notFound();
  if (!res.ok) throw new Error(`API ${res.status}`);
  const data = (await res.json()) as ExchangeView;

  const totalRepeated = data.repeated.reduce(
    (acc, g) => acc + g.stickers.reduce((a, s) => a + s.quantity, 0),
    0,
  );

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 md:p-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">
          Intercambio de {data.label ?? "—"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Actualizado el{" "}
          {new Date(data.updatedAt).toLocaleString("es", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
        {data.contactInfo ? (
          <p className="text-sm">
            Contacto:{" "}
            {data.contactInfo.startsWith("http") ? (
              <a
                href={data.contactInfo}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline"
              >
                {data.contactInfo}
              </a>
            ) : (
              <span className="font-mono">{data.contactInfo}</span>
            )}
          </p>
        ) : null}
        <Badge variant="secondary" className="mt-2 w-fit text-base">
          {totalRepeated} repetidas
        </Badge>
      </header>

      {data.repeated.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {data.label ?? "Este coleccionista"} todavía no tiene repetidas.
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {data.repeated.map((group) => (
            <Card key={group.teamId}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <Flag
                    code={group.teamFlag}
                    alt={group.teamName}
                    size={40}
                  />
                  <div>
                    <CardTitle className="text-base">
                      {group.teamName}
                    </CardTitle>
                    <CardDescription>
                      {group.stickers.reduce((a, s) => a + s.quantity, 0)}{" "}
                      figuritas
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col divide-y">
                  {group.stickers.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between gap-3 py-2 text-sm"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span className="w-8 text-xs text-muted-foreground tabular-nums">
                          #{s.position}
                        </span>
                        <span className="truncate">{s.playerName}</span>
                      </span>
                      <Badge
                        variant="outline"
                        className="border-amber-500 text-amber-700 dark:text-amber-300"
                      >
                        x{s.quantity}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
