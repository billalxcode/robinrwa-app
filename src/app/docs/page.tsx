import { BookOpenText } from "lucide-react";
import type { Metadata } from "next";
import { Reveal } from "@/components/reveal";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export const metadata: Metadata = {
  title: "Documentation",
  description: "Guides and contract specs for Index Pool.",
  alternates: { canonical: "/docs" },
  robots: { index: false, follow: true },
};

export default function DocsPage() {
  return (
    <>
      <Reveal>
        <div>
          <h1 className="font-heading text-5xl font-bold tracking-tight">
            Documentation
          </h1>
          <p className="mt-2 text-muted-foreground">
            Guides and contract specs for RobinRWA.
          </p>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BookOpenText />
            </EmptyMedia>
            <EmptyTitle>Coming Soon</EmptyTitle>
            <EmptyDescription>
              Documentation is being written. Check back later.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </Reveal>
    </>
  );
}
