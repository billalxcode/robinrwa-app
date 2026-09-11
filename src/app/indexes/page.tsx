import { ChartLine } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buildLiveRows } from "@/lib/index-rows";
import { getIndexesLive, getOracleStatus } from "@/lib/subgraph";

export default async function IndexesPage() {
  const [list, oracle] = await Promise.all([
    getIndexesLive(),
    getOracleStatus(),
  ]);
  if (list === null || oracle === null) {
    return (
      <>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-5xl font-bold tracking-tight">
              Index
            </h1>
            <Badge variant="secondary">Unavailable</Badge>
          </div>
          <p className="mt-2 text-muted-foreground">
            One deposit per index, split by global volume weight.
          </p>
        </div>

        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ChartLine />
            </EmptyMedia>
            <EmptyTitle>Data unavailable</EmptyTitle>
            <EmptyDescription>
              The subgraph is unreachable. Try again later.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </>
    );
  }

  const weights = new Map(
    oracle.tokens.map((t) => [t.id.toLowerCase(), t.weightBps]),
  );
  const rows = buildLiveRows(list.indexes, weights, oracle.stats.epoch);

  return (
    <>
      <div>
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-5xl font-bold tracking-tight">
            Index
          </h1>
          <Badge variant="default">Live</Badge>
        </div>
        <p className="mt-2 text-muted-foreground">
          One deposit per index, split by global volume weight.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Indexes</CardTitle>
          <CardDescription>On-chain.</CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ChartLine />
                </EmptyMedia>
                <EmptyTitle>No indexes yet</EmptyTitle>
                <EmptyDescription>
                  No index has been created on-chain.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Index</TableHead>
                  <TableHead>Constituents</TableHead>
                  <TableHead>Top Weight</TableHead>
                  <TableHead>Epoch</TableHead>
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
                    <TableCell className="tabular-nums">{row.epoch}</TableCell>
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
          )}
        </CardContent>
      </Card>
    </>
  );
}
