"use client";

import { useAppKit } from "@reown/appkit/react";
import { GraphQLClient, gql } from "graphql-request";
import { ArrowRight, Wallet } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { erc20Abi, formatUnits } from "viem";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { RemovePositionDialog } from "@/components/remove-position-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { assetLabel, getAsset, USDG_ADDRESS } from "@/lib/assets";
import {
  INDEX_ROUTER,
  indexRouterAbi,
  positionManagerAbi,
} from "@/lib/contracts";
import { decodePositionRange } from "@/lib/positions";
import { hoursSince } from "@/lib/subgraph";

interface PositionRow {
  id: string;
  tokenId: string;
  manager: string;
  active: boolean;
  createdAt: string;
  index: { id: string };
}

interface PortfolioResponse {
  positions: PositionRow[];
  indexes: { id: string; name: string }[];
  userStats_collection: {
    id: string;
    totalNetETH: string;
    totalNetUSDG: string;
  }[];
}

const PortfolioQuery = gql`
  query UserPortfolio($owner: Bytes!) {
    positions(
      first: 100
      orderBy: tokenId
      orderDirection: desc
      where: { owner: $owner }
    ) {
      id
      tokenId
      manager
      active
      createdAt
      index {
        id
      }
    }
    indexes(first: 50) {
      id
      name
    }
    userStats_collection(where: { id: $owner }) {
      id
      totalNetETH
      totalNetUSDG
    }
  }
`;

const REFRESH_MS = 10_000;

export function PortfolioTable() {
  const { address, isConnected, status } = useAccount();
  const { open: openAppKit } = useAppKit();
  const [rows, setRows] = useState<PositionRow[] | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [deposited, setDeposited] = useState<{
    eth: string;
    usdg: string;
  } | null>(null);
  const [selected, setSelected] = useState<PositionRow | null>(null);
  const [reconnectTimedOut, setReconnectTimedOut] = useState(false);

  const usdgDecimals = useReadContract({
    address: USDG_ADDRESS,
    abi: erc20Abi,
    functionName: "decimals",
    query: { enabled: !!address },
  });

  // Subgraph leaves Position.manager unset (zero address) — resolve the
  // real PositionManager from the router once, use it for every position.
  const positionManager = useReadContract({
    address: INDEX_ROUTER,
    abi: indexRouterAbi,
    functionName: "positionManager",
    query: { enabled: !!address },
  });
  const managerAddress =
    typeof positionManager.data === "string"
      ? (positionManager.data as `0x${string}`)
      : "0x0000000000000000000000000000000000000000";

  const poolReads = useReadContracts({
    contracts: (rows ?? []).map((r) => ({
      address: managerAddress,
      abi: positionManagerAbi,
      functionName: "getPoolAndPositionInfo",
      args: [BigInt(r.tokenId)],
    })),
    query: {
      enabled:
        !!address &&
        rows !== null &&
        rows.length > 0 &&
        managerAddress !== "0x0000000000000000000000000000000000000000",
    },
  });

  useEffect(() => {
    setReconnectTimedOut(false);
    if (status !== "reconnecting" && status !== "connecting") return;
    const timer = setTimeout(() => setReconnectTimedOut(true), 8000);
    return () => clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    if (!address) {
      setRows(null);
      setDeposited(null);
      return;
    }
    const url = process.env.NEXT_PUBLIC_SUBGRAPH_URL;
    if (!url) return;
    const client = new GraphQLClient(url);
    const owner = address.toLowerCase();
    let alive = true;
    async function load() {
      try {
        const data = await client.request<PortfolioResponse>(PortfolioQuery, {
          owner,
        });
        if (!alive) return;
        setRows(data.positions);
        setNames(Object.fromEntries(data.indexes.map((i) => [i.id, i.name])));
        const stats = data.userStats_collection[0] ?? null;
        setDeposited(
          stats
            ? { eth: stats.totalNetETH, usdg: stats.totalNetUSDG }
            : { eth: "0", usdg: "0" },
        );
      } catch {
        // Keep stale rows on transient failures.
      }
    }
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [address]);

  if (
    (status === "reconnecting" || status === "connecting") &&
    !reconnectTimedOut
  ) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Positions</CardTitle>
          <CardDescription>Reconnecting wallet…</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isConnected || !address) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Wallet />
          </EmptyMedia>
          <EmptyTitle>Wallet not connected</EmptyTitle>
          <EmptyDescription>
            Connect a wallet to see your positions.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={() => openAppKit()}>
            Connect wallet
            <ArrowRight data-icon="inline-end" />
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  const visible = (rows ?? [])
    .map((r, i) => ({ r, i }))
    .filter(({ r, i }) => r.active && !isBurned(i));

  function poolOf(index: number): {
    pair: string;
    range: string;
    burned: boolean;
  } | null {
    const entry = poolReads.data?.[index];
    if (!entry || entry.status !== "success") return null;
    const [poolKey, info] = entry.result as [
      {
        currency0: string;
        currency1: string;
        fee: number;
        tickSpacing: number;
        hooks: string;
      },
      bigint,
    ];
    // Burned NFTs read back as zero storage — the subgraph `active` flag
    // lags behind, so this on-chain read is the source of truth.
    if (
      /^0x0+$/.test(poolKey.currency0.toLowerCase()) &&
      /^0x0+$/.test(poolKey.currency1.toLowerCase())
    ) {
      return { pair: "", range: "", burned: true };
    }
    const a = assetLabel(getAsset(poolKey.currency0));
    const b = assetLabel(getAsset(poolKey.currency1));
    const { tickLower, tickUpper } = decodePositionRange(info);
    return {
      pair: `${a} / ${b}`,
      range: `${tickLower} → ${tickUpper}`,
      burned: false,
    };
  }

  function isBurned(index: number): boolean {
    return poolOf(index)?.burned === true;
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Portfolio Value</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {deposited === null || usdgDecimals.data === undefined
                ? "—"
                : `${Number(
                    formatUnits(BigInt(deposited.usdg), usdgDecimals.data),
                  ).toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })} USDG`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Net deposited on-chain
              {deposited !== null &&
              deposited.eth !== "0" &&
              usdgDecimals.data !== undefined
                ? ` (+${Number(formatUnits(BigInt(deposited.eth), 18)).toLocaleString("en-US", { maximumFractionDigits: 4 })} ETH)`
                : ""}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Active Positions</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {rows === null ? "—" : visible.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">LP NFTs you own</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Positions</CardTitle>
          <CardDescription>Updates every 10 seconds.</CardDescription>
        </CardHeader>
        <CardContent>
          {rows === null ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : visible.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Wallet />
                </EmptyMedia>
                <EmptyTitle>No positions yet</EmptyTitle>
                <EmptyDescription>
                  Make one deposit to open positions.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button nativeButton={false} render={<Link href="/indexes" />}>
                  Explore Indexes
                  <ArrowRight data-icon="inline-end" />
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Position NFT</TableHead>
                  <TableHead>Index</TableHead>
                  <TableHead>Pool</TableHead>
                  <TableHead>Opened</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map(({ r, i }) => {
                  const pool = poolOf(i);
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="tabular-nums">
                        #{r.tokenId}
                      </TableCell>
                      <TableCell className="font-medium text-primary">
                        {names[r.index.id] ?? `Index ${r.index.id}`}
                      </TableCell>
                      <TableCell>
                        {pool ? (
                          <span className="flex min-w-0 flex-col">
                            <span className="font-medium">{pool.pair}</span>
                            <span className="text-xs tabular-nums text-muted-foreground">
                              {pool.range}
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            {poolReads.isLoading ? "…" : "—"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {hoursSince(r.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelected(r)}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <RemovePositionDialog
        key={selected?.tokenId ?? "none"}
        position={
          selected
            ? { tokenId: selected.tokenId, manager: managerAddress }
            : null
        }
        indexName={
          selected
            ? (names[selected.index.id] ?? `Index ${selected.index.id}`)
            : ""
        }
        onClose={() => setSelected(null)}
      />
    </>
  );
}
