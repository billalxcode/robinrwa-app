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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { assetLabel, getAsset, PLACEHOLDER_LOGO } from "@/lib/assets";
import { mockWeights } from "@/lib/mock";
import { getOracleStatus, hoursSince } from "@/lib/subgraph";

interface WeightRow {
  key: string;
  token: string;
  logo: string;
  weightBps: string;
  share: string;
}

export default async function OraclePage() {
  const live = await getOracleStatus();

  const rows: WeightRow[] = live
    ? live.tokens.map((t) => {
        const asset = getAsset(t.id);
        return {
          key: t.id,
          token: assetLabel(asset),
          logo: asset.logo,
          weightBps: t.weightBps.toLocaleString("en-US"),
          share: `${(t.weightBps / 100).toFixed(1)}%`,
        };
      })
    : mockWeights.map((w) => ({
        key: w.token,
        token: w.token,
        logo: PLACEHOLDER_LOGO,
        weightBps: w.weightBps.toLocaleString("en-US"),
        share: w.share,
      }));

  const epoch = live ? live.stats.epoch : "1";
  const pushed = live ? hoursSince(live.stats.lastUpdateAt) : null;

  const stats = [
    {
      label: "Current Epoch",
      value: epoch,
      note: live ? `Pushed ${pushed}` : "Sample data",
    },
    { label: "Push Schedule", value: "00:00", note: "UTC daily + retries" },
    {
      label: "Staleness Limit",
      value: "26 hours",
      note: live ? `Last push ${pushed}` : "Stale quotes revert distribute",
    },
  ];

  return (
    <>
      <div>
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-5xl font-bold tracking-tight">
            Oracle
          </h1>
          <Badge variant={live ? "default" : "secondary"}>
            {live ? "Live" : "Sample"}
          </Badge>
        </div>
        <p className="mt-2 text-muted-foreground">
          Weight oracle status and latest push.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
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
          <CardTitle>Latest Global Weights</CardTitle>
          <CardDescription>
            {live
              ? `On-chain · total ${live.tokens
                  .reduce((sum, t) => sum + t.weightBps, 0)
                  .toLocaleString("en-US")} bps`
              : "SPEC sample. Total: 10,000 bps."}
          </CardDescription>
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
              {rows.map((w) => (
                <TableRow key={w.key}>
                  <TableCell className="font-medium text-primary">
                    <span className="flex items-center gap-2">
                      <TokenIcon src={w.logo} label={w.token} />
                      {w.token}
                    </span>
                  </TableCell>
                  <TableCell className="tabular-nums">{w.weightBps}</TableCell>
                  <TableCell className="tabular-nums">{w.share}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
