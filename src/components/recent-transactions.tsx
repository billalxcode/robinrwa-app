"use client";

import { useEffect } from "react";
import { erc20Abi, formatUnits } from "viem";
import { useReadContract } from "wagmi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { USDG_ADDRESS } from "@/lib/assets";
import { timeAgo, truncateAddress } from "@/lib/subgraph";
import { explorerAddressUrl, explorerTxUrl } from "@/lib/web3";
import { useMarketStore } from "@/stores/market";

function formatAmount(
  net: string,
  tokenIn: string,
  usdgDecimals: number | undefined,
): string {
  try {
    const value = BigInt(net);
    if (/^0x0+$/.test(tokenIn.toLowerCase())) {
      return `${Number(formatUnits(value, 18)).toLocaleString("en-US", {
        maximumFractionDigits: 6,
      })} ETH`;
    }
    if (
      tokenIn.toLowerCase() === USDG_ADDRESS.toLowerCase() &&
      usdgDecimals !== undefined
    ) {
      return `${Number(formatUnits(value, usdgDecimals)).toLocaleString(
        "en-US",
        { maximumFractionDigits: 6 },
      )} USDG`;
    }
  } catch {
    // Fall through to raw display below.
  }
  return `${net} units`;
}

const REFRESH_MS = 10_000;

export function RecentTransactions({ indexId }: { indexId: string }) {
  // Shared per-index cache: remounts and tab switches reuse rows while fresh.
  const rows = useMarketStore((s) => s.recentByIndex[indexId]?.rows ?? null);
  const fetchRecent = useMarketStore((s) => s.fetchRecent);
  const usdgDecimals = useReadContract({
    address: USDG_ADDRESS,
    abi: erc20Abi,
    functionName: "decimals",
  });

  useEffect(() => {
    fetchRecent(indexId);
    const timer = setInterval(() => fetchRecent(indexId, true), REFRESH_MS);
    return () => clearInterval(timer);
  }, [indexId, fetchRecent]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Last Transactions</CardTitle>
        <CardDescription>Updates every 10 seconds.</CardDescription>
      </CardHeader>
      <CardContent>
        {rows === null ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No transactions yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Epoch</TableHead>
                <TableHead>Legs</TableHead>
                <TableHead>Age</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((tx) => (
                <TableRow key={tx.transactionHash}>
                  <TableCell className="font-mono text-xs">
                    <a
                      href={explorerTxUrl(tx.transactionHash)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      {truncateAddress(tx.transactionHash)}
                    </a>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    <a
                      href={explorerAddressUrl(tx.user)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      {truncateAddress(tx.user)}
                    </a>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatAmount(tx.net, tx.tokenIn, usdgDecimals.data)}
                  </TableCell>
                  <TableCell className="tabular-nums">{tx.epoch}</TableCell>
                  <TableCell className="tabular-nums">
                    {tx.filledLegs}/{tx.filledLegs + tx.skippedLegs}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {timeAgo(tx.blockTimestamp)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
