export const pathLabels: Record<string, string> = {
  "/": "Home",
  "/indexes": "Index",
  "/positions": "Positions",
  "/docs": "Documentation",
  "/oracle": "Oracle",
};

const indexNames: Record<string, string> = {
  rwa300: "RWA300",
  mag7: "MAG7-VOL",
  rocket300: "ROCKET300",
};

export function breadcrumbTrail(pathname: string): string[] {
  if (pathname === "/") return ["Home"];
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "indexes" && parts[1]) {
    const known = indexNames[parts[1]];
    if (known) return ["Home", "Index", known];
    return ["Home", "Index", `Index ${parts[1]}`];
  }
  const seg = pathLabels[pathname];
  if (!seg) return ["Home"];
  return ["Home", seg];
}
