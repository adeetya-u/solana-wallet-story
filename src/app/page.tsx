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
          A quick read-only snapshot of any Solana address.
        </h1>
        <p className="max-w-xl text-pretty text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          Explore recent signatures, programs involved, and a short activity summary.
          Wallet connect is optional—use the demo link for a seeded mainnet account, paste
          an address yourself, or sign in when you’re ready.
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
