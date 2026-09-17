import { Activity, ArrowRight, ChartLine } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { IndexImage } from "@/components/index-image";
import { MarketHydrator } from "@/components/market-hydrator";
import { Reveal } from "@/components/reveal";
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
import { assetLabel, getAsset } from "@/lib/assets";
import { buildLiveRows } from "@/lib/index-rows";
import { getIndexesLive, getOracleStatus, hoursSince } from "@/lib/subgraph";

const steps = [
  {
    n: "01",
    title: "Deposit USDG Once",
    body: "Connect your wallet on Robinhood Chain and deposit USDG into eIndex.",
    image: "/assets/Imagery/ascii-art%20(1).png",
    alt: "Balanced scales illustration",
  },
  {
    n: "02",
    title: "Receive Weighted LP Positions",
    body: "Your deposit splits automatically into LP NFTs across RWA pools by oracle epoch volume weights.",
    image: "/assets/Imagery/ascii-art%20(2).png",
    alt: "Figure holding a balance illustration",
  },
  {
    n: "03",
    title: "Track or Remove Anytime",
    body: "Monitor positions in Portfolio, verify weights in Oracle, and remove liquidity whenever you choose.",
    image: "/assets/Imagery/ascii-art.png",
    alt: "Justice figure illustration",
  },
];

export default async function Home() {
  const [list, oracle] = await Promise.all([
    getIndexesLive(),
    getOracleStatus(),
  ]);
  const unavailable = list === null || oracle === null;
  const weights = new Map(
    (oracle?.tokens ?? []).map((t) => [t.id.toLowerCase(), t.weightBps]),
  );
  const epoch = oracle?.stats.epoch ?? null;
  const rows = unavailable
    ? []
    : buildLiveRows(list?.indexes ?? [], weights, epoch ?? "—");

  const topTokens = unavailable
    ? []
    : (oracle?.tokens ?? []).slice(0, 5).map((t) => ({
        ticker: assetLabel(getAsset(t.id)),
        share: `${(t.weightBps / 100).toFixed(1)}%`,
        bps: t.weightBps,
      }));
  const maxBps = Math.max(1, ...topTokens.map((t) => t.bps));

  const featured = rows.find((r) => r.status === "Active") ?? rows[0];
  const depositHref = featured ? `/indexes/${featured.id}` : "/indexes";

  const stats = [
    {
      label: "Total Active",
      value: unavailable ? "—" : String(list?.totalActive ?? 0),
      note: unavailable
        ? "Subgraph unavailable"
        : `${list?.totalCreated ?? 0} created`,
    },
    {
      label: "Oracle Epoch",
      value: epoch ?? "—",
      note: unavailable
        ? "Subgraph unavailable"
        : oracle
          ? `Pushed ${hoursSince(oracle.stats.lastUpdateAt)}`
          : "No data yet",
    },
    {
      label: "Tracked Tokens",
      value: unavailable ? "—" : String(oracle?.stats.knownTokenCount ?? 0),
      note: unavailable
        ? "Subgraph unavailable"
        : oracle
          ? `${oracle.stats.pushCount} pushes`
          : "No data yet",
    },
    {
      label: "Largest Weight",
      value: topTokens[0] ? topTokens[0].share : "—",
      note: topTokens[0] ? topTokens[0].ticker : "No weights yet",
    },
  ];

  return (
    <>
      <MarketHydrator indexes={list} oracle={oracle} />
      <Reveal className="flex flex-col items-center gap-6 py-8 text-center md:py-16">
        <Badge
          variant={unavailable || rows.length === 0 ? "secondary" : "default"}
        >
          <span className="size-1.5 rounded-full bg-primary" />
          RWA Index on Robinhood Chain{" "}
          {unavailable
            ? "(Subgraph unavailable)"
            : rows.length === 0
              ? "(No indexes yet)"
              : `(Epoch ${epoch})`}
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
        <Image
          src="/assets/New%20Branding/Artboard%203-hero.jpg"
          alt="Index Pool brand banner"
          width={1500}
          height={1000}
          priority
          sizes="(max-width: 1200px) 100vw, 1200px"
          className="h-auto w-full rounded-xl border border-border"
        />
      </Reveal>

      {featured && (
        <Reveal delay={0.05}>
          <Card className="rounded-xl">
            <CardHeader>
              <div className="flex items-center gap-4">
                <IndexImage
                  cid={featured.imageCID}
                  alt={featured.name}
                  className="size-14 rounded-2xl"
                />
                <div>
                  <CardDescription>Featured index</CardDescription>
                  <CardTitle className="text-3xl tabular-nums">
                    {featured.name}
                  </CardTitle>
                </div>
              </div>
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
                  for epoch {featured.epoch}
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
        </Reveal>
      )}

      <Reveal>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label} className="rounded-xl">
              <CardHeader>
                <CardDescription>{s.label}</CardDescription>
                <CardTitle className="text-3xl tabular-nums">
                  {s.value}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{s.note}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Reveal>

      <Reveal>
        <h2 className="font-heading text-2xl font-bold">How it works</h2>
        <p className="mt-2 text-muted-foreground">
          Three steps from deposit to weighted positions.
        </p>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <Card key={s.n} className="overflow-hidden rounded-xl">
              <div className="relative h-36 w-full">
                <Image
                  src={s.image}
                  alt={s.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover object-top"
                />
              </div>
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
      </Reveal>

      <Reveal>
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Top Weights</CardTitle>
            <CardDescription>
              {unavailable
                ? "Subgraph unavailable."
                : `Oracle epoch ${epoch ?? "—"}.`}{" "}
              <Link href="/oracle" className="text-primary hover:underline">
                View oracle
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topTokens.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Activity />
                  </EmptyMedia>
                  <EmptyTitle>No weights yet</EmptyTitle>
                  <EmptyDescription>
                    {unavailable
                      ? "The subgraph is unreachable."
                      : "The oracle has not pushed any weights."}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
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
            )}
          </CardContent>
        </Card>
      </Reveal>

      <Reveal>
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Registered Indexes</CardTitle>
            <CardDescription>
              {unavailable ? "Subgraph unavailable." : "On-chain."}
            </CardDescription>
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
                    {unavailable
                      ? "The subgraph is unreachable."
                      : "No index has been created on-chain."}
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
                      <TableCell className="tabular-nums">
                        {row.epoch}
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
            )}
          </CardContent>
        </Card>
      </Reveal>

      <Reveal className="flex flex-col items-center gap-6 py-8 text-center md:py-12">
        <Image
          src="/assets/New%20Branding/Artboard%204-cta.jpg"
          alt="One Deposit. Infinite Diversification."
          width={1500}
          height={500}
          sizes="(max-width: 1200px) 100vw, 1200px"
          className="h-auto w-full rounded-xl border border-border"
        />
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
      </Reveal>
    </>
  );
}
