"use client";

import Link from "next/link";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { ClusterToggle } from "@/components/ClusterToggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-6 px-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5 text-[17px] font-semibold tracking-tight text-[var(--foreground)]">
          <span className="size-2 shrink-0 rounded-full bg-[var(--accent)]" aria-hidden />
          <span>Solpeek</span>
        </Link>

        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <nav className="hidden items-center gap-10 text-[14px] font-medium text-[var(--muted)] sm:flex">
            <Link href="/" className="transition hover:text-[var(--foreground)]">
              Home
            </Link>
            <Link href="/dashboard" className="transition hover:text-[var(--foreground)]">
              Dashboard
            </Link>
          </nav>
          <ClusterToggle />
          <WalletMultiButton className="!text-[13px] !font-semibold !normal-case" />
          <nav className="flex items-center gap-6 text-[14px] font-medium text-[var(--muted)] sm:hidden">
            <Link href="/" className="hover:text-[var(--foreground)]">
              Home
            </Link>
            <Link href="/dashboard" className="hover:text-[var(--foreground)]">
              Dashboard
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
