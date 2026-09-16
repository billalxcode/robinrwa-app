import { GraphQLClient, gql } from "graphql-request";
import { create } from "zustand";
import {
  getIndexDetailLive,
  getIndexesLive,
  getIndexVolume,
  getOracleStatus,
  gqlSignal,
  type IndexDayPoint,
  type LiveIndexDetail,
  type LiveIndexList,
  type OracleStatus,
  SUBGRAPH_URL,
} from "@/lib/subgraph";

// Owner-independent market data shared by all pages/components.
// Replaces duplicated Promise.all([getIndexesLive(), getOracleStatus()])
// in landing, indexes, detail, and oracle routes, plus the per-component
// RecentTransactions query. Single-flight + stale-while-revalidate so
// mounts never refetch within the TTL.
// Dok: /pmndrs/zustand — async actions fetching remote data into the store.
export type MarketStatus = "idle" | "loading" | "live" | "unavailable";

const STALE_MS = 30_000;
const RECENT_STALE_MS = 10_000;

export interface RecentTx {
  user: string;
  epoch: string;
  tokenIn: string;
  net: string;
  tokenIds: string[];
  filledLegs: number;
  skippedLegs: number;
  blockTimestamp: string;
  transactionHash: string;
}

interface RecentTxResponse {
  liquidityAddeds: RecentTx[];
}

const RecentTxQuery = gql`
  query RecentDeposits($indexId: BigInt!, $first: Int!) {
    liquidityAddeds(
      first: $first
      orderBy: blockTimestamp
      orderDirection: desc
      where: { indexId: $indexId }
    ) {
      user
      epoch
      tokenIn
      net
      tokenIds
      filledLegs
      skippedLegs
      blockTimestamp
      transactionHash
    }
  }
`;

interface MarketState {
  indexes: LiveIndexList | null;
  oracle: OracleStatus | null;
  weights: Map<string, number>;
  epoch: string | null;
  status: MarketStatus;
  lastUpdatedAt: number | null;
  recentByIndex: Record<string, { rows: RecentTx[]; lastFetchedAt: number }>;
  detailById: Record<string, LiveIndexDetail>;
  volumeById: Record<string, IndexDayPoint[]>;
  refresh: (force?: boolean) => Promise<void>;
  hydrate: (data: {
    indexes: LiveIndexList | null;
    oracle: OracleStatus | null;
  }) => void;
  fetchRecent: (indexId: string, force?: boolean) => Promise<void>;
  fetchDetail: (id: string, force?: boolean) => Promise<void>;
  fetchVolume: (id: string, force?: boolean) => Promise<void>;
}

let inflight: Promise<void> | null = null;
const recentInflight = new Map<string, Promise<void>>();
const detailInflight = new Map<string, Promise<void>>();
const volumeInflight = new Map<string, Promise<void>>();

function toWeights(oracle: OracleStatus | null): Map<string, number> {
  return new Map(
    (oracle?.tokens ?? []).map((t) => [t.id.toLowerCase(), t.weightBps]),
  );
}

export const useMarketStore = create<MarketState>()((set, get) => ({
  indexes: null,
  oracle: null,
  weights: new Map(),
  epoch: null,
  status: "idle",
  lastUpdatedAt: null,
  recentByIndex: {},
  detailById: {},
  volumeById: {},
  refresh: async (force = false) => {
    const { status, lastUpdatedAt } = get();
    if (inflight) return inflight;
    if (
      !force &&
      status === "live" &&
      lastUpdatedAt !== null &&
      Date.now() - lastUpdatedAt < STALE_MS
    ) {
      return;
    }
    set({ status: "loading" });
    inflight = (async () => {
      try {
        const [indexes, oracle] = await Promise.all([
          getIndexesLive(),
          getOracleStatus(),
        ]);
        set({
          indexes,
          oracle,
          weights: toWeights(oracle),
          epoch: oracle?.stats.epoch ?? null,
          status: indexes !== null && oracle !== null ? "live" : "unavailable",
          lastUpdatedAt: Date.now(),
        });
      } catch {
        set({ status: "unavailable" });
      } finally {
        inflight = null;
      }
    })();
    return inflight;
  },
  // Seed from server-fetched data. Never wipes existing live data with
  // nulls (e.g. oracle page only provides oracle) and never downgrades
  // a live store on a failed SSR fetch.
  hydrate: ({ indexes, oracle }) =>
    set((s) => {
      const nextIndexes = indexes ?? s.indexes;
      const nextOracle = oracle ?? s.oracle;
      const live = nextIndexes !== null && nextOracle !== null;
      return {
        indexes: nextIndexes,
        oracle: nextOracle,
        weights: toWeights(nextOracle),
        epoch: nextOracle?.stats.epoch ?? null,
        status: live ? "live" : s.status === "live" ? "live" : "unavailable",
        lastUpdatedAt: Date.now(),
      };
    }),
  fetchRecent: async (indexId, force = false) => {
    const pending = recentInflight.get(indexId);
    if (pending) return pending;
    if (!force) {
      const entry = get().recentByIndex[indexId];
      if (entry && Date.now() - entry.lastFetchedAt < RECENT_STALE_MS) return;
    }
    if (!SUBGRAPH_URL) return;
    const job = (async () => {
      try {
        const client = new GraphQLClient(SUBGRAPH_URL);
        const data = await client.request<RecentTxResponse>({
          document: RecentTxQuery,
          variables: {
            indexId,
            first: 10,
          },
          signal: gqlSignal(),
        });
        set((s) => ({
          recentByIndex: {
            ...s.recentByIndex,
            [indexId]: {
              rows: data.liquidityAddeds,
              lastFetchedAt: Date.now(),
            },
          },
        }));
      } catch {
        // Keep stale rows on transient failures.
      } finally {
        recentInflight.delete(indexId);
      }
    })();
    recentInflight.set(indexId, job);
    return job;
  },
  fetchDetail: async (id, force = false) => {
    const pending = detailInflight.get(id);
    if (pending) return pending;
    if (!force && get().detailById[id]) return;
    const job = (async () => {
      try {
        const detail = await getIndexDetailLive(id);
        if (detail) {
          set((s) => ({ detailById: { ...s.detailById, [id]: detail } }));
        }
      } catch {
        // Leave cache empty; callers fall back to server data.
      } finally {
        detailInflight.delete(id);
      }
    })();
    detailInflight.set(id, job);
    return job;
  },
  fetchVolume: async (id, force = false) => {
    const pending = volumeInflight.get(id);
    if (pending) return pending;
    if (!force && get().volumeById[id]) return;
    const job = (async () => {
      try {
        const points = await getIndexVolume(id);
        if (points) {
          set((s) => ({ volumeById: { ...s.volumeById, [id]: points } }));
        }
      } catch {
        // Leave cache empty; callers fall back to server data.
      } finally {
        volumeInflight.delete(id);
      }
    })();
    volumeInflight.set(id, job);
    return job;
  },
}));
