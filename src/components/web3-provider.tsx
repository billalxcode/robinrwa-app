"use client";

import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import {
  networks,
  REOWN_PROJECT_ID,
  robinhood,
  web3Metadata,
} from "@/lib/web3";

const queryClient = new QueryClient();

const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId: REOWN_PROJECT_ID,
  ssr: true,
});

// Modal setup runs outside components (Dok: /reown-com/reown-docs —
// Next.js implementation). Theme matches the app design system:
// Inter, brand lime accent, 12px card radius.
createAppKit({
  adapters: [wagmiAdapter],
  networks,
  defaultNetwork: robinhood,
  projectId: REOWN_PROJECT_ID,
  metadata: web3Metadata,
  themeMode: "dark",
  themeVariables: {
    "--apkt-font-family": '"Inter", "Inter Fallback", Arial, sans-serif',
    "--apkt-accent": "#CCFF00",
    "--apkt-border-radius-master": "12px",
  },
});

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
