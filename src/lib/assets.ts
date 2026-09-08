// Asset registry: metadata for every token shown in the app.
// Keyed by lowercase address. Logo/name/ticker per token slot in later;
// for now ALL entries use the placeholder logo per owner instruction.
//
// CoinGecko research (Dok: /websites/coingecko — coins-contract-address):
// per-token lookup needs an asset-platform ID and Robinhood Chain is not a
// listed platform, so automatic icon resolution is pending. When listed,
// fill `logo` from the `image.small` field and `ticker`/`name` from the
// same endpoint. Dok: /websites/coingecko — contract address lookup.

export const PLACEHOLDER_LOGO =
  "https://assets.coingecko.com/coins/images/102174110/standard/0xd0601ce157db5bdc3162bbac2a2c8af5320d9eec.png?1782444565";

// Robinscan asset logo API (verified: returns per-ticker PNG).
export function robinscanLogo(ticker: string, size = 512): string {
  return `https://robinscan.io/api/assets/logo/${ticker}?size=${size}`;
}

export interface AssetMetadata {
  /** Lowercase contract address. */
  address: string;
  /** Display name. Null until resolved (on-chain `name()` or owner input). */
  name: string | null;
  /** Ticker. Null until resolved (on-chain `symbol()` or owner input). */
  ticker: string | null;
  /** Logo URL. */
  logo: string;
  /** ERC-20 decimals. Null until resolved. */
  decimals: number | null;
}

// Constituents observed on-chain (WeightRegistry epoch 1, subgraph).
// Identity verified against Robinscan token pages (titles observed
// in-session): NVDA, SPCX, AAPL — all "• Robinhood Token" ERC-20s.
// Decimals 18 observed on the NVDA page; others unresolved (null).
const KNOWN_ASSETS: AssetMetadata[] = [
  {
    address: "0x4a0e65a3eccec6dbe60ae065f2e7bb85fae35eea",
    name: "Space Exploration Technologies Corp. Class A Common Stock • Robinhood Token",
    ticker: "SPCX",
    logo: robinscanLogo("SPCX"),
    decimals: null,
  },
  {
    address: "0xaf3d76f1834a1d425780943c99ea8a608f8a93f9",
    name: "Apple • Robinhood Token",
    ticker: "AAPL",
    logo: robinscanLogo("AAPL"),
    decimals: null,
  },
  {
    address: "0xd0601ce157db5bdc3162bbac2a2c8af5320d9eec",
    name: "NVIDIA • Robinhood Token",
    ticker: "NVDA",
    logo: robinscanLogo("NVDA"),
    decimals: 18,
  },
  {
    // Quote token for all index legs. Address documented in
    // docs/LAPORAN-LIKUIDITAS.md (WETH 0x0Bd7…, USDG 0x5fc5…).
    address: "0x5fc5360d0400a0fd4f2af552add042d716f1d168",
    name: "USDG",
    ticker: "USDG",
    logo: PLACEHOLDER_LOGO,
    decimals: null,
  },
];

const byAddress = new Map(KNOWN_ASSETS.map((a) => [a.address, a]));

export function getAsset(address: string): AssetMetadata {
  const key = address.toLowerCase();
  return (
    byAddress.get(key) ?? {
      address: key,
      name: null,
      ticker: null,
      logo: PLACEHOLDER_LOGO,
      decimals: null,
    }
  );
}

/** Display label: ticker when known, truncated address otherwise. */
export function assetLabel(asset: AssetMetadata): string {
  if (asset.ticker) return asset.ticker;
  return `${asset.address.slice(0, 6)}…${asset.address.slice(-4)}`;
}
