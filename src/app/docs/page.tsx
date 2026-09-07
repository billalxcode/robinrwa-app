import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const groups = [
  {
    title: "Architecture & Overview",
    files: ["00-ikhtisar.md", "01-arsitektur.md"],
    desc: "Router flow, fund movement, contract roles.",
  },
  {
    title: "Core Contracts",
    files: [
      "02-asset-registry.md",
      "03-weight-registry.md",
      "04-index-factory.md",
      "05-index-router.md",
      "06-adapter-mock-proxy.md",
    ],
    desc: "Registry, factory, router, and adapter specs.",
  },
  {
    title: "Weight Oracle",
    files: ["07-oracle-bobot.md", "12-oracle-golang.md"],
    desc: "24h weight algorithm and the Go updater service.",
  },
  {
    title: "Operations",
    files: [
      "08-pengujian.md",
      "09-deployment.md",
      "10-operasi-upgrade.md",
      "11-simulasi-frontend.md",
    ],
    desc: "Tests, UUPS deploys, upgrades, sim scripts.",
  },
];

export default function DocsPage() {
  return (
    <>
      <div>
        <h1 className="font-heading text-5xl font-bold tracking-tight">
          Documentation
        </h1>
        <p className="mt-2 text-muted-foreground">
          Contract specs. Source of truth:
          <code className="mx-1 rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em]">
            docs/contracts/final/
          </code>
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {groups.map((g) => (
          <Card key={g.title}>
            <CardHeader>
              <CardTitle>{g.title}</CardTitle>
              <CardDescription>{g.desc}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-1.5">
                {g.files.map((f) => (
                  <li key={f}>
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                      {f}
                    </code>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
