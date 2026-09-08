"use client";

import { GraphQLClient, gql } from "graphql-request";
import { useEffect, useState } from "react";
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
import { hoursSince, truncateAddress } from "@/lib/subgraph";

interface DepositTx {
  user: string;
  epoch: string;
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
      tokenIds
      filledLegs
      skippedLegs
      blockTimestamp
      transactionHash
    }
  }
`;

const REFRESH_MS = 10_000;

export function RecentTransactions({ indexId }: { indexId: string }) {
  const [rows, setRows] = useState<DepositTx[] | null>(null);

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
                <TableHead>Epoch</TableHead>
                <TableHead>Legs</TableHead>
                <TableHead>Age</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((tx) => (
                <TableRow key={tx.transactionHash}>
                  <TableCell className="font-mono text-xs">
                    {truncateAddress(tx.transactionHash)}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {truncateAddress(tx.user)}
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
