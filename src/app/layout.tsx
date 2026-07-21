import type { Metadata } from "next";
import Link from "next/link";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rajani — Hyderabad caterers, real prices upfront",
  description: "Find a Hyderabad caterer matched to your event, with real packages and prices.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-ivory font-sans text-ink">
        <header className="border-b border-border bg-surface">
          <div className="mx-auto flex w-full max-w-5xl items-center px-4 py-3">
            <Link
              href="/"
              className="rounded-sm font-serif text-xl font-semibold text-charcoal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600"
            >
              Rajani
            </Link>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
