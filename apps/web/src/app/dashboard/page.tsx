import Link from "next/link";

import { Flag } from "@/components/flag";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { serverApiJson } from "@/lib/server-api";
import type { ConfederationGroup, Summary } from "@/lib/types";

export default async function DashboardSummaryPage() {
  const [summary, groups] = await Promise.all([
    serverApiJson<Summary>("/api/collection/summary"),
    serverApiJson<ConfederationGroup[]>("/api/teams"),
  ]);

  const metrics = [
    {
      label: "Completado",
      value: `${summary.progressPct}%`,
      progress: summary.progressPct,
      hint: `${summary.owned} / ${summary.total}`,
    },
    {
      label: "Pegadas",
      value: summary.owned.toLocaleString("es"),
      hint: `de ${summary.total.toLocaleString("es")}`,
    },
    {
      label: "Faltan",
      value: summary.missing.toLocaleString("es"),
      hint: "para completar",
    },
    {
      label: "Repetidas",
      value: summary.repeated.toLocaleString("es"),
      hint: "para intercambiar",
    },
  ] as const;

  return (
    <div className="flex flex-col gap-8">
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardHeader className="pb-2">
              <CardDescription>{m.label}</CardDescription>
              <CardTitle className="text-3xl tabular-nums">{m.value}</CardTitle>
            </CardHeader>
            <CardContent>
              {"progress" in m ? (
                <Progress value={m.progress} />
              ) : (
                <p className="text-xs text-muted-foreground">{m.hint}</p>
              )}
              {"progress" in m ? (
                <p className="mt-2 text-xs text-muted-foreground">{m.hint}</p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Confederaciones</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {groups.map((group) => {
            const totals = group.teams.reduce(
              (acc, t) => ({
                owned: acc.owned + t.owned,
                total: acc.total + t.total,
              }),
              { owned: 0, total: 0 },
            );
            const pct =
              totals.total > 0
                ? Math.round((totals.owned / totals.total) * 100)
                : 0;
            const representative = group.teams[0];
            return (
              <Link
                key={group.confederation}
                href={`/dashboard/album?conf=${group.confederation}`}
                className="block focus:outline-none"
              >
                <Card className="h-full transition-colors hover:bg-accent">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {group.confName}
                      </CardTitle>
                      {representative ? (
                        <Flag
                          code={representative.flagCode}
                          alt={representative.name}
                          size={20}
                          className="!w-6"
                        />
                      ) : null}
                    </div>
                    <CardDescription>
                      {group.teams.length} selecciones
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end justify-between text-sm">
                      <span className="tabular-nums">
                        {totals.owned} / {totals.total}
                      </span>
                      <span className="text-muted-foreground tabular-nums">
                        {pct}%
                      </span>
                    </div>
                    <Progress value={pct} className="mt-2" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
