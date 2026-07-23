import type { Metadata } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

// Web fallback only - the Apple-inspired font stack (see globals.css --font-sans)
// tries native -apple-system/SF Pro first and only falls through to this on
// non-Apple platforms.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Set NEXT_PUBLIC_SITE_URL to the real production domain once one is chosen; this
// fallback keeps OG/Twitter URLs valid in the meantime.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rajani.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Rajani — Hyderabad caterers, real prices upfront",
  description: "Find a Hyderabad caterer matched to your event, with real packages and prices.",
  openGraph: {
    title: "Rajani — Hyderabad caterers, real prices upfront",
    description: "Find a Hyderabad caterer matched to your event, with real packages and prices.",
    siteName: "Rajani",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rajani — Hyderabad caterers, real prices upfront",
    description: "Find a Hyderabad caterer matched to your event, with real packages and prices.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-ivory font-sans text-ink">
        <header className="border-b border-border bg-surface/80 backdrop-blur">
          <div className="mx-auto flex w-full max-w-5xl items-center px-4 py-3">
            <Link
              href="/"
              className="rounded-sm text-xl font-semibold tracking-tight text-charcoal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600"
            >
              Rajani
            </Link>
          </div>
        </header>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
