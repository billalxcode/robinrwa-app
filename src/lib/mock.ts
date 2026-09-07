// Sample data for UI preview. NOT on-chain data.
// Weights mirror the SPEC-EINDEX-ROUTER example (NVDA 43.1 / MSFT 31.0 / AAPL 25.9).

export interface MockIndex {
  id: string;
  name: string;
  symbol: string;
  constituents: string[];
  topWeight: string;
  epoch: number;
  status: "Active" | "Inactive";
}

export const mockIndexes: MockIndex[] = [
  {
    id: "rwa300",
    name: "RWA300",
    symbol: "RWA300",
    constituents: ["AAPL", "NVDA", "MSFT"],
    topWeight: "NVDA 43.1%",
    epoch: 1,
    status: "Active",
  },
  {
    id: "mag7",
    name: "MAG7-VOL",
    symbol: "MAG7-VOL",
    constituents: ["AAPL", "MSFT", "NVDA", "AMZN", "META", "GOOGL", "TSLA"],
    topWeight: "NVDA 25.0%",
    epoch: 1,
    status: "Active",
  },
  {
    id: "rocket300",
    name: "ROCKET300",
    symbol: "ROCKET300",
    constituents: ["TSLA", "SPCX"],
    topWeight: "TSLA 60.0%",
    epoch: 1,
    status: "Inactive",
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
