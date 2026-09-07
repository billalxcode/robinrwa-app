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
  { label: "Epoch Berjalan", value: "1", note: "Contoh — epoch = versi bobot" },
  { label: "Jadwal Push", value: "00:00", note: "UTC, tiap 24 jam + retry" },
  { label: "Batas Basi", value: "26 jam", note: "Distribute revert bila basi" },
];

export default function OraclePage() {
  return (
    <>
      <div>
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-4xl font-medium">Oracle</h1>
          <Badge variant="secondary">Contoh</Badge>
        </div>
        <p className="mt-2 text-muted-foreground">
          Status oracle bobot volume — service Go pemegang UPDATER_ROLE.
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
          <CardTitle>Bobot Global Terakhir</CardTitle>
          <CardDescription>
            Contoh dari SPEC — total selalu 10.000 bps.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Token</TableHead>
                <TableHead>Bobot (bps)</TableHead>
                <TableHead>Porsi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockWeights.map((w) => (
                <TableRow key={w.token}>
                  <TableCell className="font-medium text-primary">
                    {w.token}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {w.weightBps.toLocaleString("id-ID")}
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
