import { Flag } from "@/components/flag";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { serverApiJson } from "@/lib/server-api";
import type { ConfederationGroup, TeamDetail } from "@/lib/types";

export default async function RepeatedPage() {
  const groups = await serverApiJson<ConfederationGroup[]>("/api/teams");
  const teamRows = groups.flatMap((g) => g.teams);
  const teamIdsWithRepeats = teamRows
    .filter((t) => t.repeated > 0)
    .map((t) => t.id);

  const details = await Promise.all(
    teamIdsWithRepeats.map((id) =>
      serverApiJson<TeamDetail>(`/api/teams/${id}`),
    ),
  );

  const sections = groups
    .map((group) => {
      const teams = group.teams
        .map((t) => {
          const detail = details.find((d) => d.id === t.id);
          if (!detail) return null;
          const repeated = detail.stickers
            .filter((s) => s.quantity > 1)
            .map((s) => ({
              id: s.id,
              playerName: s.playerName,
              position: s.position,
              extra: s.quantity - 1,
            }));
          if (repeated.length === 0) return null;
          return {
            id: t.id,
            name: t.name,
            code: t.code,
            flagCode: t.flagCode,
            stickers: repeated,
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null);
      if (teams.length === 0) return null;
      return { confederation: group.confederation, confName: group.confName, teams };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const totalRepeated = details.reduce(
    (acc, d) =>
      acc +
      d.stickers.reduce(
        (a, s) => a + (s.quantity > 1 ? s.quantity - 1 : 0),
        0,
      ),
    0,
  );

  if (sections.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <h2 className="text-lg font-semibold">Sin repetidas todavía</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Cuando marques una figurita como repetida desde Mi colección,
          aparecerá acá lista para intercambiar.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Repetidas</h2>
          <p className="text-sm text-muted-foreground">
            Figuritas que tenés de más para intercambiar.
          </p>
        </div>
        <Badge variant="secondary" className="text-base tabular-nums">
          {totalRepeated} total
        </Badge>
      </header>

      <div className="flex flex-col gap-6">
        {sections.map((section) => (
          <section key={section.confederation} className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-muted-foreground">
              {section.confName}
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {section.teams.map((team) => (
                <Card key={team.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <Flag code={team.flagCode} alt={team.name} size={40} />
                      <div className="flex-1">
                        <CardTitle className="text-base">{team.name}</CardTitle>
                        <CardDescription>{team.code}</CardDescription>
                      </div>
                      <Badge variant="secondary">
                        {team.stickers.reduce((a, s) => a + s.extra, 0)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="flex flex-col divide-y">
                      {team.stickers.map((s) => (
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
                            +{s.extra}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
