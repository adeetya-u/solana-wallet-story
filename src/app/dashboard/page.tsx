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
  const router = useRouter();
  const searchParams = useSearchParams();
  const addressParamRaw = searchParams.get("address");
  const explorerKey = useMemo(() => parseExplorerPubkey(addressParamRaw), [
    addressParamRaw,
  ]);
  const isDemoAddress = addressParamRaw === DEMO_WALLET_MAINNET;

  const { cluster, setCluster } = useCluster();
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();

  useEffect(() => {
    if (isDemoAddress && cluster !== "mainnet-beta") {
      queueMicrotask(() => setCluster("mainnet-beta"));
    }
  }, [isDemoAddress, cluster, setCluster]);

  const targetKey =
    explorerKey ?? (!connected ? null : (publicKey ?? null));

  const [insights, setInsights] = useState<WalletInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pasteInput, setPasteInput] = useState("");

  const [mintInput, setMintInput] = useState("");
  const [mintResult, setMintResult] = useState<string | null>(null);

  const runInsights = useCallback(async () => {
    if (!targetKey) return;
    setLoading(true);
    setError(null);
    setInsights(null);
    try {
      const data = await loadWalletInsights(connection, targetKey);
      setInsights(data);
    } catch (e) {
      let msg =
        e instanceof Error
          ? e.message
          : "Failed to fetch chain data — try another RPC or cluster.";
      if (
        /403|Access forbidden/i.test(msg) ||
        (/Server responded with .*403/i.test(msg) && msg.includes("jsonrpc"))
      ) {
        msg +=
          " Set SOLANA_RPC_URL on Vercel (Helius or QuickNode mainnet HTTPS) so /api/solana-rpc relays from Vercel, not your browser.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [connection, targetKey]);

  useEffect(() => {
    if (!targetKey) return;
    queueMicrotask(() => {
      void runInsights();
    });
  }, [targetKey, cluster, runInsights]);

  const explorerMode = Boolean(explorerKey);

  const tryMintSnap = async () => {
    if (!targetKey) return;
    const trimmed = mintInput.trim();
    if (!trimmed) {
      setMintResult(null);
      return;
    }
    try {
      const mintPk = new PublicKey(trimmed);
      const snap = await loadMintSnapshot(connection, targetKey, mintPk);
      setMintResult(
        snap
          ? `Balance: ${snap.amountUi} (decimals ${snap.decimals})`
          : "No SPL account for this mint.",
      );
    } catch {
      setMintResult("Invalid mint address.");
    }
  };

  const goPaste = (e: React.FormEvent) => {
    e.preventDefault();
    const t = pasteInput.trim();
    if (!t) return;
    router.push(`/dashboard?address=${encodeURIComponent(t)}`);
  };

  if (!targetKey) {
    const paramInvalid =
      typeof addressParamRaw === "string" &&
      addressParamRaw.length > 0 &&
      !explorerKey;

    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">Analyze a wallet</h1>

        {paramInvalid && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-50">
            That address isn’t a valid Solana pubkey. Paste a base58 wallet or program ID.
          </p>
        )}

        <p className="text-zinc-600 dark:text-zinc-400">
          Jump in without connecting—browse a busy mainnet signer, then connect to
          see your own footprint.
        </p>

        <div className="flex flex-wrap gap-3">
          <Link
            href={demoDashboardHref()}
            className="rounded-full bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-700"
          >
            Watch live demo wallet
          </Link>
          <Link
            href="/"
            className="rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium hover:bg-white dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            ← Home
          </Link>
        </div>

        <form
          onSubmit={goPaste}
          className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <label className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
            Or paste any pubkey
          </label>
          <p className="mt-1 text-xs text-zinc-500">
            Read-only summaries on the cluster shown in the header (
            <span className="font-mono">{cluster}</span>).
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={pasteInput}
              onChange={(e) => setPasteInput(e.target.value)}
              placeholder="Solana Pubkey · base58"
              className="w-full flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Load
            </button>
          </div>
        </form>

        <p className="text-sm text-zinc-500">
          Already connected? Use the wallet button above and open{" "}
          <Link href="/dashboard" className="text-violet-600 dark:text-violet-400">
            /dashboard
          </Link>{" "}
          without an address param.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 py-14 sm:px-6 lg:gap-12 lg:py-16">
      {explorerMode ? (
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-50">
          <span className="font-medium">Live read-only view</span> · inspecting{" "}
          <span className="font-mono text-xs">{targetKey.toBase58()}</span>
          {connected && publicKey && (
            <span className="mt-2 block font-normal text-sky-800/90 dark:text-sky-100/85">
              You’re signed in as {publicKey.toBase58().slice(0, 4)}… — still
              showing the pasted address above.
            </span>
          )}
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-wide text-violet-600 dark:text-violet-400">
            Solpeek
          </p>
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {explorerMode
              ? "Public wallet footprint"
              : "Your recent on-chain activity"}
          </h1>
          <p className="break-all font-mono text-sm text-zinc-500">
            {targetKey.toBase58()}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={() => void runInsights()}
              disabled={loading}
              className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {loading ? "Refreshing…" : "Refresh"}
            </button>
            {explorerMode && (
              <Link
                href="/dashboard"
                className="rounded-full border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
              >
                Analyze connected wallet instead
              </Link>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
          <p className="font-medium">Something went wrong</p>
          <p className="mt-1 opacity-90">{error}</p>
        </div>
      )}

      {loading && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Loading bounded history from RPC…
        </p>
      )}

      {insights && !loading && (
        <div className="grid gap-6">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {insights.windowLabel}
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard title="Signatures" value={String(insights.fetchedSignatures)} />
            <StatCard
              title="Parsed OK"
              value={String(insights.successfulTransactions)}
            />
            <StatCard title="Failed" value={String(insights.failedTransactions)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Slot window (parsed txs)
              </h3>
              <p className="mt-3 font-mono text-sm text-zinc-600 dark:text-zinc-400">
                min {insights.oldestFetchedSlot ?? "—"} → max{" "}
                {insights.newestFetchedSlot ?? "—"}
              </p>
              <p className="mt-3 text-xs text-zinc-500">
                Narrow window covers only fetched transactions—not account inception.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Behavior hints (tx counts touching)
              </h3>
              <ul className="mt-3 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                <li>Swap-like (Jupiter v6 footprint): {insights.buckets.swapLike}</li>
                <li>SPL Token / Token-2022: {insights.buckets.splTokenLike}</li>
                <li>Metaplex metadata: {insights.buckets.metadataLike}</li>
                <li>Vote program: {insights.buckets.voteLike}</li>
                <li>Memo program: {insights.buckets.memoLike}</li>
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Top programs ({insights.uniqueProgramsCount} unique)
            </h3>
            <ul className="mt-4 space-y-2 font-mono text-xs">
              {insights.topPrograms.map((row) => (
                <li
                  key={row.programId}
                  className="flex justify-between gap-4 text-zinc-700 dark:text-zinc-300"
                >
                  <span className="truncate" title={row.programId}>
                    {row.programId}
                  </span>
                  <span className="shrink-0 text-zinc-500">{row.count}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-dashed border-zinc-300 p-5 dark:border-zinc-700">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              SPL mint snapshot
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              Paste a mint—for the pubkey above on this cluster.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                placeholder="Mint address"
                value={mintInput}
                onChange={(e) => setMintInput(e.target.value)}
              />
              <button
                type="button"
                className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                onClick={() => void tryMintSnap()}
              >
                Lookup
              </button>
            </div>
            {mintResult && (
              <p className="mt-3 font-mono text-sm text-zinc-700 dark:text-zinc-300">
                {mintResult}
              </p>
            )}
          </div>
        </div>
      )}
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
