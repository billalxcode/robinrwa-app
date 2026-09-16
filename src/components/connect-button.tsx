"use client";

import { useAppKit } from "@reown/appkit/react";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWalletStore } from "@/stores/wallet";

function truncate(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

// Custom connect button in the app component style (pill, h-10).
// Opens the AppKit modal: wallet list when disconnected (multi-wallet
// out of the box: injected/EIP-6963, WalletConnect, Coinbase),
// account view when connected.
export function ConnectButton() {
  const { open } = useAppKit();
  const address = useWalletStore((s) => s.address);
  const isConnected = useWalletStore((s) => s.isConnected);

  if (!isConnected || !address) {
    return (
      <Button size="sm" onClick={() => open()}>
        <Wallet data-icon="inline-start" />
        Connect Wallet
      </Button>
    );
  }

  return (
    <Button variant="secondary" size="sm" onClick={() => open()}>
      {truncate(address)}
    </Button>
  );
}
