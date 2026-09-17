import type { Metadata } from "next";
import { PortfolioTable } from "@/components/portfolio-table";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Your Index Pool liquidity NFT positions by connected wallet.",
  alternates: { canonical: "/portfolio" },
  robots: { index: false, follow: true },
};

export default function PortfolioPage() {
  return (
    <>
      <div>
        <h1 className="font-heading text-5xl font-bold tracking-tight">
          Portfolio
        </h1>
        <p className="mt-2 text-muted-foreground">
          Liquidity NFT positions by connected wallet.
        </p>
      </div>

      <PortfolioTable />
    </>
  );
}
