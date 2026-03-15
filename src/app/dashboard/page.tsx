"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useCluster } from "@/components/wallet/ClusterContext";
import { DEMO_WALLET_MAINNET, demoDashboardHref } from "@/lib/solana/demo";
import {
  loadMintSnapshot,
  loadWalletInsights,
  type WalletInsights,
} from "@/lib/solana/insights";

function DashboardSkeleton() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-16 sm:px-6">
      <p className="text-sm text-zinc-500">Loading dashboard…</p>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardInner />
    </Suspense>
  );
}

function DashboardInner() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 py-14 sm:px-6">
      <p className="text-zinc-600">Dashboard scaffolding.</p>
    </main>
  );
}

function parseExplorerPubkey(
  raw: string | null,
): PublicKey | null {
  if (!raw?.trim()) return null;
  try {
    return new PublicKey(raw.trim());
  } catch {
    return null;
  }
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
    </div>
  );
}
