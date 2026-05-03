"use client";

import Link from "next/link";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { ClusterToggle } from "@/components/ClusterToggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-md dark:bg-[var(--surface)]/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="size-2 shrink-0 rounded-sm bg-teal-600 dark:bg-teal-400" aria-hidden />
          <span className="text-slate-900 dark:text-slate-50">Solpeek</span>
        </Link>

        <div className="flex flex-wrap items-center justify-end gap-3 sm:gap-4">
          <nav className="hidden gap-8 text-[13px] font-medium text-slate-600 sm:flex dark:text-slate-400">
            <Link href="/" className="transition hover:text-slate-900 dark:hover:text-slate-100">
              Home
            </Link>
            <Link
              href="/dashboard"
              className="transition hover:text-slate-900 dark:hover:text-slate-100"
            >
              Dashboard
            </Link>
          </nav>
          <ClusterToggle />
          <WalletMultiButton className="!text-[13px] !font-medium" />
          <nav className="flex gap-4 text-[13px] font-medium text-slate-600 sm:hidden dark:text-slate-400">
            <Link href="/" className="hover:text-slate-900 dark:hover:text-slate-100">
              Home
            </Link>
            <Link href="/dashboard" className="hover:text-slate-900 dark:hover:text-slate-100">
              Dashboard
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
