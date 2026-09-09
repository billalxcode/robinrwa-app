import type { AppKitNetwork } from "@reown/appkit/networks";
import { defineChain } from "@reown/appkit/networks";
import { createPublicClient, erc20Abi, http } from "viem";
import { USDG_ADDRESS } from "@/lib/assets";

// Public identifiers as constants; private/endpoint values come from .env.
export const REOWN_PROJECT_ID =
  process.env.NEXT_PUBLIC_REOWN_PROJECT_ID ??
  "bb204adfd2baee29dcb2b720d72ffaa1";

export const ROBINHOOD_RPC_URL =
  process.env.NEXT_PUBLIC_ROBINHOOD_RPC_URL ??
  "https://rpc.mainnet.chain.robinhood.com/";

export const ROBINHOOD_EXPLORER_URL =
  process.env.NEXT_PUBLIC_ROBINHOOD_EXPLORER_URL ?? "https://robinscan.io";

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Verified patterns (Robinscan pages observed in-session):
// https://robinscan.io/token/{address}
// https://robinscan.io/address/{address}
// https://robinscan.io/tx/{hash}
export function explorerTokenUrl(address: string): string {
  return `${ROBINHOOD_EXPLORER_URL}/token/${address}`;
}

export function explorerAddressUrl(address: string): string {
  return `${ROBINHOOD_EXPLORER_URL}/address/${address}`;
}

export function explorerTxUrl(hash: string): string {
  return `${ROBINHOOD_EXPLORER_URL}/tx/${hash}`;
}

// Uniswap web app position page (chain slug "robinhood", v4).
export function uniswapPositionUrl(tokenId: string | number | bigint): string {
  return `https://app.uniswap.org/positions/v4/robinhood/${String(tokenId)}`;
}

// Robinhood Chain mainnet (EVM, chainId 4663). Shape per Context7
// Dok: /reown-com/reown-docs — custom networks via defineChain.
export const robinhood = defineChain({
  id: 4663,
  caipNetworkId: "eip155:4663",
  chainNamespace: "eip155",
  name: "Robinhood Chain",
  nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
  rpcUrls: {
    default: { http: [ROBINHOOD_RPC_URL] },
    public: { http: [ROBINHOOD_RPC_URL] },
  },
  blockExplorers: {
    default: { name: "RobinScan", url: ROBINHOOD_EXPLORER_URL },
  },
});

export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [robinhood];

// Read-only client for quoter/config reads (no key needed).
export function getPublicClient() {
  return createPublicClient({
    chain: robinhood,
    transport: http(ROBINHOOD_RPC_URL),
  });
}

let usdgDecimalsCache: number | null = null;

// USDG decimals read on-chain (never assumed — stablecoins vary).
export async function getUsdgDecimals(): Promise<number | null> {
  if (usdgDecimalsCache !== null) return usdgDecimalsCache;
  try {
    const decimals = await getPublicClient().readContract({
      address: USDG_ADDRESS,
      abi: erc20Abi,
      functionName: "decimals",
    });
    usdgDecimalsCache = decimals;
    return decimals;
  } catch {
    return null;
  }
}

export const web3Metadata = {
  name: "RobinRWA",
  description: "eIndex dashboard — diversified RWA index positions.",
  url: APP_URL,
  icons: [`${APP_URL}/icon.svg`],
};
