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
        <h1 className="font-heading text-5xl font-bold tracking-tight">
          Positions
        </h1>
        <p className="mt-2 text-muted-foreground">Your LP NFT positions.</p>
      </div>

      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Wallet />
          </EmptyMedia>
          <EmptyTitle>No positions yet</EmptyTitle>
          <EmptyDescription>
            Connect a wallet and deposit once to open positions.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button nativeButton={false} render={<Link href="/indexes" />}>
            Explore Indexes
            <ArrowRight data-icon="inline-end" />
          </Button>
        </EmptyContent>
      </Empty>
    </>
  );
}
