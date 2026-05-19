import { serverApiJson } from "@/lib/server-api";
import type { ConfederationGroup, SpecialSection } from "@/lib/types";

import { AlbumClient } from "./album-client";
import { SpecialSectionsClient } from "./special-sections-client";

export default async function AlbumPage() {
  const [groups, special] = await Promise.all([
    serverApiJson<ConfederationGroup[]>("/api/teams"),
    serverApiJson<SpecialSection[]>("/api/special-sections"),
  ]);
  const teams = groups.flatMap((g) => g.teams);
  const confederations = groups.map((g) => ({
    id: g.confederation,
    name: g.confName,
  }));
  return (
    <div className="flex flex-col gap-8">
      <SpecialSectionsClient sections={special} />
      <AlbumClient teams={teams} confederations={confederations} />
    </div>
  );
}
