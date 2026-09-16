import { create } from "zustand";

// Cross-modal deposit flow state (form modal + steps modal).
// Replaces the 8-prop drilling between ProvideLiquidityModal and
// DepositStepsModal (legs, skipped, decimals, amount, token, indexId…)
// plus the local open/showSteps duet and quote-result state.
// Dok: /pmndrs/zustand — multiple isolated stores per domain.
export type PayToken = "ETH" | "USDG";
export type DepositPhase = "form" | "steps";

export interface DepositLeg {
  tokenAddress: string;
  quoteAddress: string;
  fee: number;
  tickSpacing: number;
  hooks: string;
}

interface DepositState {
  open: boolean;
  phase: DepositPhase;
  indexId: string | null;
  indexName: string;
  payToken: PayToken;
  amount: string;
  skippedSymbols: string[];
  skippedAddresses: string[];
  decimals: number;
  legs: DepositLeg[];
  quoting: boolean;
  quoteError: string | null;
  skippedByPrice: string[];
  approveHash: string | undefined;
  depositHash: string | undefined;
  tokenIds: string[];
  start: (init: {
    indexId: string | null;
    indexName: string;
    legs: DepositLeg[];
    decimals: number;
  }) => void;
  setPayToken: (t: PayToken) => void;
  setAmount: (v: string) => void;
  toggleSkip: (symbol: string, include: boolean) => void;
  setSkippedAddresses: (addrs: string[]) => void;
  openSteps: () => void;
  backToForm: () => void;
  setQuoting: (v: boolean) => void;
  setQuoteResult: (err: string | null, skippedByPrice: string[]) => void;
  setApproveHash: (h: string | undefined) => void;
  setDepositHash: (h: string | undefined) => void;
  setTokenIds: (ids: string[]) => void;
  close: () => void;
  reset: () => void;
}

const initial: Omit<
  DepositState,
  | "start"
  | "setPayToken"
  | "setAmount"
  | "toggleSkip"
  | "setSkippedAddresses"
  | "openSteps"
  | "backToForm"
  | "setQuoting"
  | "setQuoteResult"
  | "setApproveHash"
  | "setDepositHash"
  | "setTokenIds"
  | "close"
  | "reset"
> = {
  open: false,
  phase: "form",
  indexId: null,
  indexName: "",
  payToken: "USDG",
  amount: "",
  skippedSymbols: [],
  skippedAddresses: [],
  decimals: 18,
  legs: [],
  quoting: false,
  quoteError: null,
  skippedByPrice: [],
  approveHash: undefined,
  depositHash: undefined,
  tokenIds: [],
};

export const useDepositStore = create<DepositState>()((set) => ({
  ...initial,
  start: (init) =>
    set({
      ...initial,
      open: true,
      phase: "form",
      indexId: init.indexId,
      indexName: init.indexName,
      legs: init.legs,
      decimals: init.decimals,
    }),
  setPayToken: (payToken) => set({ payToken }),
  setAmount: (amount) => set({ amount }),
  toggleSkip: (symbol, include) =>
    set((s) => ({
      skippedSymbols: include
        ? s.skippedSymbols.filter((x) => x !== symbol)
        : [...s.skippedSymbols, symbol],
    })),
  setSkippedAddresses: (skippedAddresses) => set({ skippedAddresses }),
  openSteps: () => set({ phase: "steps" }),
  backToForm: () => set({ phase: "form" }),
  setQuoting: (quoting) => set({ quoting }),
  setQuoteResult: (quoteError, skippedByPrice) =>
    set({ quoteError, skippedByPrice }),
  setApproveHash: (approveHash) => set({ approveHash }),
  setDepositHash: (depositHash) => set({ depositHash }),
  setTokenIds: (tokenIds) => set({ tokenIds }),
  close: () => set({ open: false }),
  reset: () => set(initial),
}));
