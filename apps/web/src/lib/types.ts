export type Summary = {
  total: number;
  owned: number;
  missing: number;
  repeated: number;
  progressPct: number;
};

export type TeamRow = {
  id: string;
  name: string;
  code: string;
  flagCode: string;
  color: string;
  confederation: string;
  confName: string;
  total: number;
  owned: number;
  missing: number;
  repeated: number;
  progressPct: number;
};

export type ConfederationGroup = {
  confederation: string;
  confName: string;
  teams: TeamRow[];
};

export type StickerRow = {
  id: string;
  playerName: string;
  position: number;
  isFoil: boolean;
  section: string;
  status: "owned" | "missing";
  quantity: number;
};

export type TeamDetail = TeamRow & {
  stickers: StickerRow[];
};

export type ExchangeToken = {
  token: string;
  label: string | null;
  contactInfo: string | null;
};

export type ExchangeView = {
  label: string | null;
  contactInfo: string | null;
  updatedAt: string;
  repeated: Array<{
    teamId: string;
    teamName: string;
    teamFlag: string;
    stickers: Array<{
      id: string;
      playerName: string;
      position: number;
      quantity: number;
    }>;
  }>;
};
