"use client";

import Link from "next/link";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { ClusterToggle } from "@/components/ClusterToggle";

export function Header() {
  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          Solpeek
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <nav className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
            <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-200">
              Home
            </Link>
            <Link
              href="/dashboard"
              className="hover:text-zinc-900 dark:hover:text-zinc-200"
            >
              Dashboard
            </Link>
          </nav>
          <ClusterToggle />
          <WalletMultiButton className="!bg-violet-600 hover:!bg-violet-700" />
        </div>
      </div>
    </header>
  );
}
