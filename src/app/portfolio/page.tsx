import { PortfolioTable } from "@/components/portfolio-table";

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
