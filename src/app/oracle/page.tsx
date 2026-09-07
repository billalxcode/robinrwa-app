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
import { mockWeights } from "@/lib/mock";

const stats = [
  {
    label: "Current Epoch",
    value: "1",
    note: "Sample — epoch = weight version",
  },
  { label: "Push Schedule", value: "00:00", note: "UTC, every 24h + retries" },
  {
    label: "Staleness Limit",
    value: "26 hours",
    note: "Distribute reverts when stale",
  },
];

export default function OraclePage() {
  return (
    <>
      <div>
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-5xl font-bold tracking-tight">
            Oracle
          </h1>
          <Badge variant="secondary">Sample</Badge>
        </div>
        <p className="mt-2 text-muted-foreground">
          Volume-weight oracle status — the Go service holding UPDATER_ROLE.
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
            Sample from the SPEC — total is always 10,000 bps.
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
              {mockWeights.map((w) => (
                <TableRow key={w.token}>
                  <TableCell className="font-medium text-primary">
                    {w.token}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {w.weightBps.toLocaleString("en-US")}
                  </TableCell>
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
