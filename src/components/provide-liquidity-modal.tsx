"use client";

import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { erc20Abi, formatUnits } from "viem";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { TokenIcon } from "@/components/token-icon";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { USDG_ADDRESS } from "@/lib/assets";
import type { MockTokenWeight } from "@/lib/mock";
import { robinhood } from "@/lib/web3";

const FEE_BPS = 20;
const BPS_DENOM = 10_000;
// Legs on this index are quoted in USDG (per LAPORAN-LIKUIDITAS:
// constituent/USDG pairs). Mirrors the contract quote-match rule:
// legs whose quote differs from the deposit token are skipped.
const LEG_QUOTE = "USDG";

function fmt(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", { maximumFractionDigits: 6 });
}

export interface ModalLeg {
  /** Matches MockTokenWeight.token label. */
  token: string;
  quote: string;
  fee: number;
  tickSpacing: number;
  logo: string;
}

export function ProvideLiquidityModal({
  name,
  tokens,
  legs,
}: {
  name: string;
  tokens: MockTokenWeight[];
  legs?: ModalLeg[];
}) {
  const [token, setToken] = useState<"ETH" | "USDG">("USDG");
  const [amount, setAmount] = useState("");
  const [skipped, setSkipped] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const { address } = useAccount();
  const native = useBalance({ address, chainId: robinhood.id });
  const usdgBalance = useReadContract({
    address: USDG_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address ?? "0x0000000000000000000000000000000000000000"],
    query: { enabled: !!address },
  });
  const usdgDecimals = useReadContract({
    address: USDG_ADDRESS,
    abi: erc20Abi,
    functionName: "decimals",
    query: { enabled: !!address },
  });

  const balance: number | null =
    token === "ETH"
      ? native.data
        ? Number(native.data.formatted)
        : null
      : usdgBalance.data === undefined
        ? null
        : Number(formatUnits(usdgBalance.data, usdgDecimals.data ?? 18));
  const balanceLoading =
    !!address && (native.isLoading || usdgBalance.isLoading);

  const amt = Number(amount);
  const valid = Number.isFinite(amt) && amt > 0;
  const quoteEligible = token === LEG_QUOTE;
  const insufficient =
    valid && balance !== null && !balanceLoading && amt > balance;

  const { fee, net, rows } = useMemo(() => {
    type Row = { token: string; inflow: number; share: string };
    if (!valid || !quoteEligible)
      return {
        fee: 0,
        net: 0,
        rows: [] as Row[],
      };
    const computedFee = (amt * FEE_BPS) / BPS_DENOM;
    const computedNet = amt - computedFee;
    const active = tokens.filter((t) => !skipped.includes(t.token));
    const total = active.reduce((s, t) => s + t.weightBps, 0);
    if (total === 0)
      return {
        fee: computedFee,
        net: computedNet,
        rows: [] as Row[],
      };
    let distributed = 0;
    let top = 0;
    const computed = active.map((t, i) => {
      const inflow =
        Math.floor(((computedNet * t.weightBps) / total) * 1e6) / 1e6;
      distributed += inflow;
      if (i === 0 || t.weightBps > active[top].weightBps) top = i;
      return { token: t.token, inflow, share: t.share };
    });
    // Remainder to the largest leg, like _resolveWeights.
    if (computed.length > 0) computed[top].inflow += computedNet - distributed;
    return { fee: computedFee, net: computedNet, rows: computed };
  }, [amt, valid, quoteEligible, skipped, tokens]);

  function fillMax() {
    if (balance === null) return;
    setAmount(String(Number(balance.toFixed(6))));
    setSubmitted(false);
  }

  function toggleSkip(symbol: string, include: boolean) {
    setSubmitted(false);
    setSkipped((prev) =>
      include ? prev.filter((s) => s !== symbol) : [...prev, symbol],
    );
  }

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) setSubmitted(false);
      }}
    >
      <DialogTrigger render={<Button />}>
        Provide Liquidity
        <ArrowRight data-icon="inline-end" />
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Provide liquidity</DialogTitle>
          <DialogDescription>
            See how your deposit into {name} is split.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <Field>
            <FieldLabel>Pay with</FieldLabel>
            <ToggleGroup
              multiple={false}
              value={[token]}
              onValueChange={(v) => {
                const next = v[0];
                if (next === "ETH" || next === "USDG") {
                  setToken(next);
                  setSubmitted(false);
                }
              }}
            >
              <ToggleGroupItem value="ETH">ETH (native)</ToggleGroupItem>
              <ToggleGroupItem value="USDG">USDG</ToggleGroupItem>
            </ToggleGroup>
          </Field>

          <Field>
            <FieldLabel htmlFor="pl-amount">Amount</FieldLabel>
            <Input
              id="pl-amount"
              type="number"
              min="0"
              inputMode="decimal"
              placeholder="0.0"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setSubmitted(false);
              }}
            />
            <div className="flex items-center justify-between text-xs">
              {address ? (
                <>
                  <span className="text-muted-foreground">
                    Balance:{" "}
                    {balance === null ? (
                      "…"
                    ) : (
                      <span className="tabular-nums">
                        {fmt(balance)} {token}
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    disabled={balance === null || balance <= 0}
                    onClick={fillMax}
                    className="font-medium text-primary hover:underline disabled:opacity-50"
                  >
                    Max
                  </button>
                </>
              ) : (
                <span className="text-muted-foreground">
                  Connect a wallet to see balance.
                </span>
              )}
            </div>
          </Field>

          {token === "USDG" ? (
            <p className="text-xs text-muted-foreground">
              You approve USDG spending first, then deposit.
            </p>
          ) : (
            <Alert>
              <AlertTitle>ETH won&apos;t work here</AlertTitle>
              <AlertDescription>This index only accepts USDG.</AlertDescription>
            </Alert>
          )}

          {valid && quoteEligible && (
            <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Fee</span>
                <span className="tabular-nums">
                  {fmt(fee)} {token}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">You invest</span>
                <span className="font-medium tabular-nums">
                  {fmt(net)} {token}
                </span>
              </div>
              {rows.map((r) => {
                const info = legs?.find((l) => l.token === r.token);
                return (
                  <div
                    key={r.token}
                    className="flex items-center gap-3 text-sm"
                  >
                    {info ? (
                      <TokenIcon src={info.logo} label={r.token} />
                    ) : (
                      <Badge variant="outline" className="w-20 justify-center">
                        {r.token}
                      </Badge>
                    )}
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="font-medium">{r.token}</span>
                        <span className="tabular-nums">
                          {fmt(r.inflow)} {token}
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {info
                          ? `In ${info.quote} pool, ${(info.fee / 10000).toFixed(2)}% fee, ${r.share} share`
                          : `${r.share} share`}
                      </span>
                    </span>
                    <Label
                      htmlFor={`skip-${r.token}`}
                      className="text-xs text-muted-foreground"
                    >
                      {skipped.includes(r.token) ? "Skipped" : "Include"}
                    </Label>
                    <Switch
                      id={`skip-${r.token}`}
                      checked={!skipped.includes(r.token)}
                      onCheckedChange={(include) =>
                        toggleSkip(r.token, include)
                      }
                    />
                  </div>
                );
              })}
              <p className="text-xs text-muted-foreground">
                Skipped legs are refunded automatically.
              </p>
              {insufficient && (
                <p className="text-xs font-medium text-destructive">
                  Insufficient {token} balance.
                </p>
              )}
            </div>
          )}

          {submitted && (
            <Alert>
              <AlertTitle>
                {address ? "Deposits aren't live yet" : "Connect your wallet"}
              </AlertTitle>
              <AlertDescription>
                {address
                  ? "You're previewing only."
                  : "Nothing has been sent yet."}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="secondary" />}>
            Cancel
          </DialogClose>
          <Button
            disabled={!valid || !quoteEligible || insufficient}
            onClick={() => setSubmitted(true)}
          >
            Deposit {valid ? `${fmt(amt)} ${token}` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
