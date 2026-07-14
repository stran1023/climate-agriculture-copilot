import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { CopilotPanel } from "@/components/CopilotPanel";
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
  title: "FarmTwin AI Copilot",
  description: "AI decision-intelligence copilot for a living digital twin farm",
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
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-black">
        <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <nav className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-4 text-sm font-medium">
            <Link href="/" className="text-zinc-950 dark:text-zinc-50">
              Farm
            </Link>
            <Link href="/briefing" className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50">
              Daily Briefing
            </Link>
          </nav>
        </header>
        <main className="w-full flex-1 px-6 py-8">{children}</main>
        <CopilotPanel />
      </body>
    </html>
  );
}
