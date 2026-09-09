"use client";

import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { erc20Abi, formatUnits } from "viem";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { DepositStepsModal } from "@/components/deposit-steps-modal";
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
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { getAsset, robinscanLogo, USDG_ADDRESS } from "@/lib/assets";
import type { MockTokenWeight } from "@/lib/mock";
import { cn } from "@/lib/utils";
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
  hooks: string;
  logo: string;
  tokenAddress: string;
  quoteAddress: string;
}

const PAY_TOKENS = ["USDG", "ETH"] as const;

const PAY_META: Record<
  (typeof PAY_TOKENS)[number],
  { logo: string; sub: string }
> = {
  USDG: { logo: getAsset(USDG_ADDRESS).logo, sub: "Stablecoin" },
  ETH: { logo: robinscanLogo("ETH", 64), sub: "Native" },
};

const QUICK_PCTS = [25, 50, 75] as const;

export function ProvideLiquidityModal({
  name,
  tokens,
  legs,
  indexId,
}: {
  name: string;
  tokens: MockTokenWeight[];
  legs?: ModalLeg[];
  /** On-chain index id. Null = demo index, steps modal stays read-only. */
  indexId?: string | null;
}) {
  const [token, setToken] = useState<"ETH" | "USDG">("USDG");
  const [amount, setAmount] = useState("");
  const [skipped, setSkipped] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [showSteps, setShowSteps] = useState(false);

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
    // Rows always list every leg (skipped legs keep inflow 0) so the
    // toggle stays visible and a skipped leg can be re-enabled.
    const inflows = new Map<string, number>();
    if (total > 0) {
      let distributed = 0;
      let top = 0;
      active.forEach((t, i) => {
        const inflow =
          Math.floor(((computedNet * t.weightBps) / total) * 1e6) / 1e6;
        distributed += inflow;
        if (i === 0 || t.weightBps > active[top].weightBps) top = i;
        inflows.set(t.token, inflow);
      });
      // Remainder to the largest leg, like _resolveWeights.
      if (active.length > 0)
        inflows.set(
          active[top].token,
          (inflows.get(active[top].token) ?? 0) + computedNet - distributed,
        );
    }
    const computed = tokens.map((t) => ({
      token: t.token,
      inflow: inflows.get(t.token) ?? 0,
      share: t.share,
    }));
    return { fee: computedFee, net: computedNet, rows: computed };
  }, [amt, valid, quoteEligible, skipped, tokens]);

  function fillMax() {
    if (balance === null) return;
    setAmount(String(Number(balance.toFixed(6))));
  }

  function fillPercent(pct: number) {
    if (balance === null) return;
    setAmount(String(Number(((balance * pct) / 100).toFixed(6))));
  }

  function toggleSkip(symbol: string, include: boolean) {
    setSkipped((prev) =>
      include ? prev.filter((s) => s !== symbol) : [...prev, symbol],
    );
  }

  const noneEligible =
    tokens.length > 0 && tokens.every((t) => skipped.includes(t.token));

  const ctaLabel = !valid
    ? "Enter an amount"
    : !quoteEligible
      ? "USDG only"
      : insufficient
        ? `Insufficient ${token} balance`
        : noneEligible
          ? "Select at least one leg"
          : `Review deposit · ${fmt(amt)} ${token}`;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setShowSteps(false);
      }}
    >
      <DialogTrigger render={<Button />}>
        Provide Liquidity
        <ArrowRight data-icon="inline-end" />
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Deposit into {name}</DialogTitle>
          <DialogDescription>
            Split across {tokens.length} legs by oracle weight. Nothing moves
            until you review and sign.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-secondary p-1">
            {PAY_TOKENS.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={token === t}
                onClick={() => setToken(t)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors",
                  token === t ? "bg-muted" : "hover:bg-muted/50",
                )}
              >
                <TokenIcon
                  src={PAY_META[t].logo}
                  label={t}
                  className="size-6"
                />
                <span className="flex min-w-0 flex-col leading-tight">
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      token === t ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {t}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {PAY_META[t].sub}
                  </span>
                </span>
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-secondary p-5">
            <div className="grid grid-cols-[1fr_auto] items-center gap-x-3">
              <Input
                id="pl-amount"
                type="number"
                min="0"
                inputMode="decimal"
                placeholder="0.0"
                aria-label="Deposit amount"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                }}
                className="h-auto w-full border-0 bg-transparent p-0 text-4xl leading-none font-semibold tabular-nums caret-primary shadow-none outline-none focus-visible:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <span className="flex items-center gap-2 rounded-full bg-muted py-1.5 pr-4 pl-1.5">
                <TokenIcon
                  src={PAY_META[token].logo}
                  label={token}
                  className="size-6"
                />
                <span className="text-sm font-semibold">{token}</span>
              </span>
              <div className="mt-4 flex items-center gap-1.5">
                {QUICK_PCTS.map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    disabled={balance === null || balance <= 0}
                    onClick={() => fillPercent(pct)}
                    className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                  >
                    {pct}%
                  </button>
                ))}
                <button
                  type="button"
                  disabled={balance === null || balance <= 0}
                  onClick={fillMax}
                  className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-primary transition-colors hover:underline disabled:opacity-50"
                >
                  MAX
                </button>
              </div>
              <p className="mt-4 text-right text-xs text-muted-foreground tabular-nums">
                {address
                  ? balance === null
                    ? "Balance …"
                    : `Balance ${fmt(balance)}`
                  : "Connect wallet"}
              </p>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {valid && quoteEligible
                ? `≈ ${fmt(net)} net after ${fmt(fee)} fee`
                : "Type an amount to preview the split."}
            </p>
          </div>

          {token !== "USDG" && (
            <Alert>
              <AlertTitle>ETH won&apos;t work here</AlertTitle>
              <AlertDescription>This index only accepts USDG.</AlertDescription>
            </Alert>
          )}

          {valid && quoteEligible && (
            <div className="flex flex-col gap-4 rounded-xl border border-border p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">You invest</span>
                <span className="text-base font-semibold tabular-nums">
                  {fmt(net)} {token}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Protocol fee (20 bps)
                </span>
                <span className="tabular-nums">
                  {fmt(fee)} {token}
                </span>
              </div>
              <Separator />
              <div className="flex flex-col gap-4">
                {rows.map((r) => {
                  const info = legs?.find((l) => l.token === r.token);
                  const off = skipped.includes(r.token);
                  const pct =
                    net > 0 && !off ? Math.min(100, (r.inflow / net) * 100) : 0;
                  return (
                    <div key={r.token} className={cn(off && "opacity-50")}>
                      <div className="flex items-center gap-3">
                        {info ? (
                          <TokenIcon src={info.logo} label={r.token} />
                        ) : (
                          <Badge
                            variant="outline"
                            className="w-20 justify-center"
                          >
                            {r.token}
                          </Badge>
                        )}
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="flex items-baseline justify-between gap-2 text-sm">
                            <span className="font-medium">{r.token}</span>
                            <span className="tabular-nums">
                              {fmt(r.inflow)} {token}
                            </span>
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {info
                              ? `In ${info.quote} pool · ${(info.fee / 10000).toFixed(2)}% fee · ${r.share}`
                              : `${r.share} share`}
                          </span>
                        </span>
                        <Switch
                          aria-label={`${off ? "Include" : "Skip"} ${r.token}`}
                          checked={!off}
                          onCheckedChange={(include) =>
                            toggleSkip(r.token, include)
                          }
                        />
                      </div>
                      <div className="mt-2 ml-8 h-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-[width]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
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
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <DialogClose render={<Button variant="secondary" />}>
            Cancel
          </DialogClose>
          <Button
            className="flex-1"
            disabled={!valid || !quoteEligible || insufficient}
            onClick={() => {
              setOpen(false);
              setShowSteps(true);
            }}
          >
            {ctaLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
      <DepositStepsModal
        open={showSteps}
        onOpenChange={setShowSteps}
        onBack={() => {
          setShowSteps(false);
          setOpen(true);
        }}
        indexId={indexId ?? null}
        indexName={name}
        token={token}
        amount={valid ? fmt(amt) : amount}
        legs={(legs ?? []).map((l) => ({
          tokenAddress: l.tokenAddress,
          quoteAddress: l.quoteAddress,
          fee: l.fee,
          tickSpacing: l.tickSpacing,
          hooks: l.hooks,
        }))}
        skippedAddresses={(legs ?? [])
          .filter((l) => skipped.includes(l.token))
          .map((l) => l.tokenAddress)}
        decimals={token === "ETH" ? 18 : (usdgDecimals.data ?? 18)}
      />
    </Dialog>
  );
}
