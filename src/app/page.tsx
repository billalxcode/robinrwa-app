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
import { assetLabel, getAsset } from "@/lib/assets";
import { buildLiveRows, buildMockRows } from "@/lib/index-rows";
import { mockIndexes } from "@/lib/mock";
import { getIndexesLive, getOracleStatus, hoursSince } from "@/lib/subgraph";

const steps = [
  {
    n: "01",
    title: "Deposit USDG Once",
    body: "Connect your wallet on Robinhood Chain and deposit USDG into eIndex.",
  },
  {
    n: "02",
    title: "Receive Weighted LP Positions",
    body: "Your deposit splits automatically into LP NFTs across RWA pools by oracle epoch volume weights.",
  },
  {
    n: "03",
    title: "Track or Remove Anytime",
    body: "Monitor positions in Portfolio, verify weights in Oracle, and remove liquidity whenever you choose.",
  },
];

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

  const topTokens = live
    ? (oracle?.tokens ?? []).slice(0, 5).map((t) => ({
        ticker: assetLabel(getAsset(t.id)),
        share: `${(t.weightBps / 100).toFixed(1)}%`,
        bps: t.weightBps,
      }))
    : (mockIndexes[0]?.tokens ?? []).map((t) => ({
        ticker: t.token,
        share: t.share,
        bps: t.weightBps,
      }));
  const maxBps = Math.max(1, ...topTokens.map((t) => t.bps));

  const featured = rows.find((r) => r.status === "Active") ?? rows[0];
  const depositHref = featured ? `/indexes/${featured.id}` : "/indexes";

  const stats = [
    {
      label: "Total Active",
      value: live ? String(list.totalActive) : String(rows.length),
      note: live ? `${list.totalCreated} created` : "Sample data",
    },
    {
      label: "Oracle Epoch",
      value: epoch ?? "1",
      note:
        live && oracle
          ? `Pushed ${hoursSince(oracle.stats.lastUpdateAt)}`
          : "Sample data",
    },
    {
      label: "Tracked Tokens",
      value: live && oracle ? String(oracle.stats.knownTokenCount) : "3",
      note:
        live && oracle ? `${oracle.stats.pushCount} pushes` : "Sample basket",
    },
    {
      label: "Largest Weight",
      value: topTokens[0] ? topTokens[0].share : "—",
      note: topTokens[0] ? topTokens[0].ticker : "No weights yet",
    },
  ];

  return (
    <>
      <div className="flex flex-col items-center gap-6 py-8 text-center md:py-16">
        <Badge variant="outline">
          <span className="size-1.5 rounded-full bg-primary" />
          RWA Index on Robinhood Chain ·{" "}
          {live ? `Epoch ${epoch}` : "Sample data"}
        </Badge>
        <h1 className="max-w-3xl font-heading text-5xl font-bold">
          One Deposit. <span className="text-primary">Weighted RWA</span>{" "}
          Liquidity.
        </h1>
        <p className="max-w-xl text-muted-foreground">
          Deposit USDG once and hold volume-weighted LP positions across RWA
          pools.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button nativeButton={false} render={<Link href={depositHref} />}>
            Deposit USDG
            <ArrowRight data-icon="inline-end" />
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/indexes" />}
          >
            Explore Indexes
          </Button>
        </div>
      </div>

      {featured && (
        <Card className="rounded-xl">
          <CardHeader>
            <CardDescription>Featured index</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {featured.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-1.5">
                {featured.tickers.map((c) => (
                  <Badge key={c} variant="outline">
                    {c}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Top weight{" "}
                <span className="font-medium tabular-nums text-foreground">
                  {featured.topWeight}
                </span>{" "}
                · Epoch {featured.epoch}
              </p>
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href={`/indexes/${featured.id}`} />}
              >
                Open index
                <ArrowRight data-icon="inline-end" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="rounded-xl">
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

      <div>
        <h2 className="font-heading text-2xl font-bold">How it works</h2>
        <p className="mt-2 text-muted-foreground">
          Three steps from deposit to weighted positions.
        </p>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <Card key={s.n} className="rounded-xl">
              <CardHeader>
                <span className="flex size-8 items-center justify-center rounded-full bg-muted text-sm font-semibold tabular-nums text-foreground">
                  {s.n}
                </span>
                <CardTitle>{s.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{s.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Top Weights</CardTitle>
          <CardDescription>
            {live ? `Oracle epoch ${epoch}.` : "Sample weights."}{" "}
            <Link href="/oracle" className="text-primary hover:underline">
              View oracle
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {topTokens.map((t) => (
              <div key={t.ticker} className="flex items-center gap-4">
                <Badge variant="outline" className="w-20 justify-center">
                  {t.ticker}
                </Badge>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(t.bps / maxBps) * 100}%` }}
                  />
                </div>
                <span className="w-14 text-right text-sm font-medium tabular-nums">
                  {t.share}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
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
        </CardContent>
      </Card>

      <div className="flex flex-col items-center gap-6 py-8 text-center md:py-12">
        <h2 className="max-w-2xl font-heading text-4xl font-bold md:text-5xl">
          Start Your RWA Index Position
        </h2>
        <p className="max-w-md text-muted-foreground">
          Deposit USDG once to hold weighted RWA liquidity you can track and
          exit anytime.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button nativeButton={false} render={<Link href={depositHref} />}>
            Deposit USDG
            <ArrowRight data-icon="inline-end" />
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/indexes" />}
          >
            Explore Indexes
          </Button>
        </div>
        <p className="max-w-md text-xs text-muted-foreground">
          RWA tokens and liquidity positions carry market, smart-contract, and
          oracle risks, including possible loss of principal.
        </p>
      </div>
    </>
  );
}
