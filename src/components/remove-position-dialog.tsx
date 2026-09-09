"use client";

import { useEffect, useState } from "react";
import { erc721Abi } from "viem";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { INDEX_ROUTER, indexRouterAbi } from "@/lib/contracts";

type Phase = "confirm" | "approving" | "removing" | "done" | "error";

export function RemovePositionDialog({
  position,
  indexName,
  onClose,
}: {
  position: { tokenId: string; manager: string } | null;
  indexName: string;
  onClose: () => void;
}) {
  const { address } = useAccount();
  const [phase, setPhase] = useState<Phase>("confirm");
  const [error, setError] = useState<string | null>(null);

  const manager = (position?.manager ??
    "0x0000000000000000000000000000000000000000") as `0x${string}`;
  const tokenId = position ? BigInt(position.tokenId) : BigInt(0);

  const approval = useReadContract({
    address: manager,
    abi: erc721Abi,
    functionName: "isApprovedForAll",
    args: [
      (address ??
        "0x0000000000000000000000000000000000000000") as `0x${string}`,
      INDEX_ROUTER,
    ],
    query: { enabled: !!position && !!address },
  });

  const approveTx = useWriteContract();
  const approveReceipt = useWaitForTransactionReceipt({
    hash: approveTx.data,
  });
  const removeTx = useWriteContract();
  const removeReceipt = useWaitForTransactionReceipt({
    hash: removeTx.data,
  });

  const approved = approval.data === true || approveReceipt.isSuccess === true;

  function doRemove() {
    if (!position) return;
    setError(null);
    removeTx.writeContract({
      address: INDEX_ROUTER,
      abi: indexRouterAbi,
      functionName: "removeLiquidity",
      args: [
        [tokenId],
        [BigInt(0)],
        [BigInt(0)],
        ["0x"],
        BigInt(Math.floor(Date.now() / 1000) + 3600),
      ],
    });
  }

  function submit() {
    if (!position || !address) return;
    setError(null);
    if (approved) {
      setPhase("removing");
      doRemove();
    } else {
      setPhase("approving");
      approveTx.writeContract({
        address: manager,
        abi: erc721Abi,
        functionName: "setApprovalForAll",
        args: [INDEX_ROUTER, true],
      });
    }
  }

  function reset() {
    setPhase("confirm");
    setError(null);
  }

  useEffect(() => {
    if (removeReceipt.isSuccess) setPhase("done");
  }, [removeReceipt.isSuccess]);

  useEffect(() => {
    const err = approveTx.error ?? removeTx.error;
    if (err) {
      setPhase("error");
      setError(err.message.split("\n")[0].slice(0, 160));
    }
  }, [approveTx.error, removeTx.error]);

  useEffect(() => {
    if (approveTx.isPending || approveReceipt.isLoading) setPhase("approving");
    else if (removeTx.isPending || removeReceipt.isLoading)
      setPhase("removing");
  }, [
    approveTx.isPending,
    approveReceipt.isLoading,
    removeTx.isPending,
    removeReceipt.isLoading,
  ]);

  return (
    <AlertDialog
      open={!!position}
      onOpenChange={(o) => {
        if (!o) {
          reset();
          onClose();
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Remove position #{position?.tokenId ?? ""}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Burns this NFT from {indexName}. Proceeds return to your wallet.
            Minimums are 0 — accepts any return amount.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {phase === "approving" && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner /> Approving router for this NFT…
          </p>
        )}
        {phase === "removing" && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner /> Removing liquidity…
          </p>
        )}
        {phase === "done" && (
          <p className="text-sm font-medium">
            Done. Table refreshes automatically.
          </p>
        )}
        {phase === "error" && (
          <p className="text-xs font-medium text-destructive">
            {error ?? "Transaction failed. Try again."}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          {phase === "done" ? (
            <Button
              onClick={() => {
                reset();
                onClose();
              }}
            >
              Close
            </Button>
          ) : (
            <Button
              disabled={
                phase === "approving" ||
                phase === "removing" ||
                approval.isLoading
              }
              onClick={phase === "error" ? reset : submit}
            >
              {phase === "error"
                ? "Try again"
                : phase === "approving"
                  ? "Approving…"
                  : phase === "removing"
                    ? "Removing…"
                    : approved
                      ? "Remove"
                      : "Approve & remove"}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
