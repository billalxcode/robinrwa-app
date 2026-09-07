import { ArrowRight, Wallet } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function PositionsPage() {
  return (
    <>
      <div>
        <h1 className="font-heading text-4xl font-medium">Positions</h1>
        <p className="mt-2 text-muted-foreground">
          Posisi likuiditas NFT milik wallet yang terhubung.
        </p>
      </div>

      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Wallet />
          </EmptyMedia>
          <EmptyTitle>Belum ada posisi</EmptyTitle>
          <EmptyDescription>
            Wallet belum terhubung atau belum ada deposit. Jelajahi index lalu
            lakukan deposit sekali untuk membuka posisi per leg.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button nativeButton={false} render={<Link href="/indexes" />}>
            Jelajahi Index
            <ArrowRight data-icon="inline-end" />
          </Button>
        </EmptyContent>
      </Empty>
    </>
  );
}
