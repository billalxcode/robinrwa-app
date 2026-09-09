// Position decoding helpers.
//
// Dok: /uniswap/v4-periphery — PositionInfo 256-bit layout: bits 200-255
// truncated pool id, bits 32-55 upper tick, bits 8-31 lower tick, bits 0-7
// subscription flag. Ticks are signed 24-bit.

const TICK_BITS = BigInt(0xffffff);
const TICK_SIGN = BigInt(0x800000);
const TICK_MOD = BigInt(0x1000000);

function toSignedTick(raw: bigint): number {
  const masked = raw & TICK_BITS;
  const signed = masked >= TICK_SIGN ? masked - TICK_MOD : masked;
  return Number(signed);
}

export interface PositionRange {
  tickLower: number;
  tickUpper: number;
}

export function decodePositionRange(info: bigint): PositionRange {
  return {
    tickLower: toSignedTick(info >> BigInt(8)),
    tickUpper: toSignedTick(info >> BigInt(32)),
  };
}
