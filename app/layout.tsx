import type { Metadata } from "next";
import { Funnel_Display, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// UI font (Inter); Funnel Display = the brand display font for headers and
// numbers/values; a monospace (JetBrains Mono) for technical identifiers
// (wallet addresses, tx hashes, IBANs, API keys). Exposed as CSS vars.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const funnelDisplay = Funnel_Display({
  subsets: ["latin"],
  variable: "--font-funnel-display",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Thiqwave Treasury",
  description:
    "Pay-in, payout, conversion and holding across fiat and stablecoins — the Thiqwave treasury demo.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Light theme is the default (HeroUI's light tokens live at :root); we set
  // `light` / data-theme="light" explicitly so system dark never wins.
  return (
    <html
      lang="en"
      className={`light ${inter.variable} ${funnelDisplay.variable} ${jetbrainsMono.variable}`}
      data-theme="light"
    >
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
