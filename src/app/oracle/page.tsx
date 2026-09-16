import { Activity, ExternalLink } from "lucide-react";
import { MarketHydrator } from "@/components/market-hydrator";
import { Reveal } from "@/components/reveal";
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
import { getOracleStatus, hoursSince } from "@/lib/subgraph";
import { explorerTokenUrl } from "@/lib/web3";

export default async function OraclePage() {
  const live = await getOracleStatus();

  if (!live) {
    return (
      <Reveal>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-5xl font-bold tracking-tight">
              Oracle
            </h1>
            <Badge variant="secondary">Unavailable</Badge>
          </div>
          <p className="mt-2 text-muted-foreground">
            Weight oracle status and latest push.
          </p>
        </div>

        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Activity />
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

  const rows = live.tokens.map((t) => {
    const asset = getAsset(t.id);
    return {
      key: t.id,
      token: assetLabel(asset),
      name: asset.name,
      logo: asset.logo,
      explorer: explorerTokenUrl(t.id),
      weightBps: t.weightBps.toLocaleString("en-US"),
      share: `${(t.weightBps / 100).toFixed(1)}%`,
    };
  });

  const totalBps = live.tokens.reduce((sum, t) => sum + t.weightBps, 0);

  const stats = [
    {
      label: "Current Epoch",
      value: live.stats.epoch,
      note: `Pushed ${hoursSince(live.stats.lastUpdateAt)}`,
    },
    { label: "Push Schedule", value: "00:00", note: "UTC daily + retries" },
    {
      label: "Staleness Limit",
      value: "26 hours",
      note: `Last push ${hoursSince(live.stats.lastUpdateAt)}`,
    },
  ];

  return (
    <>
      <MarketHydrator indexes={null} oracle={live} />
      <Reveal>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-5xl font-bold tracking-tight">
              Oracle
            </h1>
            <Badge variant="default">Live</Badge>
          </div>
          <p className="mt-2 text-muted-foreground">
            Weight oracle status and latest push.
          </p>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <div className="grid gap-6 md:grid-cols-3">
          {stats.map((s) => (
            <Card key={s.label}>
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

      <Reveal delay={0.1}>
        <Card>
          <CardHeader>
            <CardTitle>Latest Global Weights</CardTitle>
            <CardDescription>
              {`On-chain total of ${totalBps.toLocaleString("en-US")} bps`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Activity />
                  </EmptyMedia>
                  <EmptyTitle>No weights yet</EmptyTitle>
                  <EmptyDescription>
                    The oracle has not pushed any weights.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Token</TableHead>
                    <TableHead>Weight (bps)</TableHead>
                    <TableHead>Share</TableHead>
                    <TableHead>Explorer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((w) => (
                    <TableRow key={w.key}>
                      <TableCell>
                        <span className="flex items-center gap-2">
                          <TokenIcon src={w.logo} label={w.token} />
                          <span className="flex min-w-0 flex-col">
                            <span className="font-medium text-primary">
                              {w.token}
                            </span>
                            {w.name ? (
                              <span className="max-w-56 truncate text-xs text-muted-foreground">
                                {w.name}
                              </span>
                            ) : null}
                          </span>
                        </span>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {w.weightBps}
                      </TableCell>
                      <TableCell className="tabular-nums">{w.share}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          nativeButton={false}
                          render={
                            <a
                              href={w.explorer}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <ExternalLink />
                              <span className="sr-only">
                                View {w.token} on explorer
                              </span>
                            </a>
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Reveal>
    </>
  );
}
