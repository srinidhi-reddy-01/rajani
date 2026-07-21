import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Catering — Hyderabad caterers, instant quotes",
  description: "Browse Hyderabad caterers with live, per-plate computed quotes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ivory text-ink">
        <header className="border-b border-border bg-surface">
          <div className="mx-auto flex w-full max-w-5xl items-center px-6 py-4">
            <Link
              href="/"
              className="rounded-sm text-lg font-semibold text-royal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600"
            >
              Catering
            </Link>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
