import { notFound } from "next/navigation";
import { ProvideLiquidityModal } from "@/components/provide-liquidity-modal";
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
import { getMockIndex } from "@/lib/mock";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

export default async function IndexDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const index = getMockIndex(id);
  if (!index) notFound();

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
        <ProvideLiquidityModal index={index} />
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
            <CardDescription>
              Epoch {index.epoch} · total 10,000 bps
            </CardDescription>
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
          <CardDescription>
            {index.tokens.length} constituents · {index.network}
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
