import type { Metadata } from "next";
import { Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";
import { AppFooter } from "@/components/app-footer";
import { AppNavbar } from "@/components/app-navbar";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Web3Provider } from "@/components/web3-provider";

const poppinsSans = Poppins({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RobinRWA · Dashboard eIndex",
  description: "RWA index dashboard: explore indexes, manage LP positions.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${poppinsSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Web3Provider>
          <TooltipProvider>
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset className="flex min-h-svh flex-col">
                <AppNavbar />
                <main className="flex flex-1 flex-col gap-10 p-6 md:p-10">
                  {children}
                </main>
                <AppFooter />
              </SidebarInset>
            </SidebarProvider>
          </TooltipProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
