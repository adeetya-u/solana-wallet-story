import Link from "next/link";
import { demoDashboardHref } from "@/lib/solana/demo";

export default function Home() {
  const demoHref = demoDashboardHref();
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-4 pb-20 pt-12 sm:px-6 lg:gap-14 lg:pt-16">
      <div className="max-w-2xl space-y-6">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-teal-700 dark:text-teal-400">
          Solpeek
        </p>
        <h1 className="text-balance text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 sm:text-[2.65rem] sm:leading-tight">
          Read-only clarity for any Solana address.
        </h1>
        <p className="max-w-xl text-[17px] leading-relaxed text-slate-600 dark:text-slate-400">
          Paste a public address{" "}
          <code className="rounded-md border border-slate-200 bg-white px-2 py-0.5 font-mono text-[13px] text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            /dashboard?address=…
          </code>{" "}
          for charts, shareable links, and a bounded snapshot—no seed phrase or custody.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href={demoHref}
          className="inline-flex items-center justify-center rounded-md bg-teal-600 px-6 py-2.5 text-[14px] font-semibold text-white shadow-sm transition hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600"
        >
          View demo
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-6 py-2.5 text-[14px] font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 dark:hover:bg-slate-900"
        >
          Use my wallet
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-[var(--surface)] p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
          <h2 className="text-[15px] font-semibold text-slate-900 dark:text-slate-50">
            Program-level view
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-slate-600 dark:text-slate-400">
            See where activity clusters—tokens, swaps, NFT tooling—without drowning in raw transaction IDs.
          </p>
        </section>
        <section className="rounded-xl border border-slate-200 bg-[var(--surface)] p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
          <h2 className="text-[15px] font-semibold text-slate-900 dark:text-slate-50">
            Shareable & bounded
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-slate-600 dark:text-slate-400">
            Every view is anchored on a deterministic URL—a recent-window sample, open source and self-hostable.
          </p>
        </section>
        <section className="rounded-xl border border-slate-200 bg-[var(--surface)] p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
          <h2 className="text-[15px] font-semibold text-slate-900 dark:text-slate-50">
            Read-only by design
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-slate-600 dark:text-slate-400">
            Ledger reads only. Labels are heuristic clues—not legal or compliance adjudication.
          </p>
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-teal-50/50 p-6 dark:border-teal-900/40 dark:bg-teal-950/25">
        <h2 className="text-[15px] font-semibold text-teal-950 dark:text-teal-50">
          Open stack, deterministic depth
        </h2>
        <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-teal-900/85 dark:text-teal-100/85">
          MIT-licensed UI you can rerun behind IAM and your own RPC. Not a sanctioned-party database or full-history indexer—paired well with tighter internal tooling downstream.
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-[var(--surface)] p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/60 md:grid md:grid-cols-2 md:gap-8">
        <div>
          <h2 className="text-[15px] font-semibold text-slate-900 dark:text-slate-50">Heuristic labels</h2>
          <p className="mt-3 text-[14px] leading-relaxed text-slate-600 dark:text-slate-400">
            Categories like swap-style touches are fingerprints from observed program IDs. When you need production-grade tagging, plug in audited indexers—we stay intentionally lightweight above the RPC plane.
          </p>
        </div>
        <div className="mt-6 md:mt-0">
          <h2 className="text-[15px] font-semibold text-slate-900 dark:text-slate-50">Built with</h2>
          <ul className="mt-3 list-inside list-disc space-y-1.5 text-[14px] text-slate-600 dark:text-slate-400">
            <li>Next.js on Vercel</li>
            <li>Wallet adapter + Solana web3 reads</li>
            <li>Optional Solana Actions tip endpoint</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
