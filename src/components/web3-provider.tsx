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
// Poppins, brand blue accent, 16px card radius.
createAppKit({
  adapters: [wagmiAdapter],
  networks,
  defaultNetwork: robinhood,
  projectId: REOWN_PROJECT_ID,
  metadata: web3Metadata,
  themeMode: "light",
  themeVariables: {
    "--apkt-font-family": '"Poppins", "Inter", Arial, sans-serif',
    "--apkt-accent": "#2447F9",
    "--apkt-border-radius-master": "16px",
  },
});

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
