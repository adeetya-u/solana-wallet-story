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
          : "Failed to fetch chain data — try another RPC or cluster.";
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
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-4 py-14 sm:px-6 lg:gap-12 lg:py-16">
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
          <h1 className="text-balance bg-gradient-to-r from-violet-600 via-fuchsia-600 to-sky-500 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl">
            {explorerMode ? "Someone else’s Solana vibe check" : "Your Solana story (recent slice)"}
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
            <a
              href="#solpeek-visualization"
              className="rounded-full border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-800 hover:bg-violet-100 dark:border-violet-700 dark:bg-violet-950/50 dark:text-violet-200 dark:hover:bg-violet-950"
            >
              Jump to charts
            </a>
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

      {loading && !insights && (
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Pulling up to{" "}
          <strong className="text-violet-600 dark:text-violet-400">{MAX_SIGNATURES}</strong>{" "}
          recent public moves—colored bars appear below as soon as the first batch decodes (scroll
          if you’re on a small screen).
        </p>
      )}

      {loading && !insights && (
        <InsightsPanelSkeleton signatureTargetHint={signaturePreviewCount} />
      )}

      {insights && (
        <div className="grid gap-8">
          <InsightsPanel insights={insights} streaming={loading} />

          <div className="rounded-3xl border-2 border-dashed border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50 p-6 dark:border-teal-800 dark:from-teal-950/40 dark:to-cyan-950/30">
            <h3 className="text-lg font-semibold text-teal-900 dark:text-teal-50">
              Token geek mode
            </h3>
            <p className="mt-2 text-sm text-teal-800 dark:text-teal-200/85">
              Drop any SPL mint pubkey to peek how much balance this wallet still holds for that mint on the active network.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                className="w-full rounded-xl border border-teal-200 bg-white px-3 py-2.5 font-mono text-sm shadow-inner dark:border-teal-900 dark:bg-zinc-950"
                placeholder="Paste mint address"
                value={mintInput}
                onChange={(e) => setMintInput(e.target.value)}
              />
              <button
                type="button"
                className="rounded-xl bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-teal-500 dark:bg-teal-500"
                onClick={() => void tryMintSnap()}
              >
                Peek balance
              </button>
            </div>
            {mintResult && (
              <p className="mt-4 rounded-xl bg-white/80 px-3 py-2 font-mono text-sm text-teal-950 dark:bg-zinc-900 dark:text-teal-100">
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

