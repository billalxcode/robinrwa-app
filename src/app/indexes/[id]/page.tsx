import { notFound } from "next/navigation";
import { ProvideLiquidityModal } from "@/components/provide-liquidity-modal";
import { TokenIcon } from "@/components/token-icon";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { assetLabel, getAsset } from "@/lib/assets";
import { weightMap } from "@/lib/index-rows";
import { getMockIndex, type MockIndex } from "@/lib/mock";
import {
  formatDate,
  getIndexDetailLive,
  getOracleStatus,
  hoursSince,
  type LiveIndexDetail,
} from "@/lib/subgraph";

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

export default async function IndexDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [live, oracle] = await Promise.all([
    getIndexDetailLive(id),
    getOracleStatus(),
  ]);
  if (live) {
    const weights = weightMap(oracle?.tokens ?? []);
    const epoch = oracle?.stats.epoch ?? null;
    return <LiveBody data={live} weights={weights} epoch={epoch} />;
  }
  const index = getMockIndex(id);
  if (!index) notFound();
  return <MockBody index={index} />;
}

function LiveBody({
  data,
  weights,
  epoch,
}: {
  data: LiveIndexDetail;
  weights: Map<string, number>;
  epoch: string | null;
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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
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
            logo: l.logo,
          }))}
        />
      </div>

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
                    {`${latest.transactionHash.slice(0, 10)}…${latest.transactionHash.slice(-4)}`}
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
    </>
  );
}

function MockBody({ index }: { index: MockIndex }) {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-5xl font-bold tracking-tight">
              {index.name}
            </h1>
            <Badge
              variant={index.status === "Active" ? "default" : "secondary"}
            >
              {index.status}
            </Badge>
            <Badge variant="outline">{index.symbol}</Badge>
          </div>
          <p className="mt-2 text-muted-foreground">{index.description}</p>
        </div>
        <ProvideLiquidityModal name={index.name} tokens={index.tokens} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "TVL", value: index.tvl, note: "Liquidity in all legs" },
          {
            label: "24h Volume",
            value: index.volume24h,
            note: "Swap volume, last 24 hours",
          },
          {
            label: "30d Volume",
            value: index.volume30d,
            note: "Swap volume, last 30 days",
          },
          {
            label: "APY",
            value: index.apy,
            note: "LP fees, trailing 30 days",
          },
        ].map((s) => (
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

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Index Information</CardTitle>
            <CardDescription>Sample data.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <InfoRow label="Created By" value={index.createdBy} />
            <Separator />
            <InfoRow label="Network" value={index.network} />
            <Separator />
            <InfoRow label="Protocol" value={index.protocol} />
            <Separator />
            <InfoRow label="Distributor Fee" value={index.fee} />
            <Separator />
            <InfoRow label="Epoch" value={String(index.epoch)} />
            <Separator />
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Last Transaction
              </p>
              <p className="mt-1 font-mono text-sm">
                {`${index.lastTxHash.slice(0, 10)}…${index.lastTxHash.slice(-4)}`}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {index.lastTxTime}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Weight Distribution</CardTitle>
            <CardDescription>Total 10,000 bps.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {index.tokens.map((t) => (
              <div key={t.token} className="flex items-center gap-3">
                <Badge variant="outline" className="w-20 justify-center">
                  {t.token}
                </Badge>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${t.weightBps / 100}%` }}
                  />
                </div>
                <span className="w-14 text-right text-sm tabular-nums">
                  {t.share}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tokens in This Index</CardTitle>
          <CardDescription>{index.network}.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Token</TableHead>
                <TableHead>Weight (bps)</TableHead>
                <TableHead>Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {index.tokens.map((t) => (
                <TableRow key={t.token}>
                  <TableCell>
                    <Badge variant="outline">{t.token}</Badge>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {t.weightBps.toLocaleString("en-US")}
                  </TableCell>
                  <TableCell className="tabular-nums">{t.share}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
