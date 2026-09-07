import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const groups = [
  {
    title: "Arsitektur & Ikhtisar",
    files: ["00-ikhtisar.md", "01-arsitektur.md"],
    desc: "Cara kerja router, aliran dana, peran antar kontrak dan oracle.",
  },
  {
    title: "Kontrak Inti",
    files: [
      "02-asset-registry.md",
      "03-weight-registry.md",
      "04-index-factory.md",
      "05-index-router.md",
      "06-adapter-mock-proxy.md",
    ],
    desc: "Spesifikasi registry, factory, router add/remove, dan adapter.",
  },
  {
    title: "Oracle Bobot",
    files: ["07-oracle-bobot.md", "12-oracle-golang.md"],
    desc: "Algoritma bobot volume 24 jam dan service Go pemegang UPDATER_ROLE.",
  },
  {
    title: "Operasi",
    files: [
      "08-pengujian.md",
      "09-deployment.md",
      "10-operasi-upgrade.md",
      "11-simulasi-frontend.md",
    ],
    desc: "Testing, deployment UUPS, runbook upgrade, dan skrip simulasi.",
  },
];

export default function DocsPage() {
  return (
    <>
      <div>
        <h1 className="font-heading text-4xl font-medium">Dokumentasi</h1>
        <p className="mt-2 text-muted-foreground">
          Spesifikasi kontrak eIndex — sumber kebenaran ada di
          <code className="mx-1 rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em]">
            docs/contracts/final/
          </code>
          repo ini.
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
