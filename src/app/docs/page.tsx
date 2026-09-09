import { BookOpenText } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function DocsPage() {
  return (
    <>
      <div>
        <h1 className="font-heading text-5xl font-bold tracking-tight">
          Documentation
        </h1>
        <p className="mt-2 text-muted-foreground">
          Guides and contract specs for RobinRWA.
        </p>
      </div>

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
    </>
  );
}
