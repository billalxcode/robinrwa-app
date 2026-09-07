export const pathLabels: Record<string, string> = {
  "/": "Home",
  "/indexes": "Index",
  "/positions": "Positions",
  "/docs": "Dokumentasi",
  "/oracle": "Oracle",
};

export function breadcrumbTrail(pathname: string): string[] {
  const seg = pathLabels[pathname];
  if (!seg || pathname === "/") return ["Home"];
  return ["Home", seg];
}
