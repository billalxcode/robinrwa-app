import type { PublicClient } from "viem";
import { encodeAbiParameters, keccak256, toHex } from "viem";
import {
  cfgFor,
  INDEX_ROUTER,
  indexRouterAbi,
  type TxLegConfig,
} from "./contracts";

const MIN_TICK = -887272;
const MAX_TICK = 887272;

const extsloadAbi = [
  {
    type: "function",
    name: "extsload",
    inputs: [{ name: "slot", type: "bytes32" }],
    outputs: [{ name: "", type: "bytes32" }],
    stateMutability: "view",
  },
] as const;

export interface QuoteInput {
  tokenAddress: string;
  quoteAddress: string;
  fee: number;
  tickSpacing: number;
  hooks: string;
}

export interface PoolConfig {
  poolManager: `0x${string}`;
  fee: number;
  tickSpacing: number;
  hooks: string;
}

/// @dev Global pool config from the router (fallback for legs whose
/// tickSpacing is unset/0). Mirrors quote.ts + IndexFactory docs.
export async function getPoolConfig(client: PublicClient): Promise<PoolConfig> {
  const [poolManager, fee, tickSpacing, hooks] = await Promise.all([
    client.readContract({
      address: INDEX_ROUTER,
      abi: indexRouterAbi,
      functionName: "poolManager",
    }),
    client.readContract({
      address: INDEX_ROUTER,
      abi: indexRouterAbi,
      functionName: "poolFee",
    }),
    client.readContract({
      address: INDEX_ROUTER,
      abi: indexRouterAbi,
      functionName: "poolTickSpacing",
    }),
    client.readContract({
      address: INDEX_ROUTER,
      abi: indexRouterAbi,
      functionName: "poolHooks",
    }),
  ]);
  return {
    poolManager: poolManager as `0x${string}`,
    fee: Number(fee),
    tickSpacing: Number(tickSpacing),
    hooks: hooks as string,
  };
}

/// @dev Current tick via extsload (Slot0 slot 6), exactly like quote.ts.
/// getSlot0() reverts on this chain's PoolManager — do NOT use it.
/// Returns null when the pool is missing.
async function readTick(
  client: PublicClient,
  poolManager: `0x${string}`,
  poolId: `0x${string}`,
): Promise<number | null> {
  const slot = keccak256(
    encodeAbiParameters(
      [
        { name: "poolId", type: "bytes32" },
        { name: "slot", type: "bytes32" },
      ],
      [poolId, toHex(6, { size: 32 })],
    ),
  );
  try {
    const data = await client.readContract({
      address: poolManager,
      abi: extsloadAbi,
      functionName: "extsload",
      args: [slot],
    });
    const raw = BigInt(data);
    if ((raw & ((BigInt(1) << BigInt(160)) - BigInt(1))) === BigInt(0)) {
      return null;
    }
    const tickU = Number((raw >> BigInt(160)) & BigInt(0xffffff));
    return tickU >= 0x800000 ? tickU - 0x1000000 : tickU;
  } catch {
    return null;
  }
}

/// @dev PoolId derived exactly like IndexRouter._poolKey (sorted currencies).
export function poolIdFor(
  token: string,
  quote: string,
  fee: number,
  tickSpacing: number,
  hooks: string,
): `0x${string}` {
  const [c0, c1] =
    BigInt(token) < BigInt(quote) ? [token, quote] : [quote, token];
  return keccak256(
    encodeAbiParameters(
      [
        { name: "currency0", type: "address" },
        { name: "currency1", type: "address" },
        { name: "fee", type: "uint24" },
        { name: "tickSpacing", type: "int24" },
        { name: "hooks", type: "address" },
      ],
      [
        c0 as `0x${string}`,
        c1 as `0x${string}`,
        fee,
        tickSpacing,
        hooks as `0x${string}`,
      ],
    ),
  );
}

/// @dev Pure range math (testable): one-sided range from the current tick,
/// snapped to spacing multiples. Mirrors quote.ts.
export function rangeForTick(
  tick: number,
  spacing: number,
  quoteIs0: boolean,
  widthMult = 10,
): { lower: number; upper: number } {
  if (quoteIs0) {
    const lower = Math.ceil(tick / spacing) * spacing;
    return { lower, upper: lower + widthMult * spacing };
  }
  const upper = Math.floor(tick / spacing) * spacing;
  return { lower: upper - widthMult * spacing, upper };
}

export interface QuotedLeg {
  config: TxLegConfig;
  /** False when the pool is missing/unusable — contract will skip + refund. */
  ok: boolean;
  reason: string | null;
}

/// @dev Merges user-skipped + price-skipped token addresses (deduped,
/// in leg order). If the result covers every leg, the caller MUST NOT send
/// the tx — the contract reverts NoEligibleLegs and gas is burned.
export function mergeSkipLists(
  legs: { tokenAddress: string }[],
  skippedAddresses: string[],
  priceSkipped: string[],
): string[] {
  const user = new Set(skippedAddresses.map((s) => s.toLowerCase()));
  const price = new Set(priceSkipped.map((s) => s.toLowerCase()));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const l of legs) {
    const a = l.tokenAddress.toLowerCase();
    if ((user.has(a) || price.has(a)) && !seen.has(a)) {
      seen.add(a);
      out.push(l.tokenAddress);
    }
  }
  return out;
}
/// @dev Builds per-leg configs aligned with the input leg order (the
/// contract requires 1:1 alignment; skipped legs MUST still get a
/// well-formed config). Legs without a usable pool fall back to the
/// static mock range — on-chain skips them safely (sqrtP == 0 → 0).
export async function getLegConfigs(
  client: PublicClient,
  legs: QuoteInput[],
  widthMult = 10,
): Promise<{ configs: TxLegConfig[]; skipped: number[] }> {
  const cfg = await getPoolConfig(client);
  const skipped: number[] = [];
  const configs = await Promise.all(
    legs.map(async (leg, i): Promise<TxLegConfig> => {
      const fallback = (): TxLegConfig => {
        skipped.push(i);
        return { ...cfgFor(leg.tokenAddress, leg.quoteAddress) };
      };
      const unset = leg.tickSpacing === 0;
      const fee = unset ? cfg.fee : leg.fee;
      const spacing = unset ? cfg.tickSpacing : leg.tickSpacing;
      const hooks = unset ? cfg.hooks : leg.hooks;
      if (spacing <= 0) return fallback();
      const [c0] =
        BigInt(leg.tokenAddress) < BigInt(leg.quoteAddress)
          ? [leg.tokenAddress, leg.quoteAddress]
          : [leg.quoteAddress, leg.tokenAddress];
      const quoteIs0 = c0.toLowerCase() === leg.quoteAddress.toLowerCase();
      let tick: number | null;
      try {
        tick = await readTick(
          client,
          cfg.poolManager,
          poolIdFor(leg.tokenAddress, leg.quoteAddress, fee, spacing, hooks),
        );
      } catch {
        return fallback();
      }
      if (tick === null) return fallback();
      const { lower, upper } = rangeForTick(tick, spacing, quoteIs0, widthMult);
      if (!(lower >= MIN_TICK && upper <= MAX_TICK && lower < upper)) {
        return fallback();
      }
      return {
        tickLower: lower,
        tickUpper: upper,
        minLiquidity: BigInt(1),
        data: "0x",
      };
    }),
  );
  return { configs, skipped };
}
