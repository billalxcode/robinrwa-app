import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Index Pool | RWA Index on Robinhood Chain",
    short_name: "Index Pool",
    description:
      "Deposit USDG once and hold volume-weighted RWA LP positions on Robinhood Chain.",
    start_url: "/",
    display: "standalone",
    background_color: "#F4F1EA",
    theme_color: "#F4F1EA",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
