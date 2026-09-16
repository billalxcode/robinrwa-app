import { create } from "zustand";

// Single source of truth for wallet connection UI state.
// Only public connection data (address/status) — never keys.
// Synced from AppKit by <WalletSync/> so every component reads one source
// instead of mixing useAppKitAccount and wagmi useAccount (which can lag).
// Dok: /pmndrs/zustand — create store with state & actions (TypeScript).
export type WalletStatus =
  | "connected"
  | "disconnected"
  | "connecting"
  | "reconnecting";

interface WalletState {
  address: string | undefined;
  isConnected: boolean;
  status: WalletStatus;
  mounted: boolean;
  syncFromAppKit: (s: {
    address: string | undefined;
    isConnected: boolean;
    status: WalletStatus;
  }) => void;
  markMounted: () => void;
  reset: () => void;
}

export const useWalletStore = create<WalletState>()((set) => ({
  address: undefined,
  isConnected: false,
  status: "disconnected",
  mounted: false,
  syncFromAppKit: ({ address, isConnected, status }) =>
    set({ address, isConnected, status }),
  markMounted: () => set({ mounted: true }),
  reset: () =>
    set({ address: undefined, isConnected: false, status: "disconnected" }),
}));
