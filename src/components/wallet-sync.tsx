"use client";

import { useAppKitAccount } from "@reown/appkit/react";
import { useEffect } from "react";
import { useWalletStore } from "@/stores/wallet";

// Bridges AppKit connection state into useWalletStore once, at the top of
// the tree. Components read the store instead of subscribing individually,
// so header, portfolio, and modals can never disagree about connection.
export function WalletSync() {
  const { address, isConnected, status } = useAppKitAccount();
  const syncFromAppKit = useWalletStore((s) => s.syncFromAppKit);
  const markMounted = useWalletStore((s) => s.markMounted);

  useEffect(() => {
    markMounted();
  }, [markMounted]);

  useEffect(() => {
    syncFromAppKit({
      address,
      isConnected,
      status: status ?? "disconnected",
    });
  }, [address, isConnected, status, syncFromAppKit]);

  return null;
}
