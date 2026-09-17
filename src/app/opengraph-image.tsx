import { ImageResponse } from "next/og";

// Brand OG image (1200x630): parchment field, copper diamond mark,
// wordmark + tagline. Dok: /vercel/next.js — opengraph-image.tsx.
export const alt = "Index Pool | RWA Index on Robinhood Chain";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
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
      <div
        style={{
          width: 120,
          height: 120,
          background: "#542B15",
          transform: "rotate(45deg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            background: "#E8D6A4",
            transform: "rotate(0deg)",
          }}
        />
      </div>
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
