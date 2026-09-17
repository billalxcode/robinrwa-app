import { assetLabel, getAsset } from "@/lib/assets";
import type { SubgraphIndex } from "@/lib/subgraph";

// Indexes hidden across the whole frontend: not listed, not openable,
// not depositable. Compare as strings (subgraph ids arrive as strings,
// route params too).
export const BLACKLISTED_INDEX_IDS: ReadonlySet<string> = new Set(["0"]);

export function isIndexHidden(id: string | number | bigint): boolean {
  return BLACKLISTED_INDEX_IDS.has(String(id));
}

export interface IndexRow {
  id: string;
  name: string;
  imageCID: string;
  tickers: string[];
  topWeight: string;
  epoch: string;
  status: "Active" | "Inactive";
}

export function weightMap(
  tokens: { id: string; weightBps: number }[],
): Map<string, number> {
  return new Map(tokens.map((t) => [t.id.toLowerCase(), t.weightBps]));
}

function topShare(addresses: string[], weights: Map<string, number>): string {
  let top = 0;
  for (const a of addresses) {
    const w = weights.get(a.toLowerCase()) ?? 0;
    if (w > top) top = w;
  }
  return `${(top / 100).toFixed(1)}%`;
}

export function buildLiveRows(
  indexes: SubgraphIndex[],
  weights: Map<string, number>,
  epoch: string | null,
): IndexRow[] {
  return indexes.map((idx) => ({
    id: idx.id,
    name: idx.name,
    imageCID: idx.imageCID ?? "",
    tickers: idx.tokens.map((a) => assetLabel(getAsset(a))),
    topWeight: topShare(idx.tokens, weights),
    epoch: epoch ?? "—",
    status: idx.exists ? "Active" : "Inactive",
  }));
}
