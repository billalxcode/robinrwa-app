import { ArrowRight } from "lucide-react";
import Link from "next/link";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buildLiveRows, buildMockRows } from "@/lib/index-rows";
import { getIndexesLive, getOracleStatus, hoursSince } from "@/lib/subgraph";

export default async function Home() {
  const [list, oracle] = await Promise.all([
    getIndexesLive(),
    getOracleStatus(),
  ]);
  const live = list !== null && oracle !== null;
  const weights = new Map(
    (oracle?.tokens ?? []).map((t) => [t.id.toLowerCase(), t.weightBps]),
  );
  const epoch = oracle?.stats.epoch ?? null;
  const rows = live
    ? buildLiveRows(list.indexes, weights, epoch ?? "—")
    : buildMockRows();

  const stats = [
    {
      label: "Total Indexes",
      value: live ? String(list.totalActive) : "3",
      note: live ? `${list.totalCreated} created` : "2 active, 1 inactive",
    },
    { label: "My Positions", value: "0", note: "Connect a wallet to start" },
    {
      label: "Oracle Epoch",
      value: epoch ?? "1",
      note:
        live && oracle
          ? `Pushed ${hoursSince(oracle.stats.lastUpdateAt)}`
          : "Sample data",
    },
    { label: "Network", value: "4663", note: "Robinhood Chain" },
  ];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-5xl font-bold tracking-tight">
              Overview
            </h1>
            <Badge variant={live ? "default" : "secondary"}>
              {live ? "Live" : "Sample"}
            </Badge>
          </div>
          <p className="mt-2 text-muted-foreground">
            One deposit split by volume weight into LP positions.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/indexes" />}>
          Explore Indexes
          <ArrowRight data-icon="inline-end" />
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader>
              <CardDescription>{s.label}</CardDescription>
              <CardTitle className="text-3xl tabular-nums">{s.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{s.note}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered Indexes</CardTitle>
          <CardDescription>
            {live ? "On-chain." : "Sample data."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Index</TableHead>
                <TableHead>Constituents</TableHead>
                <TableHead>Top Weight</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium text-primary">
                    <Link
                      href={`/indexes/${row.id}`}
                      className="hover:underline"
                    >
                      {row.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span className="flex flex-wrap gap-1.5">
                      {row.tickers.map((c) => (
                        <Badge key={c} variant="outline">
                          {c}
                        </Badge>
                      ))}
                    </span>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {row.topWeight}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        row.status === "Active" ? "default" : "secondary"
                      }
                    >
                      {row.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
