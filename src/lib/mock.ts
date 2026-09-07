// Sample data for UI preview. NOT on-chain data.
// Weights mirror the SPEC-EINDEX-ROUTER example (NVDA 43.1 / MSFT 31.0 / AAPL 25.9).

export interface MockTokenWeight {
  token: string;
  weightBps: number;
  share: string;
}

export interface MockIndex {
  id: string;
  name: string;
  symbol: string;
  description: string;
  constituents: string[];
  topWeight: string;
  epoch: number;
  status: "Active" | "Inactive";
  createdBy: string;
  network: string;
  protocol: string;
  fee: string;
  lastTxHash: string;
  lastTxTime: string;
  tvl: string;
  volume24h: string;
  volume30d: string;
  apy: string;
  tokens: MockTokenWeight[];
}

export const mockIndexes: MockIndex[] = [
  {
    id: "rwa300",
    name: "RWA300",
    symbol: "RWA300",
    description: "Top-3 RWA stocks by 24h volume. One deposit, three LP legs.",
    constituents: ["AAPL", "NVDA", "MSFT"],
    topWeight: "NVDA 43.1%",
    epoch: 1,
    status: "Active",
    createdBy: "Admin multisig",
    network: "Robinhood Chain (4663)",
    protocol: "Uniswap v4",
    fee: "20 bps (0.20%)",
    lastTxHash:
      "0x8f3a41b7c9d24e60f1a5b83d6c7e0f4a9b2c3d4e5f60718293a4b5c6d7e8fc21d",
    lastTxTime: "12 min ago",
    tvl: "$1.24M",
    volume24h: "$86.4K",
    volume30d: "$2.31M",
    apy: "8.4%",
    tokens: [
      { token: "NVDA", weightBps: 4310, share: "43.1%" },
      { token: "MSFT", weightBps: 3100, share: "31.0%" },
      { token: "AAPL", weightBps: 2590, share: "25.9%" },
    ],
  },
  {
    id: "mag7",
    name: "MAG7-VOL",
    symbol: "MAG7-VOL",
    description: "Magnificent-7 basket, volume-weighted by oracle epoch.",
    constituents: ["AAPL", "MSFT", "NVDA", "AMZN", "META", "GOOGL", "TSLA"],
    topWeight: "NVDA 25.0%",
    epoch: 1,
    status: "Active",
    createdBy: "Admin multisig",
    network: "Robinhood Chain (4663)",
    protocol: "Uniswap v4",
    fee: "20 bps (0.20%)",
    lastTxHash:
      "0x3b7c9d21f4a68e05c1a7b94d6e2f803a5c7d1e9f40618273a5b6c8d9e0f1a2b3c",
    lastTxTime: "48 min ago",
    tvl: "$4.87M",
    volume24h: "$312K",
    volume30d: "$8.94M",
    apy: "6.9%",
    tokens: [
      { token: "NVDA", weightBps: 2500, share: "25.0%" },
      { token: "MSFT", weightBps: 1800, share: "18.0%" },
      { token: "AAPL", weightBps: 1700, share: "17.0%" },
      { token: "AMZN", weightBps: 1200, share: "12.0%" },
      { token: "META", weightBps: 1100, share: "11.0%" },
      { token: "GOOGL", weightBps: 900, share: "9.0%" },
      { token: "TSLA", weightBps: 800, share: "8.0%" },
    ],
  },
  {
    id: "rocket300",
    name: "ROCKET300",
    symbol: "ROCKET300",
    description: "High-conviction duo. Inactive — deposits disabled.",
    constituents: ["TSLA", "SPCX"],
    topWeight: "TSLA 60.0%",
    epoch: 1,
    status: "Inactive",
    createdBy: "Admin multisig",
    network: "Robinhood Chain (4663)",
    protocol: "Uniswap v4",
    fee: "20 bps (0.20%)",
    lastTxHash:
      "0xc41d88f2a5b63e1907d4c2a8f5e6b319d0c7a4e5f28613b9d0c5e7f2a4b6c8d9e0f",
    lastTxTime: "3 days ago",
    tvl: "$0.00",
    volume24h: "$0.00",
    volume30d: "$412K",
    apy: "—",
    tokens: [
      { token: "TSLA", weightBps: 6000, share: "60.0%" },
      { token: "SPCX", weightBps: 4000, share: "40.0%" },
    ],
  },
];

export interface MockWeight {
  token: string;
  weightBps: number;
  share: string;
}

export const mockWeights: MockWeight[] = [
  { token: "NVDA", weightBps: 2500, share: "25.0%" },
  { token: "MSFT", weightBps: 1800, share: "18.0%" },
  { token: "AAPL", weightBps: 1700, share: "17.0%" },
  { token: "AMZN", weightBps: 1200, share: "12.0%" },
  { token: "META", weightBps: 1100, share: "11.0%" },
  { token: "GOOGL", weightBps: 900, share: "9.0%" },
  { token: "TSLA", weightBps: 800, share: "8.0%" },
];

export function getMockIndex(id: string): MockIndex | undefined {
  return mockIndexes.find((idx) => idx.id === id);
}
