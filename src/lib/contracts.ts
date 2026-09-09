// On-chain contract addresses + minimal ABIs for Robinhood Chain (4663).
//
// Addresses: `ignition/deployments/chain-4663/deployed_addresses.json`
// (proxy rows) in the contracts repo.
// ABIs transcribed from `contracts/interfaces/IIndexRouter.sol`,
// `IIndexFactory.sol`, `IWeightRegistry.sol` (Solidity 0.8.34).

export const INDEX_ROUTER =
  "0x74024094398Bf39fC5c62614fbc2d54e64773943" as const;
export const INDEX_FACTORY =
  "0xCe42fbD100a81b1228220e5C1Bf64AdDADcBad24" as const;
export const WEIGHT_REGISTRY =
  "0x7b1d2FD490C0973b2264B83EF133993742Bc6141" as const;
export const ASSET_REGISTRY =
  "0x882c5577606F423565F74fAa3372E8C24f5397f5" as const;

const legConfig = {
  name: "configs",
  type: "tuple[]",
  components: [
    { name: "tickLower", type: "int24" },
    { name: "tickUpper", type: "int24" },
    { name: "minLiquidity", type: "uint256" },
    { name: "data", type: "bytes" },
  ],
} as const;

export const indexRouterAbi = [
  {
    type: "function",
    name: "addLiquidityETH",
    inputs: [
      { name: "indexId", type: "uint256" },
      { name: "minEpoch", type: "uint64" },
      legConfig,
      { name: "skipTokens", type: "address[]" },
      { name: "deadline", type: "uint256" },
    ],
    outputs: [{ name: "tokenIds", type: "uint256[]" }],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "addLiquidityUSDG",
    inputs: [
      { name: "indexId", type: "uint256" },
      { name: "usdgAmount", type: "uint256" },
      { name: "minEpoch", type: "uint64" },
      legConfig,
      { name: "skipTokens", type: "address[]" },
      { name: "deadline", type: "uint256" },
    ],
    outputs: [{ name: "tokenIds", type: "uint256[]" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "removeLiquidity",
    inputs: [
      { name: "tokenIds", type: "uint256[]" },
      { name: "amount0Min", type: "uint256[]" },
      { name: "amount1Min", type: "uint256[]" },
      { name: "data", type: "bytes[]" },
      { name: "deadline", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "LiquidityAdded",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "indexId", type: "uint256", indexed: true },
      { name: "epoch", type: "uint64", indexed: false },
      { name: "tokenIn", type: "address", indexed: false },
      { name: "net", type: "uint256", indexed: false },
      { name: "tokenIds", type: "uint256[]", indexed: false },
    ],
  },
  {
    type: "function",
    name: "usdg",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "feeBps",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "poolManager",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "positionManager",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "poolFee",
    inputs: [],
    outputs: [{ name: "", type: "uint24" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "poolTickSpacing",
    inputs: [],
    outputs: [{ name: "", type: "int24" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "poolHooks",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
] as const;

// NOTE: getSlot0() reverts on this chain's PoolManager (observed live).
// Read Slot0 via extsload instead — see quote.ts readTick().
export const poolManagerAbi = [
  {
    type: "function",
    name: "getSlot0",
    inputs: [{ name: "poolId", type: "bytes32" }],
    outputs: [
      { name: "sqrtPriceX96", type: "uint160" },
      { name: "tick", type: "int24" },
      { name: "protocolFee", type: "uint24" },
      { name: "lpFee", type: "uint24" },
    ],
    stateMutability: "view",
  },
] as const;

// Dok: /uniswap/v4-periphery — PositionManager.getPoolAndPositionInfo.
export const positionManagerAbi = [
  {
    type: "function",
    name: "getPoolAndPositionInfo",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      {
        name: "poolKey",
        type: "tuple",
        components: [
          { name: "currency0", type: "address" },
          { name: "currency1", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "tickSpacing", type: "int24" },
          { name: "hooks", type: "address" },
        ],
      },
      { name: "info", type: "uint256" },
    ],
    stateMutability: "view",
  },
] as const;

export const weightRegistryAbi = [
  {
    type: "function",
    name: "epoch",
    inputs: [],
    outputs: [{ name: "", type: "uint64" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getWeightsFor",
    inputs: [{ name: "tokens", type: "address[]" }],
    outputs: [{ name: "", type: "uint16[]" }],
    stateMutability: "view",
  },
] as const;

export const indexFactoryAbi = [
  {
    type: "function",
    name: "getLegs",
    inputs: [{ name: "indexId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "token", type: "address" },
          { name: "quote", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "tickSpacing", type: "int24" },
          { name: "hooks", type: "address" },
        ],
      },
    ],
    stateMutability: "view",
  },
] as const;

export interface TxLegConfig {
  tickLower: number;
  tickUpper: number;
  minLiquidity: bigint;
  data: `0x${string}`;
}

/// @dev One-sided range for the quote side, mirrored from the contracts
/// repo `scripts/sim/lib.ts` `cfgFor` (mock pools at price 1.0, tick 0).
/// On pools whose price sits outside the range the contract skips the leg
/// and refunds — never reverts the whole deposit.
export function cfgFor(token: string, quote: string): TxLegConfig {
  if (BigInt(quote) < BigInt(token)) {
    return {
      tickLower: 600,
      tickUpper: 1200,
      minLiquidity: BigInt(1),
      data: "0x",
    };
  }
  return {
    tickLower: -1200,
    tickUpper: -600,
    minLiquidity: BigInt(1),
    data: "0x",
  };
}
