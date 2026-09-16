"use client";

import { useAppKit } from "@reown/appkit/react";
import { ArrowRight, Wallet } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { erc20Abi, formatUnits } from "viem";
import { useReadContract, useReadContracts } from "wagmi";
import { RemovePositionDialog } from "@/components/remove-position-dialog";
import { TokenIcon } from "@/components/token-icon";
import { Badge } from "@/components/ui/badge";
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
import { hoursSince, timeAgo } from "@/lib/subgraph";
import { explorerTxUrl, uniswapPositionUrl } from "@/lib/web3";
import type { DepositEvent } from "@/stores/portfolio";
import { usePortfolioStore } from "@/stores/portfolio";
import { useWalletStore } from "@/stores/wallet";

const REFRESH_MS = 10_000;

export function PortfolioTable() {
  // Connection state from the wallet store (synced once from AppKit by
  // <WalletSync/>) — never read useAppKitAccount/useAccount directly here.
  const address = useWalletStore((s) => s.address);
  const isConnected = useWalletStore((s) => s.isConnected);
  const status = useWalletStore((s) => s.status);
  const mounted = useWalletStore((s) => s.mounted);
  const { open: openAppKit } = useAppKit();
  // Portfolio cache from the store: shared per wallet, no refetch on
  // remount while fresh.
  const cache = usePortfolioStore((s) =>
    address ? s.byOwner[address.toLowerCase()] : undefined,
  );
  const fetchPortfolio = usePortfolioStore((s) => s.fetchPortfolio);
  const selectedTokenId = usePortfolioStore((s) => s.selectedTokenId);
  const setSelected = usePortfolioStore((s) => s.setSelected);
  const rows = cache?.rows ?? null;
  const names = cache?.names ?? {};
  const deposited = cache?.deposited ?? null;
  const stats = cache?.stats ?? null;
  const deposits = cache?.deposits ?? null;
  const removals = cache?.removals ?? null;
  const selected = rows?.find((r) => r.tokenId === selectedTokenId) ?? null;
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
    if (!address) return;
    fetchPortfolio(address);
    const timer = setInterval(() => fetchPortfolio(address, true), REFRESH_MS);
    return () => clearInterval(timer);
  }, [address, fetchPortfolio]);

  useEffect(() => {
    setReconnectTimedOut(false);
    if (status !== "reconnecting" && status !== "connecting") return;
    const timer = setTimeout(() => setReconnectTimedOut(true), 8000);
    return () => clearTimeout(timer);
  }, [status]);

  const closed = (rows ?? []).filter((r) => !r.active || r.burnedAt !== null);

  // Plain per-render computation (≤100 rows): pairs of active NFTs.
  // poolOf/isBurned are hoisted function declarations below.

  if (
    !mounted ||
    ((status === "reconnecting" || status === "connecting") &&
      !reconnectTimedOut)
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

  const allocCounts = new Map<string, number>();
  for (const { i } of visible) {
    const pool = poolOf(i);
    if (!pool || pool.burned || !pool.pair) continue;
    allocCounts.set(pool.pair, (allocCounts.get(pool.pair) ?? 0) + 1);
  }
  const allocation = [...allocCounts.entries()].sort((a, b) => b[1] - a[1]);
  const maxAlloc = Math.max(1, ...allocation.map(([, n]) => n));

  function fmtNet(d: DepositEvent): string {
    const isUsdg = d.tokenIn.toLowerCase() === USDG_ADDRESS.toLowerCase();
    const dec = isUsdg ? (usdgDecimals.data ?? 18) : 18;
    const ticker = isUsdg ? "USDG" : "ETH";
    try {
      const v = Number(formatUnits(BigInt(d.net), dec));
      return `${v.toLocaleString("en-US", { maximumFractionDigits: 4 })} ${ticker}`;
    } catch {
      return "—";
    }
  }

  function poolOf(index: number): {
    pair: string;
    logos: { src: string; label: string }[];
    fee: string;
    burned: boolean;
  } | null {
    const entry = poolReads.data?.[index];
    if (!entry || entry.status !== "success") return null;
    const [poolKey] = entry.result as [
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
      return { pair: "", logos: [], fee: "", burned: true };
    }
    const assetA = getAsset(poolKey.currency0);
    const assetB = getAsset(poolKey.currency1);
    return {
      pair: `${assetLabel(assetA)} / ${assetLabel(assetB)}`,
      logos: [
        { src: assetA.logo, label: assetLabel(assetA) },
        { src: assetB.logo, label: assetLabel(assetB) },
      ],
      fee: `${(poolKey.fee / 10000).toFixed(2)}%`,
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
        <Card>
          <CardHeader>
            <CardDescription>Total Deposits</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {stats === null ? "—" : stats.depositCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {stats === null
                ? "On-chain count"
                : `First ${timeAgo(stats.firstDepositAt)} and last ${timeAgo(stats.lastDepositAt)}`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Legs Filled</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {stats === null ? "—" : stats.filledLegs}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {stats === null
                ? "Across all deposits"
                : `${stats.skippedLegs} skipped (refunded)`}
            </p>
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
                        <Link
                          href={uniswapPositionUrl(r.tokenId)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline"
                        >
                          #{r.tokenId}
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium text-primary">
                        <Link
                          href={`/indexes/${r.index.id}`}
                          className="hover:underline"
                        >
                          {names[r.index.id] ?? `Index ${r.index.id}`}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {pool ? (
                          <span className="flex min-w-0 items-center gap-2.5">
                            <span className="flex shrink-0 items-center">
                              <TokenIcon
                                src={pool.logos[0].src}
                                label={pool.logos[0].label}
                              />
                              <TokenIcon
                                src={pool.logos[1].src}
                                label={pool.logos[1].label}
                                className="-ml-1.5 ring-2 ring-card"
                              />
                            </span>
                            <span className="flex min-w-0 flex-col gap-1">
                              <span className="font-medium">{pool.pair}</span>
                              <span>
                                <Badge variant="outline">{pool.fee} fee</Badge>
                              </span>
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
                          onClick={() => setSelected(r.tokenId)}
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

      <Card>
        <CardHeader>
          <CardTitle>Allocation by pool</CardTitle>
          <CardDescription>Active NFTs per pair.</CardDescription>
        </CardHeader>
        <CardContent>
          {poolReads.isLoading || poolReads.isFetching ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ) : allocation.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No active positions to allocate.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {allocation.map(([pair, n]) => (
                <div key={pair} className="flex items-center gap-3">
                  <span className="w-36 truncate text-sm font-medium">
                    {pair}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(n / maxAlloc) * 100}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-sm tabular-nums">
                    {n}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Deposit history</CardTitle>
          <CardDescription>
            Latest 20 deposits from this wallet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {deposits === null ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : deposits.length === 0 ? (
            <p className="text-sm text-muted-foreground">No deposits yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Age</TableHead>
                  <TableHead>Index</TableHead>
                  <TableHead>Net</TableHead>
                  <TableHead>Legs</TableHead>
                  <TableHead>Epoch</TableHead>
                  <TableHead>Tx</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deposits.map((d) => (
                  <TableRow key={d.transactionHash}>
                    <TableCell className="text-muted-foreground">
                      {timeAgo(d.blockTimestamp)}
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link
                        href={`/indexes/${d.indexId}`}
                        className="text-primary hover:underline"
                      >
                        {names[d.indexId] ?? `Index ${d.indexId}`}
                      </Link>
                    </TableCell>
                    <TableCell className="tabular-nums">{fmtNet(d)}</TableCell>
                    <TableCell className="tabular-nums">
                      {d.filledLegs}/
                      {Number(d.filledLegs) + Number(d.skippedLegs)}
                    </TableCell>
                    <TableCell className="tabular-nums">{d.epoch}</TableCell>
                    <TableCell>
                      <Link
                        href={explorerTxUrl(d.transactionHash)}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-xs text-primary hover:underline"
                      >
                        {`${d.transactionHash.slice(0, 10)}…${d.transactionHash.slice(-4)}`}
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Withdrawals</CardTitle>
          <CardDescription>
            Closed positions and removals from this wallet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {removals === null || rows === null ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : removals.length === 0 && closed.length === 0 ? (
            <p className="text-sm text-muted-foreground">No withdrawals yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Age</TableHead>
                  <TableHead>NFTs</TableHead>
                  <TableHead>Tx</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {closed.map((r) => (
                  <TableRow key={`closed-${r.id}`}>
                    <TableCell className="text-muted-foreground">
                      {r.burnedAt ? timeAgo(r.burnedAt) : "—"}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      <Link
                        href={uniswapPositionUrl(r.tokenId)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        #{r.tokenId}
                      </Link>
                      <span className="text-muted-foreground"> closed</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">—</TableCell>
                  </TableRow>
                ))}
                {removals.map((m) => (
                  <TableRow key={m.transactionHash}>
                    <TableCell className="text-muted-foreground">
                      {timeAgo(m.blockTimestamp)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {m.tokenIds.map((t, j) => (
                        <span key={t}>
                          {j > 0 && ", "}
                          <Link
                            href={uniswapPositionUrl(t)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline"
                          >
                            #{t}
                          </Link>
                        </span>
                      ))}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={explorerTxUrl(m.transactionHash)}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-xs text-primary hover:underline"
                      >
                        {`${m.transactionHash.slice(0, 10)}…${m.transactionHash.slice(-4)}`}
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
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
