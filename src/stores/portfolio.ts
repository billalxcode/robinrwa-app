import { GraphQLClient, gql } from "graphql-request";
import { create } from "zustand";
import { SUBGRAPH_URL } from "@/lib/subgraph";

// Per-owner portfolio cache + fetch actions. Owns the UserPortfolio GraphQL
// document so components never fetch it directly: one fetch per wallet per
// STALE_MS, shared across mounts. Only public on-chain reads — no keys.
// Dok: /pmndrs/zustand — async actions fetching remote data into the store.
const STALE_MS = 10_000;

export interface PositionRow {
  id: string;
  tokenId: string;
  manager: string;
  active: boolean;
  createdAt: string;
  burnedAt: string | null;
  index: { id: string };
}

export interface UserStatsFull {
  id: string;
  totalNetETH: string;
  totalNetUSDG: string;
  depositCount: string;
  filledLegs: string;
  skippedLegs: string;
  firstDepositAt: string;
  lastDepositAt: string;
}

export interface DepositEvent {
  net: string;
  tokenIn: string;
  indexId: string;
  epoch: string;
  tokenIds: string[];
  filledLegs: number;
  skippedLegs: number;
  blockTimestamp: string;
  transactionHash: string;
}

export interface RemoveEvent {
  tokenIds: string[];
  blockTimestamp: string;
  transactionHash: string;
}

interface PortfolioResponse {
  positions: PositionRow[];
  indexes: { id: string; name: string }[];
  userStats_collection: UserStatsFull[];
  liquidityAddeds: DepositEvent[];
  liquidityRemoveds: RemoveEvent[];
}

const PortfolioQuery = gql`
  query UserPortfolio($owner: Bytes!) {
    positions(
      first: 100
      orderBy: tokenId
      orderDirection: desc
      where: { owner: $owner }
    ) {
      id
      tokenId
      manager
      active
      createdAt
      burnedAt
      index {
        id
      }
    }
    indexes(first: 50) {
      id
      name
    }
    userStats_collection(where: { id: $owner }) {
      id
      totalNetETH
      totalNetUSDG
      depositCount
      filledLegs
      skippedLegs
      firstDepositAt
      lastDepositAt
    }
    liquidityAddeds(
      first: 20
      orderBy: blockTimestamp
      orderDirection: desc
      where: { user: $owner }
    ) {
      net
      tokenIn
      indexId
      epoch
      tokenIds
      filledLegs
      skippedLegs
      blockTimestamp
      transactionHash
    }
    liquidityRemoveds(
      first: 20
      orderBy: blockTimestamp
      orderDirection: desc
      where: { user: $owner }
    ) {
      tokenIds
      blockTimestamp
      transactionHash
    }
  }
`;

export interface PortfolioCache {
  rows: PositionRow[];
  names: Record<string, string>;
  deposited: { eth: string; usdg: string };
  stats: UserStatsFull | null;
  deposits: DepositEvent[];
  removals: RemoveEvent[];
  lastFetchedAt: number;
}

interface PortfolioState {
  byOwner: Record<string, PortfolioCache>;
  selectedTokenId: string | null;
  setPortfolio: (
    owner: string,
    cache: Omit<PortfolioCache, "lastFetchedAt">,
  ) => void;
  invalidate: (owner: string) => void;
  setSelected: (tokenId: string | null) => void;
  fetchPortfolio: (owner: string, force?: boolean) => Promise<void>;
}

const inflightByOwner = new Map<string, Promise<void>>();

export const usePortfolioStore = create<PortfolioState>()((set, get) => ({
  byOwner: {},
  selectedTokenId: null,
  setPortfolio: (owner, cache) =>
    set((s) => ({
      byOwner: {
        ...s.byOwner,
        [owner.toLowerCase()]: { ...cache, lastFetchedAt: Date.now() },
      },
    })),
  invalidate: (owner) =>
    set((s) => {
      const next = { ...s.byOwner };
      delete next[owner.toLowerCase()];
      return { byOwner: next };
    }),
  setSelected: (selectedTokenId) => set({ selectedTokenId }),
  fetchPortfolio: async (owner, force = false) => {
    const key = owner.toLowerCase();
    const pending = inflightByOwner.get(key);
    if (pending) return pending;
    if (!force && isPortfolioFresh(get().byOwner, owner)) return;
    if (!SUBGRAPH_URL) return;
    const job = (async () => {
      try {
        const client = new GraphQLClient(SUBGRAPH_URL);
        const data = await client.request<PortfolioResponse>(PortfolioQuery, {
          owner: key,
        });
        const userStats = data.userStats_collection[0] ?? null;
        get().setPortfolio(key, {
          rows: data.positions,
          names: Object.fromEntries(data.indexes.map((i) => [i.id, i.name])),
          deposited: userStats
            ? { eth: userStats.totalNetETH, usdg: userStats.totalNetUSDG }
            : { eth: "0", usdg: "0" },
          stats: userStats,
          deposits: data.liquidityAddeds,
          removals: data.liquidityRemoveds,
        });
      } catch {
        // Keep stale cache on transient failures.
      } finally {
        inflightByOwner.delete(key);
      }
    })();
    inflightByOwner.set(key, job);
    return job;
  },
}));

/** True when the cached entry exists and is fresher than STALE_MS. */
export function isPortfolioFresh(
  byOwner: Record<string, PortfolioCache>,
  owner: string,
): boolean {
  const entry = byOwner[owner.toLowerCase()];
  return !!entry && Date.now() - entry.lastFetchedAt < STALE_MS;
}
