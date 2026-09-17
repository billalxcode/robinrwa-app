import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Brand OG image (1200x630): parchment field, official walnut mark tile
// (New Branding Artboard 6), wordmark + tagline.
// Dok: /vercel/next.js — opengraph-image.tsx.
export const alt = "Index Pool | RWA Index on Robinhood Chain";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  const logo = await readFile(
    join(process.cwd(), "public/assets/New Branding/Artboard 6.png"),
  );
  const src = `data:image/png;base64,${logo.toString("base64")}` as const;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 48,
        background: "#F4F1EA",
      }}
    >
      {/* biome-ignore lint/performance/noImgElement: satori ImageResponse requires raw img; next/image unsupported here */}
      <img
        src={src}
        width={160}
        height={160}
        alt="Index Pool mark"
        style={{ borderRadius: 28 }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div
          style={{
            fontSize: 84,
            fontWeight: 700,
            color: "#2A2A29",
            lineHeight: 1,
          }}
        >
          Index Pool
        </div>
        <div
          style={{
            fontSize: 32,
            color: "#AF7A4E",
          }}
        >
          One Deposit. Weighted RWA Liquidity.
        </div>
      </div>
    </div>,
    { ...size },
  );
}
