"use client";

import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { apiFetch } from "@/lib/api";
import type {
  SpecialSection,
  SpecialSectionId,
  SpecialSectionSticker,
} from "@/lib/types";
import { usePressActions } from "@/lib/use-press-actions";
import { cn } from "@/lib/utils";

const MUSEUM_YEARS = [
  1930, 1934, 1938, 1950, 1954, 1958, 1962, 1966, 1970, 1974, 1978, 1982, 1986,
  1990, 1994, 1998, 2002, 2006, 2010, 2014, 2018, 2022,
];

function stickerLabel(
  sectionId: SpecialSectionId,
  sticker: SpecialSectionSticker,
): string {
  if (sectionId === "museum") {
    return String(MUSEUM_YEARS[sticker.position - 1] ?? sticker.position);
  }
  if (sectionId === "intro") {
    return sticker.id === "00" ? "00" : `FWC-${sticker.position}`;
  }
  return `CC-${sticker.position}`;
}

export function SpecialSectionsClient({
  sections,
}: {
  sections: SpecialSection[];
}) {
  const { data: session } = useSession();
  const [state, setState] = useState(() => mapSections(sections));
  const [busyId, setBusyId] = useState<string | null>(null);
  const [open, setOpen] = useState<Record<SpecialSectionId, boolean>>({
    intro: true,
    museum: false,
    cocacola: false,
  });

  const patchSticker = useCallback(
    async (
      sectionId: SpecialSectionId,
      sticker: SpecialSectionSticker,
      status: "owned" | "missing",
      quantity: number,
    ) => {
      const prevSection = state[sectionId];
      if (!prevSection) return;
      const nextStickers = prevSection.stickers.map((s) =>
        s.id === sticker.id ? { ...s, status, quantity } : s,
      );
      setBusyId(sticker.id);
      setState({
        ...state,
        [sectionId]: { ...prevSection, stickers: nextStickers },
      });

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
      } catch (err) {
        console.error("[special-sections] patch failed", err);
        toast.error("Error al guardar, reintentando...");
        setState({ ...state, [sectionId]: prevSection });
      } finally {
        setBusyId(null);
      }
    },
    [state, session],
  );

  const cycleUp = (sectionId: SpecialSectionId, s: SpecialSectionSticker) => {
    if (s.status === "missing") return patchSticker(sectionId, s, "owned", 1);
    return patchSticker(sectionId, s, "owned", s.quantity + 1);
  };

  const cycleDown = (sectionId: SpecialSectionId, s: SpecialSectionSticker) => {
    if (s.status === "missing") return;
    if (s.quantity > 1) return patchSticker(sectionId, s, "owned", s.quantity - 1);
    return patchSticker(sectionId, s, "missing", 0);
  };

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-amber-500" />
        <h2 className="text-lg font-semibold">Secciones especiales</h2>
      </header>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {sections.map((section) => {
          const live = state[section.id] ?? section;
          const totals = computeTotals(live);
          const isOpen = open[section.id];
          return (
            <Card key={section.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{section.name}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setOpen((prev) => ({ ...prev, [section.id]: !prev[section.id] }))
                    }
                    aria-label={isOpen ? "Colapsar" : "Expandir"}
                  >
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm tabular-nums">
                  <span>
                    {totals.owned} / {totals.total}
                  </span>
                  <span className="text-muted-foreground">
                    {totals.progressPct}%
                  </span>
                </div>
                <Progress value={totals.progressPct} className="mt-1" />
              </CardHeader>
              {isOpen ? (
                <CardContent>
                  <div
                    className={cn(
                      "grid gap-2",
                      section.id === "intro"
                        ? "grid-cols-3 sm:grid-cols-4 lg:grid-cols-5"
                        : section.id === "museum"
                          ? "grid-cols-3 sm:grid-cols-4 lg:grid-cols-6"
                          : "grid-cols-3 sm:grid-cols-4 lg:grid-cols-5",
                    )}
                  >
                    {live.stickers.map((s) => (
                      <SpecialStickerButton
                        key={s.id}
                        sectionId={section.id}
                        sticker={s}
                        busy={busyId === s.id}
                        onLeftClick={() => cycleUp(section.id, s)}
                        onRightClick={() => cycleDown(section.id, s)}
                      />
                    ))}
                  </div>
                  <p className="mt-3 text-[11px] text-muted-foreground">
                    Tap para sumar · Mantené apretado para quitar
                  </p>
                </CardContent>
              ) : null}
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function SpecialStickerButton({
  sectionId,
  sticker,
  busy,
  onLeftClick,
  onRightClick,
}: {
  sectionId: SpecialSectionId;
  sticker: SpecialSectionSticker;
  busy: boolean;
  onLeftClick: () => void;
  onRightClick: () => void;
}) {
  const repeats = sticker.quantity > 1 ? sticker.quantity - 1 : 0;
  const owned = sticker.status === "owned";
  const isRepeated = owned && repeats > 0;
  const label = stickerLabel(sectionId, sticker);
  const press = usePressActions({
    onPress: onLeftClick,
    onLongPress: onRightClick,
    disabled: busy,
  });

  return (
    <button
      type="button"
      {...press}
      disabled={busy}
      className={cn(
        "relative aspect-[4/5] w-full select-none touch-none overflow-hidden rounded-md border p-2 text-left transition-colors disabled:opacity-60",
        "[-webkit-touch-callout:none]",
        !owned &&
          "border-border bg-muted/40 text-muted-foreground hover:bg-muted",
        owned &&
          !isRepeated &&
          "border-emerald-500 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-100",
        isRepeated &&
          "border-amber-500 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-100",
        sticker.isFoil &&
          "ring-1 ring-amber-400/70 ring-inset dark:ring-amber-300/70",
        sticker.id === "00" &&
          "ring-2 ring-fuchsia-400/80 ring-inset dark:ring-fuchsia-300/80",
      )}
      title={sticker.playerName}
    >
      <div className="flex h-full flex-col justify-between gap-1">
        <span className="text-xs font-bold leading-none">{label}</span>
        <span className="line-clamp-2 text-[10px] leading-tight">
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

function computeTotals(section: SpecialSection) {
  const total = section.stickers.length;
  const owned = section.stickers.filter((s) => s.status === "owned").length;
  const progressPct = total > 0 ? Math.round((owned / total) * 100) : 0;
  return { total, owned, progressPct };
}

function mapSections(
  list: SpecialSection[],
): Record<SpecialSectionId, SpecialSection> {
  return list.reduce(
    (acc, s) => {
      acc[s.id] = s;
      return acc;
    },
    {} as Record<SpecialSectionId, SpecialSection>,
  );
}
