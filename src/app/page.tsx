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
import { mockIndexes } from "@/lib/mock";

const stats = [
  { label: "Total Index", value: "3", note: "2 aktif · 1 nonaktif" },
  { label: "Posisi Saya", value: "0", note: "Hubungkan wallet untuk mulai" },
  { label: "Epoch Oracle", value: "1", note: "Bobot diperbarui 1×/24 jam" },
  { label: "Jaringan", value: "4663", note: "Robinhood Chain" },
];

export default function Home() {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-4xl font-medium">Ringkasan</h1>
            <Badge variant="secondary">Contoh</Badge>
          </div>
          <p className="mt-2 text-muted-foreground">
            Satu deposit, posisi likuiditas terdiversifikasi per bobot volume.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/indexes" />}>
          Jelajahi Index
          <ArrowRight data-icon="inline-end" />
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
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
          <CardTitle>Index Terdaftar</CardTitle>
          <CardDescription>
            Pratinjau — data contoh, bukan data on-chain.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Index</TableHead>
                <TableHead>Konstituen</TableHead>
                <TableHead>Bobot Teratas</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockIndexes.map((idx) => (
                <TableRow key={idx.id}>
                  <TableCell className="font-medium text-primary">
                    {idx.name}
                  </TableCell>
                  <TableCell>{idx.constituents.join(" · ")}</TableCell>
                  <TableCell className="tabular-nums">
                    {idx.topWeight}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={idx.status === "Aktif" ? "default" : "secondary"}
                    >
                      {idx.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
