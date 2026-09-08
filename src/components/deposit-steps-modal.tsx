"use client";

import { useAppKit } from "@reown/appkit/react";
import { Check } from "lucide-react";
import { useState } from "react";
import { decodeEventLog, erc20Abi, parseEther, parseUnits } from "viem";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { USDG_ADDRESS } from "@/lib/assets";
import {
  INDEX_ROUTER,
  indexRouterAbi,
  WEIGHT_REGISTRY,
  weightRegistryAbi,
} from "@/lib/contracts";
import { getLegConfigs } from "@/lib/quote";
import { getPublicClient } from "@/lib/web3";

export interface StepLeg {
  tokenAddress: string;
  quoteAddress: string;
  fee: number;
  tickSpacing: number;
  hooks: string;
}

type StepStatus = "loading" | "action" | "locked" | "done" | "error";

function StepIcon({ n, status }: { n: number; status: StepStatus }) {
  if (status === "loading") return <Spinner className="size-5" />;
  if (status === "done")
    return (
      <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Check className="size-4" />
      </span>
    );
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
      {n}
    </span>
  );
}

export function DepositStepsModal({
  open,
  onOpenChange,
  onBack,
  indexId,
  indexName,
  token,
  amount,
  legs,
  skippedAddresses,
  decimals,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBack: () => void;
  /** On-chain index id. Null = demo index, no transaction possible. */
  indexId: string | null;
  indexName: string;
  token: "ETH" | "USDG";
  amount: string;
  legs: StepLeg[];
  skippedAddresses: string[];
  decimals: number;
}) {
  const { address } = useAccount();
  const { open: openAppKit } = useAppKit();
  const demo = indexId === null;

  const epoch = useReadContract({
    address: WEIGHT_REGISTRY,
    abi: weightRegistryAbi,
    functionName: "epoch",
    query: { enabled: open && !demo },
  });

  const amountWei =
    token === "ETH"
      ? parseEther(amount || "0")
      : parseUnits(amount || "0", decimals);

  const approve = useWriteContract();
  const approveReceipt = useWaitForTransactionReceipt({
    hash: approve.data,
  });

  const deposit = useWriteContract();
  const depositReceipt = useWaitForTransactionReceipt({
    hash: deposit.data,
  });

  // ---- step 1: approve (USDG only; native needs none) ----
  const approved = token === "ETH" || approveReceipt.isSuccess;
  const approveStatus: StepStatus = demo
    ? "locked"
    : !address
      ? "action"
      : token === "ETH"
        ? "done"
        : approveReceipt.isSuccess
          ? "done"
          : approve.error
            ? "error"
            : approve.isPending || approveReceipt.isLoading
              ? "loading"
              : "action";

  function submitApprove() {
    if (!address || demo) return;
    approve.writeContract({
      address: USDG_ADDRESS,
      abi: erc20Abi,
      functionName: "approve",
      args: [INDEX_ROUTER, amountWei],
    });
  }

  // ---- step 2: deposit (fresh ranges, quoted at submit time) ----
  // Index legs are FIXED (pairs + tiers never change). Only the ranges
  // move: prices drift, so ticks are re-quoted live on every deposit.
  // Static ranges silently skip legs (funds refunded) — never reuse them.
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [skippedByPrice, setSkippedByPrice] = useState<string[]>([]);
  const canDeposit =
    !demo &&
    !!address &&
    approved &&
    epoch.data !== undefined &&
    !deposit.data &&
    !quoting;
  const depositStatus: StepStatus = demo
    ? "locked"
    : depositReceipt.isSuccess
      ? "done"
      : deposit.error || quoteError
        ? "error"
        : deposit.isPending || depositReceipt.isLoading || quoting
          ? "loading"
          : approved && !!address
            ? "action"
            : "locked";

  async function submitDeposit() {
    if (!canDeposit || epoch.data === undefined) return;
    setQuoting(true);
    setQuoteError(null);
    setSkippedByPrice([]);
    try {
      const client = getPublicClient();
      const { configs, skipped } = await getLegConfigs(client, legs);
      const skippedTokens = legs
        .filter((_, i) => skipped.includes(i))
        .map((l) => l.tokenAddress);
      if (skippedTokens.length > 0) setSkippedByPrice(skippedTokens);
      const skip = legs
        .filter(
          (l) =>
            skippedAddresses.some(
              (s) => s.toLowerCase() === l.tokenAddress.toLowerCase(),
            ) || skippedTokens.includes(l.tokenAddress),
        )
        .map((l) => l.tokenAddress as `0x${string}`);
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
      const indexIdBig = BigInt(indexId ?? "0");
      if (token === "ETH") {
        deposit.writeContract({
          address: INDEX_ROUTER,
          abi: indexRouterAbi,
          functionName: "addLiquidityETH",
          args: [indexIdBig, epoch.data, configs, skip, deadline],
          value: amountWei,
        });
      } else {
        deposit.writeContract({
          address: INDEX_ROUTER,
          abi: indexRouterAbi,
          functionName: "addLiquidityUSDG",
          args: [indexIdBig, amountWei, epoch.data, configs, skip, deadline],
        });
      }
    } catch {
      setQuoteError("Couldn't fetch fresh price ranges. Try again.");
    } finally {
      setQuoting(false);
    }
  }

  // ---- step 3: confirmation ----
  const tokenIds: string[] = [];
  if (depositReceipt.data) {
    for (const log of depositReceipt.data.logs) {
      try {
        const decoded = decodeEventLog({
          abi: indexRouterAbi,
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName === "LiquidityAdded") {
          const ids = decoded.args.tokenIds as bigint[];
          tokenIds.push(...ids.map(String));
        }
      } catch {
        // Not a LiquidityAdded log — ignore.
      }
    }
  }
  const confirmStatus: StepStatus = demo
    ? "locked"
    : depositReceipt.isSuccess
      ? "done"
      : "locked";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Deposit {amount} {token}
          </DialogTitle>
          <DialogDescription>
            3 steps into {indexName}. Nothing is sent until you sign.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col">
          <div className="flex items-start gap-4 py-4">
            <StepIcon n={1} status={approveStatus} />
            <div className="flex flex-1 flex-col gap-1">
              <p className="text-sm font-medium">Approve {token}</p>
              <p className="text-xs text-muted-foreground">
                {demo
                  ? "Demo index — no on-chain approval."
                  : token === "ETH"
                    ? "Native token needs no approval."
                    : approveReceipt.isSuccess
                      ? "Approved. You can deposit now."
                      : !address
                        ? "Connect a wallet first."
                        : "Let the router move your USDG."}
              </p>
              {!demo && !address && approveStatus === "action" && (
                <div className="pt-2">
                  <Button size="sm" onClick={() => openAppKit()}>
                    Connect wallet
                  </Button>
                </div>
              )}
              {!demo &&
                !!address &&
                token === "USDG" &&
                !approveReceipt.isSuccess && (
                  <div className="pt-2">
                    <Button
                      size="sm"
                      disabled={approve.isPending || approveReceipt.isLoading}
                      onClick={submitApprove}
                    >
                      {approve.isPending || approveReceipt.isLoading
                        ? "Approving…"
                        : approve.error
                          ? "Retry approve"
                          : "Approve"}
                    </Button>
                    {approve.error && (
                      <p className="pt-2 text-xs font-medium text-destructive">
                        Approval failed. Try again.
                      </p>
                    )}
                  </div>
                )}
            </div>
          </div>

          <Separator />

          <div className="flex items-start gap-4 py-4">
            <StepIcon n={2} status={depositStatus} />
            <div className="flex flex-1 flex-col gap-1">
              <p className="text-sm font-medium">Deposit</p>
              <p className="text-xs text-muted-foreground">
                {demo
                  ? "Demo index — no on-chain deposit."
                  : depositReceipt.isSuccess
                    ? "Deposit confirmed."
                    : !approved
                      ? "Waiting for approval."
                      : "Sign the deposit in your wallet."}
              </p>
              {!demo && (depositStatus === "action" || quoteError) && (
                <div className="pt-2">
                  <Button size="sm" disabled={quoting} onClick={submitDeposit}>
                    {quoting
                      ? "Fetching fresh ranges…"
                      : `Deposit ${amount} ${token}`}
                  </Button>
                  {quoteError && (
                    <p className="pt-2 text-xs font-medium text-destructive">
                      {quoteError}
                    </p>
                  )}
                  {skippedByPrice.length > 0 && !quoteError && (
                    <p className="pt-2 text-xs text-muted-foreground">
                      {skippedByPrice.length} leg(s) have no pool yet — those
                      funds return as refund.
                    </p>
                  )}
                  {deposit.error && (
                    <p className="pt-2 text-xs font-medium text-destructive">
                      Deposit failed. Try again.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div className="flex items-start gap-4 py-4">
            <StepIcon n={3} status={confirmStatus} />
            <div className="flex flex-1 flex-col gap-1">
              <p className="text-sm font-medium">Confirmation</p>
              <p className="text-xs text-muted-foreground">
                {confirmStatus === "done" && tokenIds.length > 0
                  ? `Position NFTs: ${tokenIds.join(", ")}`
                  : "Status shows here after you sign."}
              </p>
              {confirmStatus === "done" && deposit.data && (
                <p className="font-mono text-xs text-muted-foreground">
                  {`${deposit.data.slice(0, 10)}…${deposit.data.slice(-4)}`}
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onBack}>
            Back
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
