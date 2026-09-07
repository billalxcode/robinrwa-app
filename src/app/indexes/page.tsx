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
import { mockIndexes } from "@/lib/mock";

export default function IndexesPage() {
  return (
    <>
      <div>
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-5xl font-bold tracking-tight">
            Index
          </h1>
          <Badge variant="secondary">Contoh</Badge>
        </div>
        <p className="mt-2 text-muted-foreground">
          Daftar index eIndex. Satu deposit dipecah per bobot volume global,
          posisi NFT langsung ke wallet pengguna.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Semua Index</CardTitle>
          <CardDescription>
            Data contoh untuk preview UI — bukan data on-chain.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Index</TableHead>
                <TableHead>Simbol</TableHead>
                <TableHead>Konstituen</TableHead>
                <TableHead>Bobot Teratas</TableHead>
                <TableHead>Epoch</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockIndexes.map((idx) => (
                <TableRow key={idx.id}>
                  <TableCell className="font-medium text-primary">
                    {idx.name}
                  </TableCell>
                  <TableCell>{idx.symbol}</TableCell>
                  <TableCell>{idx.constituents.join(" · ")}</TableCell>
                  <TableCell className="tabular-nums">
                    {idx.topWeight}
                  </TableCell>
                  <TableCell className="tabular-nums">{idx.epoch}</TableCell>
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
