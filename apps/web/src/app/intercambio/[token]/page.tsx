import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Flag } from "@/components/flag";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import type { ExchangeView } from "@/lib/types";

export const dynamic = "force-dynamic";

async function loadExchange(token: string): Promise<ExchangeView | null> {
  const res = await apiFetch(
    `/api/exchange/${token}`,
    { cache: "no-store" },
    null,
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API ${res.status}`);
  return (await res.json()) as ExchangeView;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  let data: ExchangeView | null = null;
  try {
    data = await loadExchange(token);
  } catch {
    data = null;
  }

  const ownerLabel = data?.label?.trim() || "un coleccionista";
  const title = `Repetidas de ${ownerLabel} — Panini 2026`;
  const description =
    "Figuritas disponibles para intercambio del Mundial 2026";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: "es",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    robots: { index: false, follow: false },
  };
}

export default async function PublicExchangePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await loadExchange(token);
  if (!data) notFound();

  const ownerLabel = data.label?.trim() || "un coleccionista";

  const totalRepeated = data.repeated.reduce(
    (acc, g) => acc + g.stickers.reduce((a, s) => a + s.quantity, 0),
    0,
  );

  const contact = data.contactInfo?.trim() ?? "";
  const isLink = /^https?:\/\//i.test(contact);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 text-base md:p-8">
      <header className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-sm uppercase tracking-wide text-muted-foreground">
            Panini Tracker 2026
          </p>
          <h1 className="text-2xl font-bold leading-tight md:text-3xl">
            Figuritas repetidas de {ownerLabel}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="secondary"
            className="bg-amber-100 px-3 py-1 text-base text-amber-900 dark:bg-amber-900/30 dark:text-amber-100"
          >
            {totalRepeated} repetidas disponibles
          </Badge>
          <span className="text-sm text-muted-foreground">
            Actualizado el{" "}
            {new Date(data.updatedAt).toLocaleString("es", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </span>
        </div>

        {contact ? (
          <div className="pt-1">
            {isLink ? (
              <Button
                asChild
                size="lg"
                className="h-12 w-full text-base sm:w-auto"
              >
                <a href={contact} target="_blank" rel="noreferrer">
                  Contactar a {ownerLabel}
                </a>
              </Button>
            ) : (
              <p className="text-base">
                <span className="text-muted-foreground">Contacto: </span>
                <span className="font-medium">{contact}</span>
              </p>
            )}
          </div>
        ) : null}
      </header>

      {data.repeated.length === 0 ? (
        <section className="rounded-lg border border-dashed p-6 text-center">
          <h2 className="text-lg font-semibold">
            Todavía no hay figuritas disponibles para intercambio
          </h2>
          <p className="mt-2 text-base text-muted-foreground">
            {ownerLabel} todavía no acumuló repetidas. Volvé a entrar en unos
            días — el álbum se llena rápido.
          </p>
        </section>
      ) : (
        <section className="flex flex-col gap-4">
          {data.repeated.map((group) => {
            const groupTotal = group.stickers.reduce(
              (a, s) => a + s.quantity,
              0,
            );
            return (
              <Card key={group.teamId}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <Flag
                      code={group.teamFlag}
                      alt={group.teamName}
                      size={40}
                    />
                    <CardTitle className="flex-1 text-lg">
                      {group.teamName}
                    </CardTitle>
                    <Badge variant="secondary" className="text-sm">
                      {groupTotal}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="flex flex-col divide-y">
                    {group.stickers.map((s) => (
                      <li
                        key={s.id}
                        className="flex min-h-12 items-center justify-between gap-3 py-3"
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span className="w-9 shrink-0 text-sm text-muted-foreground tabular-nums">
                            #{s.position}
                          </span>
                          <span className="min-w-0 break-words text-base font-medium">
                            {s.playerName}
                          </span>
                        </span>
                        <Badge
                          variant="secondary"
                          className="shrink-0 bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100"
                        >
                          ×{s.quantity} disponibles
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </section>
      )}

      <footer className="border-t pt-4 text-center text-xs text-muted-foreground">
        Generado con Panini Tracker · Mundial 2026
      </footer>
    </main>
  );
}
