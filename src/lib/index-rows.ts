import { assetLabel, getAsset } from "@/lib/assets";
import { getMockIndex, mockIndexes } from "@/lib/mock";
import type { SubgraphIndex } from "@/lib/subgraph";

export interface IndexRow {
  id: string;
  name: string;
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
    tickers: idx.tokens.map((a) => assetLabel(getAsset(a))),
    topWeight: topShare(idx.tokens, weights),
    epoch: epoch ?? "—",
    status: idx.exists ? "Active" : "Inactive",
  }));
}

export function buildMockRows(): IndexRow[] {
  return mockIndexes.map((idx) => ({
    id: idx.id,
    name: idx.name,
    tickers: idx.constituents,
    topWeight: idx.topWeight,
    epoch: String(idx.epoch),
    status: idx.status,
  }));
}

export { getMockIndex };
