import { appConfig } from "@/lib/env";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { NavWrapper } from "@/components/nav-wrapper";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: appConfig.appName,
  description: "Next.js frontend demo wired to Talkhead backend auth APIs.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-6">
          <header className="flex items-center justify-between border-b border-slate-800 pb-5">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500">
                <span className="text-xs font-bold text-white">T</span>
              </div>
              <span className="text-sm font-semibold text-slate-100">{appConfig.appName}</span>
            </Link>
            <Suspense fallback={<div className="h-8 w-32 rounded-lg bg-slate-800/50 animate-pulse" />}>
              <NavWrapper />
            </Suspense>
          </header>

          <main className="flex flex-1 items-center justify-center py-12">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
