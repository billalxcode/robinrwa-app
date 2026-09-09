"use client";

import { GraphQLClient, gql } from "graphql-request";
import { useEffect, useState } from "react";
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
import { hoursSince, truncateAddress } from "@/lib/subgraph";
import { explorerAddressUrl, explorerTxUrl } from "@/lib/web3";

interface DepositTx {
  user: string;
  epoch: string;
  tokenIn: string;
  net: string;
  tokenIds: string[];
  filledLegs: number;
  skippedLegs: number;
  blockTimestamp: string;
  transactionHash: string;
}

interface TxResponse {
  liquidityAddeds: DepositTx[];
}

const RecentTxQuery = gql`
  query RecentDeposits($indexId: BigInt!, $first: Int!) {
    liquidityAddeds(
      first: $first
      orderBy: blockTimestamp
      orderDirection: desc
      where: { indexId: $indexId }
    ) {
      user
      epoch
      tokenIn
      net
      tokenIds
      filledLegs
      skippedLegs
      blockTimestamp
      transactionHash
    }
  }
`;

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
  const [rows, setRows] = useState<DepositTx[] | null>(null);
  const usdgDecimals = useReadContract({
    address: USDG_ADDRESS,
    abi: erc20Abi,
    functionName: "decimals",
  });

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUBGRAPH_URL;
    if (!url) return;
    const client = new GraphQLClient(url);
    let alive = true;
    async function load() {
      try {
        const data = await client.request<TxResponse>(RecentTxQuery, {
          indexId,
          first: 10,
        });
        if (alive) setRows(data.liquidityAddeds);
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
  }, [indexId]);

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
                    {hoursSince(tx.blockTimestamp)}
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
