"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { PublicKey } from "@solana/web3.js";
import { useCluster } from "@/components/wallet/ClusterContext";
import {
  InsightsPanel,
  InsightsPanelSkeleton,
} from "@/components/dashboard/InsightsPanel";
import { DEMO_WALLET_MAINNET, demoDashboardHref } from "@/lib/solana/demo";
import { MAX_SIGNATURES } from "@/lib/solana/fetch";
import {
  loadMintSnapshot,
  loadWalletInsightsProgressive,
  type WalletInsights,
} from "@/lib/solana/insights";

function DashboardSkeleton() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-16 sm:px-6">
      <p className="text-[14px] text-slate-500 dark:text-slate-400">
        Loading dashboard…
      </p>
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
  const [signaturePreviewCount, setSignaturePreviewCount] = useState<number | null>(
    null,
  );

  /** Drop stale resolves when deps change mid-flight or React Strict Mode double-invokes effects. */
  const insightsGenerationRef = useRef(0);
  const [pasteInput, setPasteInput] = useState("");

  const [mintInput, setMintInput] = useState("");
  const [mintResult, setMintResult] = useState<string | null>(null);

  const runInsights = useCallback(async () => {
    if (!targetKey) return;
    const generation = ++insightsGenerationRef.current;
    setLoading(true);
    setError(null);
    setInsights(null);
    setSignaturePreviewCount(null);
    try {
      await loadWalletInsightsProgressive(connection, targetKey, {
        onSignatures: (count) => {
          if (insightsGenerationRef.current !== generation) return;
          setSignaturePreviewCount(count);
        },
        onUpdate: (data, _complete) => {
          if (insightsGenerationRef.current !== generation) return;
          setInsights(data);
          setError(null);
        },
        shouldAbort: () => insightsGenerationRef.current !== generation,
      });
      if (insightsGenerationRef.current !== generation) return;
    } catch (e) {
      if (insightsGenerationRef.current !== generation) return;
      let msg =
        e instanceof Error
          ? e.message
          : "Failed to fetch chain data. Try another RPC or cluster.";
      const isRpc403 =
        /403|Access forbidden/i.test(msg) ||
        (/Server responded with .*403/i.test(msg) && msg.includes("jsonrpc"));
      if (/Batch requests|-32403|batch requests/i.test(msg)) {
        msg +=
          " Some RPC free tiers disallow JSON-RPC *batch* calls; Solpeek loads txs one-by-one. If this persists, confirm you deployed latest and check provider docs.";
      } else if (isRpc403) {
        msg +=
          " Set SOLANA_RPC_URL on Vercel (Helius or QuickNode mainnet HTTPS) so /api/solana-rpc relays from Vercel, not your browser.";
      } else if (
        /(^|\s)(429)(\s|:|$)/i.test(msg) ||
        /Too many requests/i.test(msg)
      ) {
        msg +=
          " RPC rate-limit: wait briefly, bump your provider plan if needed, or hit Refresh.";
      }
      setError(msg);
    } finally {
      if (insightsGenerationRef.current === generation) {
        setLoading(false);
      }
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
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-4 py-14 sm:px-6 lg:pb-20">
        <h1 className="text-[1.625rem] font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          Analyze a wallet
        </h1>

        {paramInvalid && (
          <p className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-[14px] text-amber-950 dark:border-amber-800 dark:bg-amber-950/35 dark:text-amber-50">
            That address isn’t a valid Solana pubkey. Paste a base58 wallet or program ID.
          </p>
        )}

        <p className="max-w-xl text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
          Open the demo wallet or paste an address. Read-only lookups follow the cluster switch in the header; nothing is custodied here.
        </p>

        <div className="flex flex-wrap gap-3">
          <Link
            href={demoDashboardHref()}
            className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-6 py-2.5 text-[14px] font-semibold text-white shadow-sm transition hover:bg-[var(--accent-hover)]"
          >
            Demo wallet
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-[var(--surface)] px-5 py-2.5 text-[14px] font-semibold text-slate-900 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
          >
            Home
          </Link>
        </div>

        <form
          onSubmit={goPaste}
          className="rounded-xl border border-slate-200 bg-[var(--surface)] p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/60"
        >
          <label className="text-[14px] font-semibold text-slate-900 dark:text-slate-50">
            Paste any pubkey
          </label>
          <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
            Cluster:{" "}
            <span className="font-mono text-slate-700 dark:text-slate-300">{cluster}</span>
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={pasteInput}
              onChange={(e) => setPasteInput(e.target.value)}
              placeholder="Solana address (base58)"
              className="w-full flex-1 rounded-md border border-slate-300 bg-white px-3 py-2.5 font-mono text-[13px] text-slate-900 outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--focus-ring)] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
            <button
              type="submit"
              className="rounded-md bg-slate-900 px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Load address
            </button>
          </div>
        </form>

        <p className="text-[13px] text-slate-500 dark:text-slate-400">
          Connected? Use the wallet control in the header, then open{" "}
          <Link
            href="/dashboard"
            className="font-semibold text-[var(--accent)] underline underline-offset-4 hover:text-[var(--accent-hover)]"
          >
            /dashboard
          </Link>{" "}
          without a query parameter.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-4 pb-20 pt-12 sm:px-6 lg:gap-12 lg:pt-14">
      {explorerMode ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100">
          <span className="font-medium text-slate-600 dark:text-slate-400">Explorer · </span>
          <span className="font-mono text-[12px]">{targetKey.toBase58()}</span>
          {connected && publicKey && (
            <span className="mt-2 block text-slate-600 dark:text-slate-400">
              Wallet connected; view above reflects pasted address only.
            </span>
          )}
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6 dark:border-slate-800">
        <div className="space-y-3">
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            Overview
          </p>
          <h1 className="max-w-xl text-[1.625rem] font-semibold tracking-tight text-slate-900 dark:text-slate-50 sm:text-[1.875rem] sm:leading-tight">
            {explorerMode ? "External address overview" : "Connected address overview"}
          </h1>
          <p className="break-all font-mono text-[13px] text-slate-500 dark:text-slate-400">
            {targetKey.toBase58()}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => void runInsights()}
              disabled={loading}
              className="rounded-full border border-transparent bg-[var(--accent)] px-5 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-[var(--accent-hover)] disabled:opacity-55"
            >
              {loading ? "Loading…" : "Refresh"}
            </button>
            <a
              href="#solpeek-visualization"
              className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-2 text-[13px] font-semibold text-[var(--foreground)] hover:bg-[var(--accent-muted)] dark:hover:bg-neutral-900"
            >
              Charts
            </a>
            {explorerMode && (
              <Link
                href="/dashboard"
                className="rounded-full border border-[var(--border)] px-5 py-2 text-[13px] font-semibold text-[var(--foreground)] hover:bg-[var(--accent-muted)] dark:hover:bg-neutral-900"
              >
                Your wallet
              </Link>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-[14px] text-amber-950 dark:border-amber-900 dark:bg-amber-950/35 dark:text-amber-50">
          <p className="font-semibold">Request failed</p>
          <p className="mt-1 opacity-95">{error}</p>
        </div>
      )}

      {loading && !insights && (
        <p className="text-[13px] text-slate-600 dark:text-slate-400">
          Loading up to {MAX_SIGNATURES} signatures. Charts appear below while data streams in.
        </p>
      )}

      {loading && !insights && (
        <InsightsPanelSkeleton signatureTargetHint={signaturePreviewCount} />
      )}

      {insights && (
        <div className="grid gap-8">
          <InsightsPanel insights={insights} streaming={loading} />

          <div className="rounded-xl border border-dashed border-slate-300 bg-[var(--surface)] p-6 shadow-sm dark:border-slate-600 dark:bg-slate-950/50">
            <h3 className="text-[15px] font-semibold text-slate-900 dark:text-slate-50">
              SPL mint balance
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
              Optional: enter a mint address to read token balance on the selected cluster.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-[13px] dark:border-slate-700 dark:bg-slate-950"
                placeholder="Mint address"
                value={mintInput}
                onChange={(e) => setMintInput(e.target.value)}
              />
              <button
                type="button"
                className="rounded-full bg-[var(--accent)] px-6 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-[var(--accent-hover)]"
                onClick={() => void tryMintSnap()}
              >
                Lookup balance
              </button>
            </div>
            {mintResult && (
              <p className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-[13px] text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
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

