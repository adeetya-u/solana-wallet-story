import Link from "next/link";
import { demoDashboardHref } from "@/lib/solana/demo";

export default function Home() {
  const demoHref = demoDashboardHref();
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 py-14 sm:px-6 lg:gap-14 lg:py-20">
      <div className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-wider text-violet-600 dark:text-violet-400">
          Solpeek
        </p>
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          A fast read-only snapshot of any Solana address.
        </h1>
        <p className="max-w-xl text-pretty text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          See who a wallet&nbsp;<span className="font-medium text-zinc-700 dark:text-zinc-300">actually touches on-chain</span>
          —top programs and a capped recent window—not an endless tx feed. Wallet connect is
          optional: open the demo, paste any pubkey as <code className="text-sm">/dashboard?address=…</code>
          {" "}for a shareable diligence link.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href={demoHref}
          className="rounded-full bg-violet-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-violet-700"
        >
          Try live demo
        </Link>
        <Link
          href="/dashboard"
          className="rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-white dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          Use my wallet
        </Link>
      </div>

      <section className="space-y-3 rounded-2xl border border-violet-200 bg-violet-50/70 p-5 text-sm text-violet-950 dark:border-violet-900/50 dark:bg-violet-950/30 dark:text-violet-50">
        <p className="font-semibold text-violet-900 dark:text-violet-100">
          Utility explorers don’t prioritize
        </p>
        <p className="leading-relaxed text-violet-900/85 dark:text-violet-100/90">
          Block explorers are built to scroll signatures. Solpeek summarizes{" "}
          <strong className="font-medium">program-level exposure</strong> and success vs failed
          txs in one bounded slice—cheap to run without an indexer, ideal when you’re vetting an
          OTC counterparty, spot-checking a treasury or market-maker wallet, or sanity-checking
          integrations (Jupiter, SPL, staking, NFT tooling) before you wire real flows.
        </p>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-zinc-50/90 p-5 text-sm text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100">
        <p className="font-medium text-zinc-900 dark:text-zinc-50">Read-only</p>
        <p className="mt-2 leading-relaxed text-zinc-600 dark:text-zinc-400">
          Solpeek pulls public ledger data via RPC—it never asks for your seed phrase.
          Insights cover a capped window of the newest activity, not full history.
        </p>
      </section>

      <section className="grid gap-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950 sm:grid-cols-2">
        <div>
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">Scope</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Labels such as swap-like references are heuristics based on observed program
            IDs—use an indexer-backed product when you need production-grade tagging.
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">Built with</h2>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
            <li>Next.js on Vercel</li>
            <li>Wallet adapter + Solana web3 reads</li>
            <li>Optional Solana Actions tip</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
