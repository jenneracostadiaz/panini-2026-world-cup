import { serverApiJson } from "@/lib/server-api";
import type { ConfederationGroup } from "@/lib/types";

import { AlbumClient } from "./album-client";

export default async function AlbumPage() {
  const groups = await serverApiJson<ConfederationGroup[]>("/api/teams");
  const teams = groups.flatMap((g) => g.teams);
  const confederations = groups.map((g) => ({
    id: g.confederation,
    name: g.confName,
  }));
  return <AlbumClient teams={teams} confederations={confederations} />;
}
