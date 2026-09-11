export const pathLabels: Record<string, string> = {
  "/": "Home",
  "/indexes": "Index",
  "/portfolio": "Portfolio",
  "/docs": "Documentation",
  "/oracle": "Oracle",
};

export function breadcrumbTrail(pathname: string): string[] {
  if (pathname === "/") return ["Home"];
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "indexes" && parts[1]) {
    return ["Home", "Index", `Index ${parts[1]}`];
  }
  const seg = pathLabels[pathname];
  if (!seg) return ["Home"];
  return ["Home", seg];
}
