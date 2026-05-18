"use client";

import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Flag } from "@/components/flag";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { apiFetch } from "@/lib/api";
import type { StickerRow, TeamDetail } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TeamSheet({
  teamId,
  revision,
  onOpenChange,
  onMutated,
}: {
  teamId: string | null;
  revision: number;
  onOpenChange: (open: boolean) => void;
  onMutated: () => void;
}) {
  const { data: session } = useSession();
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId) {
      setTeam(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    apiFetch(`/api/teams/${teamId}`, { cache: "no-store" }, session)
      .then(async (res) => {
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = (await res.json()) as TeamDetail;
        if (!cancelled) setTeam(data);
      })
      .catch((err) => {
        console.error("[team-sheet] fetch failed", err);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [teamId, session, revision]);

  const totals = useMemo(() => {
    if (!team) return null;
    const total = team.stickers.length;
    const owned = team.stickers.filter((s) => s.status === "owned").length;
    const repeated = team.stickers.reduce(
      (acc, s) => acc + (s.quantity > 1 ? s.quantity - 1 : 0),
      0,
    );
    const progressPct = total > 0 ? Math.round((owned / total) * 100) : 0;
    return { total, owned, repeated, progressPct };
  }, [team]);

  const patchSticker = useCallback(
    async (sticker: StickerRow, status: "owned" | "missing", quantity: number) => {
      if (!team) return;
      const prev = team.stickers;
      const next: StickerRow[] = prev.map((s) =>
        s.id === sticker.id ? { ...s, status, quantity } : s,
      );
      setBusyId(sticker.id);
      setTeam({ ...team, stickers: next });
      try {
        const res = await apiFetch(
          `/api/stickers/${sticker.id}`,
          {
            method: "PATCH",
            body: JSON.stringify({ status, quantity }),
          },
          session,
        );
        if (!res.ok) throw new Error(`status ${res.status}`);
        onMutated();
      } catch (err) {
        console.error("[team-sheet] patch failed", err);
        setTeam({ ...team, stickers: prev });
      } finally {
        setBusyId(null);
      }
    },
    [team, session, onMutated],
  );

  const cycleUp = useCallback(
    (s: StickerRow) => {
      if (s.status === "missing") return patchSticker(s, "owned", 1);
      return patchSticker(s, "owned", s.quantity + 1);
    },
    [patchSticker],
  );

  const cycleDown = useCallback(
    (s: StickerRow) => {
      if (s.status === "missing") return;
      if (s.quantity > 1) return patchSticker(s, "owned", s.quantity - 1);
      return patchSticker(s, "missing", 0);
    },
    [patchSticker],
  );

  const bulk = useCallback(
    async (status: "owned" | "missing") => {
      if (!team) return;
      const prev = team.stickers;
      const next: StickerRow[] = prev.map((s) =>
        status === "owned"
          ? { ...s, status, quantity: Math.max(s.quantity, 1) }
          : { ...s, status, quantity: 0 },
      );
      setTeam({ ...team, stickers: next });
      try {
        const res = await apiFetch(
          `/api/teams/${team.id}/stickers/bulk`,
          {
            method: "PATCH",
            body: JSON.stringify({ status }),
          },
          session,
        );
        if (!res.ok) throw new Error(`status ${res.status}`);
        onMutated();
      } catch (err) {
        console.error("[team-sheet] bulk failed", err);
        setTeam({ ...team, stickers: prev });
      }
    },
    [team, session, onMutated],
  );

  return (
    <Sheet
      open={!!teamId}
      onOpenChange={(open) => onOpenChange(open)}
    >
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>
            {team ? (
              <div className="flex items-center gap-3">
                <Flag code={team.flagCode} alt={team.name} size={40} />
                <span>{team.name}</span>
                <span className="text-sm text-muted-foreground">
                  {team.code}
                </span>
              </div>
            ) : (
              "Cargando…"
            )}
          </SheetTitle>
          <SheetDescription>
            {totals
              ? `${totals.owned} / ${totals.total} pegadas · ${totals.progressPct}% · ${totals.repeated} repetidas`
              : null}
          </SheetDescription>
        </SheetHeader>

        {totals ? (
          <div className="mt-4">
            <Progress value={totals.progressPct} />
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="default"
            onClick={() => bulk("owned")}
            disabled={!team}
          >
            Marcar todas
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => bulk("missing")}
            disabled={!team}
          >
            Limpiar equipo
          </Button>
        </div>

        <div className="mt-6">
          {loading && !team ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando figuritas…
            </div>
          ) : team ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {team.stickers.map((s) => (
                <StickerButton
                  key={s.id}
                  sticker={s}
                  busy={busyId === s.id}
                  onLeftClick={() => cycleUp(s)}
                  onRightClick={() => cycleDown(s)}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin datos</p>
          )}
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Click: marcar / agregar repetida · Click derecho: quitar
        </p>
      </SheetContent>
    </Sheet>
  );
}

function StickerButton({
  sticker,
  busy,
  onLeftClick,
  onRightClick,
}: {
  sticker: StickerRow;
  busy: boolean;
  onLeftClick: () => void;
  onRightClick: () => void;
}) {
  const repeats = sticker.quantity > 1 ? sticker.quantity - 1 : 0;
  const owned = sticker.status === "owned";
  const isRepeated = owned && repeats > 0;

  return (
    <button
      type="button"
      onClick={onLeftClick}
      onContextMenu={(e) => {
        e.preventDefault();
        onRightClick();
      }}
      disabled={busy}
      className={cn(
        "relative aspect-square w-full rounded-md border p-1 text-left transition-colors disabled:opacity-60",
        !owned &&
          "border-border bg-muted/40 text-muted-foreground hover:bg-muted",
        owned &&
          !isRepeated &&
          "border-emerald-500 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-100",
        isRepeated &&
          "border-amber-500 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-100",
      )}
      title={sticker.playerName}
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-bold">#{sticker.position}</span>
        <span className="truncate text-[10px] leading-tight">
          {sticker.playerName}
        </span>
      </div>
      {isRepeated ? (
        <Badge
          variant="secondary"
          className="absolute right-1 top-1 h-4 min-w-4 justify-center bg-amber-500 px-1 text-[10px] text-white"
        >
          +{repeats}
        </Badge>
      ) : null}
    </button>
  );
}
