"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";

import { Flag } from "@/components/flag";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import type { TeamRow } from "@/lib/types";
import { cn } from "@/lib/utils";

import { TeamSheet } from "./team-sheet";

type Status = "todas" | "completas" | "incompletas";

export function AlbumClient({
  teams,
  confederations,
}: {
  teams: TeamRow[];
  confederations: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const conf = params.get("conf") ?? "todas";
  const status = (params.get("status") ?? "todas") as Status;
  const q = params.get("q") ?? "";

  const [openTeamId, setOpenTeamId] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const dirtyRef = useRef(false);

  const markDirty = useCallback(() => {
    dirtyRef.current = true;
  }, []);

  const visible = useMemo(() => {
    const lower = q.trim().toLowerCase();
    return teams
      .filter((t) => {
        if (conf !== "todas" && t.confederation !== conf) return false;
        if (status === "completas" && t.progressPct !== 100) return false;
        if (status === "incompletas" && t.progressPct === 100) return false;
        if (lower && !t.name.toLowerCase().includes(lower)) return false;
        return true;
      });
  }, [teams, conf, status, q]);

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (!value || value === "todas" || value === "") next.delete(key);
    else next.set(key, value);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Confederación:
          </span>
          <FilterChip
            active={conf === "todas"}
            onClick={() => setParam("conf", null)}
          >
            Todas
          </FilterChip>
          {confederations.map((c) => (
            <FilterChip
              key={c.id}
              active={conf === c.id}
              onClick={() => setParam("conf", c.id)}
            >
              {c.name}
            </FilterChip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Estado:
          </span>
          {(["todas", "completas", "incompletas"] as Status[]).map((s) => (
            <FilterChip
              key={s}
              active={status === s}
              onClick={() => setParam("status", s)}
            >
              {s === "todas"
                ? "Todas"
                : s === "completas"
                  ? "Completas"
                  : "Incompletas"}
            </FilterChip>
          ))}
        </div>
        <div className="relative max-w-sm">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar selección…"
            value={q}
            onChange={(e) => setParam("q", e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay selecciones que coincidan con los filtros.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {visible.map((t) => (
            <TeamCard
              key={t.id}
              team={t}
              onClick={() => setOpenTeamId(t.id)}
            />
          ))}
        </div>
      )}

      <TeamSheet
        teamId={openTeamId}
        revision={revision}
        onMutated={markDirty}
        onOpenChange={(open) => {
          if (!open) {
            setOpenTeamId(null);
            setRevision((r) => r + 1);
            if (dirtyRef.current) {
              dirtyRef.current = false;
              router.refresh();
            }
          }
        }}
      />
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      size="sm"
      onClick={onClick}
      className="h-7 rounded-full px-3 text-xs"
    >
      {children}
    </Button>
  );
}

function TeamCard({
  team,
  onClick,
}: {
  team: TeamRow;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="text-left">
      <Card
        className={cn(
          "h-full overflow-hidden border-l-4 transition-colors hover:bg-accent",
        )}
        style={{ borderLeftColor: team.color }}
      >
        <CardContent className="flex flex-col gap-2 p-4">
          <div className="flex items-center justify-between gap-2">
            <Flag code={team.flagCode} alt={team.name} size={40} />
            {team.repeated > 0 ? (
              <Badge
                variant="secondary"
                className="bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100"
              >
                +{team.repeated}
              </Badge>
            ) : null}
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-sm font-semibold">{team.name}</span>
            <span className="text-xs text-muted-foreground">{team.code}</span>
          </div>
          <div className="flex items-center justify-between text-xs tabular-nums">
            <span>
              {team.owned} / {team.total}
            </span>
            <span className="text-muted-foreground">{team.progressPct}%</span>
          </div>
          <Progress value={team.progressPct} />
        </CardContent>
      </Card>
    </button>
  );
}
