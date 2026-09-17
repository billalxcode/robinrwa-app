"use client";

import { useEffect } from "react";

// Root error boundary (dok: /vercel/next.js — global-error.tsx owns its
// html/body, so brand styling is inline: no layout CSS applies here).
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100svh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F4F1EA",
          color: "#2A2A29",
          fontFamily: "Georgia, 'Times New Roman', serif",
          textAlign: "center",
          padding: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 40, margin: "0 0 12px" }}>Index Pool</h1>
          <p style={{ margin: "0 0 24px", opacity: 0.75 }}>
            The app crashed. Reload to try again.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              background: "#AF7A4E",
              color: "#fff",
              border: 0,
              borderRadius: 12,
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
