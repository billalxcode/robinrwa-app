import { GraphQLClient, gql } from "graphql-request";

// Subgraph endpoint (The Graph). Empty/unreachable → callers fall back
// to mock data. Dok: /graphprotocol/docs — querying from an application.
export const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL ?? "";

function getClient(): GraphQLClient | null {
  if (!SUBGRAPH_URL) return null;
  return new GraphQLClient(SUBGRAPH_URL);
}

export interface SubgraphTokenCurrent {
  id: string;
  weightBps: number;
  rank: number;
  firstEpoch: string;
  lastEpoch: string;
  updateCount: number;
}

export interface SubgraphOracleStats {
  id: string;
  epoch: string;
  lastUpdateAt: string;
  pushCount: number;
  knownTokenCount: number;
  tokens: string[];
}

interface OracleStatusResponse {
  oracleStats_collection: SubgraphOracleStats[];
  tokenCurrents: SubgraphTokenCurrent[];
}

const OracleStatusQuery = gql`
  query OracleStatus {
    oracleStats_collection(first: 1) {
      id
      epoch
      lastUpdateAt
      pushCount
      knownTokenCount
      tokens
    }
    tokenCurrents(first: 100, orderBy: weightBps, orderDirection: desc) {
      id
      weightBps
      rank
      firstEpoch
      lastEpoch
      updateCount
    }
  }
`;

export interface OracleStatus {
  stats: SubgraphOracleStats;
  tokens: SubgraphTokenCurrent[];
}

// Returns null when the endpoint is unset or unreachable — caller shows mock.
export async function getOracleStatus(): Promise<OracleStatus | null> {
  const client = getClient();
  if (!client) return null;
  try {
    const data = await client.request<OracleStatusResponse>(OracleStatusQuery);
    const stats = data.oracleStats_collection[0];
    if (!stats) return null;
    return { stats, tokens: data.tokenCurrents };
  } catch {
    return null;
  }
}

export function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function hoursSince(unixSeconds: string): string {
  const secs = Number(unixSeconds);
  if (!Number.isFinite(secs) || secs <= 0) return "—";
  const hours = Math.floor((Date.now() / 1000 - secs) / 3600);
  if (hours < 1) return "<1h ago";
  return `${hours}h ago`;
}

export function formatDate(unixSeconds: string): string {
  const secs = Number(unixSeconds);
  if (!Number.isFinite(secs) || secs <= 0) return "—";
  return new Date(secs * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------- Live index data ----------

export interface SubgraphIndex {
  id: string;
  name: string;
  symbol: string;
  exists: boolean;
  legCount: number;
  tokens: string[];
  createdAt: string;
}

export interface SubgraphLeg {
  legIndex: number;
  token: string;
  quote: string;
  fee: number;
  tickSpacing: number;
}

export interface SubgraphDeposit {
  user: string;
  indexId: string;
  epoch: string;
  net: string;
  tokenIds: string[];
  transactionHash: string;
  blockTimestamp: string;
}

const IndexesQuery = gql`
  query Indexes {
    indexes(first: 50, orderBy: createdAt, orderDirection: desc) {
      id
      name
      symbol
      exists
      legCount
      tokens
      createdAt
    }
    factoryStats_collection(first: 1) {
      totalCreated
      totalActive
    }
  }
`;

interface IndexesResponse {
  indexes: SubgraphIndex[];
  factoryStats_collection: { totalCreated: number; totalActive: number }[];
}

export interface LiveIndexList {
  indexes: SubgraphIndex[];
  totalCreated: number;
  totalActive: number;
}

export async function getIndexesLive(): Promise<LiveIndexList | null> {
  const client = getClient();
  if (!client) return null;
  try {
    const data = await client.request<IndexesResponse>(IndexesQuery);
    const stats = data.factoryStats_collection[0];
    return {
      indexes: data.indexes,
      totalCreated: stats?.totalCreated ?? data.indexes.length,
      totalActive: stats?.totalActive ?? data.indexes.length,
    };
  } catch {
    return null;
  }
}

const IndexDetailQuery = gql`
  query IndexDetail($id: ID!) {
    index(id: $id) {
      id
      name
      symbol
      exists
      legCount
      tokens
      createdAt
    }
    indexLegs(
      first: 50
      orderBy: legIndex
      orderDirection: asc
      where: { index: $id }
    ) {
      id
      legIndex
      token
      quote
      fee
      tickSpacing
    }
    liquidityAddeds(
      first: 100
      orderBy: blockTimestamp
      orderDirection: desc
      where: { indexId: $indexId }
    ) {
      user
      indexId
      epoch
      net
      tokenIds
      transactionHash
      blockTimestamp
    }
  }
`;

interface IndexDetailResponse {
  index: SubgraphIndex | null;
  indexLegs: (SubgraphLeg & { id: string })[];
  liquidityAddeds: SubgraphDeposit[];
}

export interface LiveIndexDetail {
  index: SubgraphIndex;
  legs: SubgraphLeg[];
  deposits: SubgraphDeposit[];
}

export async function getIndexDetailLive(
  id: string,
): Promise<LiveIndexDetail | null> {
  const client = getClient();
  if (!client) return null;
  try {
    const data = await client.request<IndexDetailResponse>(IndexDetailQuery, {
      id,
      indexId: id,
    });
    if (!data.index) return null;
    return {
      index: data.index,
      legs: data.indexLegs,
      deposits: data.liquidityAddeds,
    };
  } catch {
    return null;
  }
}

const OverviewQuery = gql`
  query Overview {
    factoryStats_collection(first: 1) {
      totalCreated
      totalActive
    }
  }
`;

interface OverviewResponse {
  factoryStats_collection: { totalCreated: number; totalActive: number }[];
}

export async function getOverviewLive(): Promise<{
  totalCreated: number;
  totalActive: number;
} | null> {
  const client = getClient();
  if (!client) return null;
  try {
    const data = await client.request<OverviewResponse>(OverviewQuery);
    const stats = data.factoryStats_collection[0];
    if (!stats) return null;
    return {
      totalCreated: stats.totalCreated,
      totalActive: stats.totalActive,
    };
  } catch {
    return null;
  }
}
