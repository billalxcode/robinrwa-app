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
