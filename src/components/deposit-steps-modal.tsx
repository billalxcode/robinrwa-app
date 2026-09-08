"use client";

import { useAppKit } from "@reown/appkit/react";
import { Check } from "lucide-react";
import { useAccount } from "wagmi";
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

type StepStatus = "loading" | "action" | "locked" | "done";

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
  indexName,
  token,
  amount,
  checking,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBack: () => void;
  indexName: string;
  token: string;
  amount: string;
  checking: boolean;
}) {
  const { address } = useAccount();
  const { open: openAppKit } = useAppKit();

  const approveStatus: StepStatus = checking
    ? "loading"
    : !address
      ? "action"
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
                {checking
                  ? "Checking your wallet…"
                  : !address
                    ? "Connect a wallet first."
                    : "Waiting for the router address."}
              </p>
              {!address && !checking && (
                <div className="pt-2">
                  <Button size="sm" onClick={() => openAppKit()}>
                    Connect wallet
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div className="flex items-start gap-4 py-4">
            <StepIcon n={2} status="locked" />
            <div className="flex flex-1 flex-col gap-1">
              <p className="text-sm font-medium">Deposit</p>
              <p className="text-xs text-muted-foreground">
                Waiting for approval.
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex items-start gap-4 py-4">
            <StepIcon n={3} status="locked" />
            <div className="flex flex-1 flex-col gap-1">
              <p className="text-sm font-medium">Confirmation</p>
              <p className="text-xs text-muted-foreground">
                Status shows here after you sign.
              </p>
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
