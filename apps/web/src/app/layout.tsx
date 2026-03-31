import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/ThemeProvider";
import { WalletStoreProvider } from "@/store/wallet-provider";
import { StakeStoreProvider } from "@/store/stake-provider";
import { UIStoreProvider } from "@/store/ui-provider";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// Place garamond-narrow.otf at public/fonts/garamond-narrow.otf
const garamond = localFont({
  src: "../../public/fonts/garamond-narrow.otf",
  variable: "--font-garamond",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Stake Utils",
  description: "Solana stake account management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} ${garamond.variable} antialiased`}>
        <ThemeProvider>
          <WalletStoreProvider>
            <StakeStoreProvider>
              <UIStoreProvider>
                {children}
              </UIStoreProvider>
            </StakeStoreProvider>
          </WalletStoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
