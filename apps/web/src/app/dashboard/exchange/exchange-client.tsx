"use client";

import { Check, Copy, ExternalLink, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import type { ExchangeToken, ExchangeView } from "@/lib/types";

export function ExchangeClient() {
  const { data: session } = useSession();
  const [label, setLabel] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [token, setToken] = useState<ExchangeToken | null>(null);
  const [view, setView] = useState<ExchangeView | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const publicUrl = useMemo(() => {
    if (!token) return null;
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL ?? "";
    return `${origin}/intercambio/${token.token}`;
  }, [token]);

  const refreshView = useCallback(
    async (tok: string) => {
      try {
        const res = await apiFetch(
          `/api/exchange/${tok}`,
          { cache: "no-store" },
          session,
        );
        if (!res.ok) throw new Error(`status ${res.status}`);
        setView((await res.json()) as ExchangeView);
      } catch (err) {
        console.error("[exchange] preview failed", err);
      }
    },
    [session],
  );

  useEffect(() => {
    if (token) refreshView(token.token);
  }, [token, refreshView]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await apiFetch(
        "/api/exchange/token",
        {
          method: "POST",
          body: JSON.stringify({
            label,
            contactInfo: contactInfo || undefined,
          }),
        },
        session,
      );
      if (!res.ok) throw new Error(`status ${res.status}`);
      setToken((await res.json()) as ExchangeToken);
      toast.success("Configuración guardada");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(message);
      toast.error("Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  }

  async function copyLink() {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast.success("Link copiado al portapapeles");
    setTimeout(() => setCopied(false), 1500);
  }

  const repeatedTotal =
    view?.repeated.reduce(
      (acc, g) => acc + g.stickers.reduce((a, s) => a + s.quantity, 0),
      0,
    ) ?? 0;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Configurar intercambio</CardTitle>
          <CardDescription>
            Generá un link público para que tus amigos vean tus repetidas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="label">Nombre para mostrar</Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Juan Pérez"
                required
                minLength={1}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contact">Info de contacto (opcional)</Label>
              <Input
                id="contact"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="https://wa.me/549..."
              />
            </div>
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <Button type="submit" disabled={saving || !label}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Guardar link
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tu link público</CardTitle>
          <CardDescription>
            {publicUrl
              ? "Compartilo con quien quieras intercambiar."
              : "Guardá el formulario para generar el link."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {publicUrl ? (
            <>
              <div className="flex items-center gap-2">
                <Input value={publicUrl} readOnly className="font-mono text-xs" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copyLink}
                  aria-label="Copiar link"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  asChild
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Abrir como mis amigos"
                >
                  <a href={publicUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                <p className="mb-2 font-medium">
                  {repeatedTotal} figuritas para intercambiar
                </p>
                {view && view.repeated.length > 0 ? (
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {view.repeated.slice(0, 5).map((g) => (
                      <li key={g.teamId}>
                        {g.teamName}:{" "}
                        {g.stickers.reduce((a, s) => a + s.quantity, 0)} repetidas
                      </li>
                    ))}
                    {view.repeated.length > 5 ? (
                      <li>… y {view.repeated.length - 5} equipos más</li>
                    ) : null}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Todavía no tenés repetidas.
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Acá vas a ver tu link público después de guardar.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
