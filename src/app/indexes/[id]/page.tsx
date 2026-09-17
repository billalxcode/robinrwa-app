import { ChartLine } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IndexImage } from "@/components/index-image";
import { ProvideLiquidityModal } from "@/components/provide-liquidity-modal";
import { RecentTransactions } from "@/components/recent-transactions";
import { Reveal } from "@/components/reveal";
import { TokenIcon } from "@/components/token-icon";
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
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VolumeChart, type VolumePoint } from "@/components/volume-chart";
import { assetLabel, getAsset } from "@/lib/assets";
import { isIndexHidden, weightMap } from "@/lib/index-rows";
import {
  formatDate,
  getIndexDetailLive,
  getIndexesLive,
  getIndexVolume,
  getOracleStatus,
  hoursSince,
  type LiveIndexDetail,
} from "@/lib/subgraph";
import { explorerTxUrl, getUsdgDecimals } from "@/lib/web3";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  );
}

function dayToDate(day: string): string {
  const d = new Date(Number(day) * 86400 * 1000);
  const month = `${d.getUTCMonth() + 1}`.padStart(2, "0");
  const date = `${d.getUTCDate()}`.padStart(2, "0");
  return `${d.getUTCFullYear()}-${month}-${date}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (isIndexHidden(id)) return { title: "Index" };
  const detail = await getIndexDetailLive(id).catch(() => null);
  if (!detail) return { title: "Index" };
  return {
    title: detail.index.name,
    description: `Deposit USDG into ${detail.index.name} and hold volume-weighted RWA LP positions on Robinhood Chain.`,
    alternates: { canonical: `/indexes/${id}` },
  };
}

export default async function IndexDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (isIndexHidden(id)) notFound();
  const [live, oracle, snapshots, usdgDecimals] = await Promise.all([
    getIndexDetailLive(id),
    getOracleStatus(),
    getIndexVolume(id),
    getUsdgDecimals(),
  ]);
  if (live) {
    const weights = weightMap(oracle?.tokens ?? []);
    const epoch = oracle?.stats.epoch ?? null;
    const volume: VolumePoint[] =
      usdgDecimals === null
        ? []
        : (snapshots ?? []).map((s) => ({
            time: dayToDate(s.day),
            value: Number(BigInt(s.volumeUSDG)) / 10 ** (usdgDecimals ?? 0),
          }));
    return (
      <LiveBody data={live} weights={weights} epoch={epoch} volume={volume} />
    );
  }
  // Detail missing: subgraph down (error state) vs unknown id (404).
  const list = await getIndexesLive();
  if (list === null) {
    return (
      <Reveal>
        <div>
          <h1 className="font-heading text-5xl font-bold tracking-tight">
            Index
          </h1>
          <p className="mt-2 text-muted-foreground">
            Index detail from on-chain data.
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
      </Reveal>
    );
  }
  notFound();
}

function LiveBody({
  data,
  weights,
  epoch,
  volume,
}: {
  data: LiveIndexDetail;
  weights: Map<string, number>;
  epoch: string | null;
  volume: VolumePoint[];
}) {
  const { index, legs, deposits } = data;
  const legRows = legs.map((leg) => {
    const asset = getAsset(leg.token);
    const quote = getAsset(leg.quote);
    const w = weights.get(leg.token.toLowerCase()) ?? 0;
    return {
      ...leg,
      ticker: assetLabel(asset),
      name: asset.name,
      logo: asset.logo,
      quoteTicker: quote.ticker ?? leg.quote.slice(0, 6),
      weightBps: w,
      share: `${(w / 100).toFixed(1)}%`,
    };
  });
  const top = Math.max(0, ...legRows.map((l) => l.weightBps));
  const latest = deposits[0] ?? null;
  const quotes = [...new Set(legRows.map((l) => l.quoteTicker))];

  return (
    <>
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <IndexImage
                cid={index.imageCID}
                alt={index.name}
                className="size-14 rounded-2xl"
              />
              <h1 className="font-heading text-5xl font-bold tracking-tight">
                {index.name}
              </h1>
              <Badge variant={index.exists ? "default" : "secondary"}>
                {index.exists ? "Active" : "Inactive"}
              </Badge>
              <Badge variant="outline">{index.symbol}</Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge variant="outline">{index.legCount} legs</Badge>
              <Badge variant="outline">
                Created {formatDate(index.createdAt)}
              </Badge>
            </div>
          </div>
          <ProvideLiquidityModal
            name={index.name}
            indexId={index.id}
            tokens={legRows.map((l) => ({
              token: l.ticker,
              weightBps: l.weightBps,
              share: l.share,
            }))}
            legs={legRows.map((l) => ({
              token: l.ticker,
              quote: l.quoteTicker,
              fee: l.fee,
              tickSpacing: l.tickSpacing,
              hooks: l.hooks,
              logo: l.logo,
              tokenAddress: l.token,
              quoteAddress: l.quote,
            }))}
          />
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Legs"
            value={String(index.legCount)}
            note={
              quotes.length > 1
                ? `${quotes.length} quote tokens`
                : `${quotes[0] ?? "—"} quotes`
            }
          />
          <StatCard
            label="Top Weight"
            value={`${(top / 100).toFixed(1)}%`}
            note={`Epoch ${epoch ?? "—"}`}
          />
          <StatCard label="Epoch" value={epoch ?? "—"} note="Weight version" />
          <StatCard
            label="Deposits"
            value={String(deposits.length)}
            note={deposits.length >= 100 ? "First 100 shown" : "On-chain"}
          />
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Index Information</CardTitle>
              <CardDescription>On-chain.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <InfoRow label="Network" value="Robinhood Chain (4663)" />
              <Separator />
              <InfoRow label="Protocol" value="Uniswap v4" />
              <Separator />
              <InfoRow label="Created" value={formatDate(index.createdAt)} />
              <Separator />
              <InfoRow label="Epoch" value={epoch ?? "—"} />
              <Separator />
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Last Deposit
                </p>
                {latest ? (
                  <>
                    <p className="mt-1 font-mono text-sm">
                      <a
                        href={explorerTxUrl(latest.transactionHash)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        {`${latest.transactionHash.slice(0, 10)}…${latest.transactionHash.slice(-4)}`}
                      </a>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {hoursSince(latest.blockTimestamp)}
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-sm font-medium">No deposits yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Weight Distribution</CardTitle>
              <CardDescription>Total 10,000 bps.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {legRows.map((l) => (
                <div
                  key={`${l.legIndex}-${l.token}`}
                  className="flex items-center gap-3"
                >
                  <Badge variant="outline" className="w-20 justify-center">
                    {l.ticker}
                  </Badge>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${l.weightBps / 100}%` }}
                    />
                  </div>
                  <span className="w-14 text-right text-sm tabular-nums">
                    {l.share}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <Card>
          <CardHeader>
            <CardTitle>Tokens in This Index</CardTitle>
            <CardDescription>Uniswap v4 pools.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Token</TableHead>
                  <TableHead>Quote</TableHead>
                  <TableHead>Pool Fee</TableHead>
                  <TableHead>Tick Spacing</TableHead>
                  <TableHead>Weight (bps)</TableHead>
                  <TableHead>Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {legRows.map((l) => (
                  <TableRow key={`${l.legIndex}-${l.token}`}>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        <TokenIcon src={l.logo} label={l.ticker} />
                        <span className="flex min-w-0 flex-col">
                          <span className="font-medium text-primary">
                            {l.ticker}
                          </span>
                          {l.name ? (
                            <span className="max-w-56 truncate text-xs text-muted-foreground">
                              {l.name}
                            </span>
                          ) : null}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{l.quoteTicker}</Badge>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {(l.fee / 10000).toFixed(2)}%
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {l.tickSpacing}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {l.weightBps.toLocaleString("en-US")}
                    </TableCell>
                    <TableCell className="tabular-nums">{l.share}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Reveal>

      <Reveal delay={0.1}>
        <Card>
          <CardHeader>
            <CardTitle>Volume</CardTitle>
            <CardDescription>Daily deposit volume, USDG.</CardDescription>
          </CardHeader>
          <CardContent>
            {volume.length >= 2 ? (
              <VolumeChart data={volume} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Not enough history yet.
              </p>
            )}
          </CardContent>
        </Card>
      </Reveal>

      <Reveal delay={0.15}>
        <RecentTransactions indexId={index.id} />
      </Reveal>
    </>
  );
}
