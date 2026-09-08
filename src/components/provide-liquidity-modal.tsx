"use client";

import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
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
import type { MockTokenWeight } from "@/lib/mock";

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

export function ProvideLiquidityModal({
  name,
  tokens,
}: {
  name: string;
  tokens: MockTokenWeight[];
}) {
  const [token, setToken] = useState<"ETH" | "USDG">("USDG");
  const [amount, setAmount] = useState("");
  const [skipped, setSkipped] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const amt = Number(amount);
  const valid = Number.isFinite(amt) && amt > 0;
  const quoteEligible = token === LEG_QUOTE;

  const { fee, net, rows } = useMemo(() => {
    if (!valid || !quoteEligible)
      return {
        fee: 0,
        net: 0,
        rows: [] as { token: string; inflow: number }[],
      };
    const computedFee = (amt * FEE_BPS) / BPS_DENOM;
    const computedNet = amt - computedFee;
    const active = tokens.filter((t) => !skipped.includes(t.token));
    const total = active.reduce((s, t) => s + t.weightBps, 0);
    if (total === 0)
      return {
        fee: computedFee,
        net: computedNet,
        rows: [] as { token: string; inflow: number }[],
      };
    let distributed = 0;
    let top = 0;
    const computed = active.map((t, i) => {
      const inflow =
        Math.floor(((computedNet * t.weightBps) / total) * 1e6) / 1e6;
      distributed += inflow;
      if (i === 0 || t.weightBps > active[top].weightBps) top = i;
      return { token: t.token, inflow };
    });
    // Remainder to the largest leg, like _resolveWeights.
    if (computed.length > 0) computed[top].inflow += computedNet - distributed;
    return { fee: computedFee, net: computedNet, rows: computed };
  }, [amt, valid, quoteEligible, skipped, tokens]);

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
          <DialogTitle>Provide Liquidity — {name}</DialogTitle>
          <DialogDescription>
            Preview only. Submitting calls
            {` IndexRouter.addLiquidity${token} on-chain.`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <Field>
            <FieldLabel>Deposit token</FieldLabel>
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
            <FieldLabel htmlFor="pl-amount">Amount to deposit</FieldLabel>
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
          </Field>

          {token === "USDG" ? (
            <p className="text-xs text-muted-foreground">
              USDG needs <code className="font-mono">approve(router)</code>{" "}
              before depositing (the contract pulls via{" "}
              <code className="font-mono">transferFrom</code>).
            </p>
          ) : (
            <Alert>
              <AlertTitle>No eligible legs for ETH</AlertTitle>
              <AlertDescription>
                Legs on {name} are quoted in {LEG_QUOTE}. An ETH deposit fills
                nothing and reverts (`NoEligibleLegs`).
              </AlertDescription>
            </Alert>
          )}

          {valid && quoteEligible && (
            <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Fee (20 bps)</span>
                <span className="tabular-nums">
                  {fmt(fee)} {token}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Net into legs</span>
                <span className="font-medium tabular-nums">
                  {fmt(net)} {token}
                </span>
              </div>
              {rows.map((r) => (
                <div key={r.token} className="flex items-center gap-3 text-sm">
                  <Badge variant="outline" className="w-20 justify-center">
                    {r.token}
                  </Badge>
                  <span className="flex-1 tabular-nums">
                    {fmt(r.inflow)} {token}
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
                    onCheckedChange={(include) => toggleSkip(r.token, include)}
                  />
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                Skipped legs map to{" "}
                <code className="font-mono">skipTokens[]</code>. Dust and failed
                legs are refunded; <code className="font-mono">tokenIds</code>{" "}
                come from the <code className="font-mono">LiquidityAdded</code>{" "}
                event.
              </p>
            </div>
          )}

          {submitted && (
            <Alert>
              <AlertTitle>Wallet not connected</AlertTitle>
              <AlertDescription>
                Preview only — no transaction was sent. Connect a wallet, fund
                it with {token}, then submit again.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="secondary" />}>
            Cancel
          </DialogClose>
          <Button
            disabled={!valid || !quoteEligible}
            onClick={() => setSubmitted(true)}
          >
            Deposit {valid ? `${fmt(amt)} ${token}` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
