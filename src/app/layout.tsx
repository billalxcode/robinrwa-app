import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { AppFooter } from "@/components/app-footer";
import { AppNavbar } from "@/components/app-navbar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WalletSync } from "@/components/wallet-sync";
import { Web3Provider } from "@/components/web3-provider";

// Brand fonts (OFL-licensed, self-hosted from public/assets/Font).
const jakartaSans = localFont({
  src: "../../public/assets/Font/Plus Jakarta Sans/Plus_Jakarta_Sans/PlusJakartaSans-VariableFont_wght.ttf",
  variable: "--font-sans",
  weight: "200 800",
  display: "swap",
});

const michroma = localFont({
  src: "../../public/assets/Font/Michroma/Michroma-Regular.ttf",
  variable: "--font-display",
  weight: "400",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Index Pool | eIndex Dashboard",
  description: "RWA index dashboard: explore indexes, manage LP positions.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${jakartaSans.variable} ${michroma.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Web3Provider>
          <WalletSync />
          <TooltipProvider>
            <div className="flex min-h-svh flex-col">
              <AppNavbar />
              <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-10 p-6 md:p-10">
                {children}
              </main>
              <AppFooter />
            </div>
          </TooltipProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
