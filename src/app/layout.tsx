import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { AppFooter } from "@/components/app-footer";
import { AppNavbar } from "@/components/app-navbar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WalletSync } from "@/components/wallet-sync";
import { Web3Provider } from "@/components/web3-provider";
import { APP_URL } from "@/lib/web3";

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

const SITE_NAME = "Index Pool";
const SITE_DESCRIPTION =
  "Index Pool is an RWA index on Robinhood Chain. Deposit USDG once and hold volume-weighted LP positions across RWA pools.";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `${SITE_NAME} | RWA Index on Robinhood Chain`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "Index Pool",
    "RWA index",
    "Robinhood Chain",
    "tokenized stocks",
    "liquidity provision",
    "Uniswap v4",
    "USDG",
    "DeFi",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  openGraph: {
    title: `${SITE_NAME} | RWA Index on Robinhood Chain`,
    description: SITE_DESCRIPTION,
    url: "/",
    siteName: SITE_NAME,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | RWA Index on Robinhood Chain`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/icon.svg",
  },
  manifest: "/manifest.webmanifest",
  category: "finance",
};

export const viewport: Viewport = {
  themeColor: "#F4F1EA",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${jakartaSans.variable} ${michroma.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD from hardcoded constants, no user input
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: SITE_NAME,
              url: APP_URL,
              description: SITE_DESCRIPTION,
            }),
          }}
        />
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
