"use client";

import { useEffect, useRef } from "react";
import type { LiveIndexList, OracleStatus } from "@/lib/subgraph";
import { useMarketStore } from "@/stores/market";

// Seeds the market store with server-fetched data so client components
// read from Zustand instead of refetching GraphQL on mount.
export function MarketHydrator({
  indexes,
  oracle,
}: {
  indexes: LiveIndexList | null;
  oracle: OracleStatus | null;
}) {
  const hydrate = useMarketStore((s) => s.hydrate);
  const seeded = useRef(false);

  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    hydrate({ indexes, oracle });
  }, [hydrate, indexes, oracle]);

  return null;
}
