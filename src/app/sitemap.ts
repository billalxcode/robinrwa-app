import type { MetadataRoute } from "next";
import { isIndexHidden } from "@/lib/index-rows";
import { getIndexesLive } from "@/lib/subgraph";
import { APP_URL } from "@/lib/web3";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ["", "/indexes", "/oracle", "/portfolio", "/docs"].map(
    (path) => ({
      url: `${APP_URL}${path === "" ? "" : path}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: path === "" ? 1 : 0.8,
    }),
  );
  try {
    const list = await getIndexesLive();
    const indexRoutes = (list?.indexes ?? [])
      .filter((i) => i.exists && !isIndexHidden(i.id))
      .map((i) => ({
        url: `${APP_URL}/indexes/${i.id}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.7,
      }));
    return [...staticRoutes, ...indexRoutes];
  } catch {
    return staticRoutes;
  }
}
