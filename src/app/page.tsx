import Link from "next/link";
import { demoDashboardHref } from "@/lib/solana/demo";

export default function Home() {
  const demoHref = demoDashboardHref();
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 py-14 sm:px-6 lg:gap-14 lg:py-20">
      <div className="space-y-5">
        <p className="text-sm font-medium uppercase tracking-wider text-violet-600 dark:text-violet-400">
          Solpeek
        </p>
        <h1 className="text-balance text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
          Understand any Solana wallet—in plain English and color.
        </h1>
        <p className="max-w-xl text-pretty text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">
          Paste a public address (
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-sm dark:bg-zinc-800">
            /dashboard?address=…
          </code>
          ) and instantly see{" "}
          <strong className="font-semibold text-zinc-900 dark:text-zinc-100">
            charts, percentages,{" "}
          </strong>
          and “what kind of Solana moves happened lately”—no seed phrase ever, wallet optional for your own vault.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href={demoHref}
          className="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/30 transition hover:from-violet-500 hover:to-fuchsia-500"
        >
          See the colorful demo
        </Link>
        <Link
          href="/dashboard"
          className="rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-white dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          Connect my wallet
        </Link>
      </div>

      <section className="rounded-3xl border-2 border-violet-200/80 bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-cyan-500/10 p-6 shadow-lg shadow-violet-500/5 dark:border-violet-800/70 dark:from-violet-950/50 dark:via-fuchsia-950/30 dark:to-cyan-950/20">
        <p className="text-lg font-semibold text-violet-950 dark:text-violet-50">
          Not a wall of nerd numbers
        </p>
        <p className="mt-3 leading-relaxed text-violet-900/95 dark:text-violet-100/90">
          Big exchanges and trading desks still obsess over spreadsheets. Solpeek is the opposite vibe: strip the noise,
          amplify the<strong className="mx-1 text-violet-600 dark:text-violet-300"> story beats</strong>
          wins vs errors, swaps vs NFT touches, busiest programs—all in gradients your PM or legal teammate can skim in
          ten seconds before someone dives deeper.
        </p>
      </section>

      <section className="rounded-3xl border border-teal-200/80 bg-gradient-to-r from-emerald-50 to-cyan-50 p-6 text-sm dark:border-teal-900/70 dark:from-emerald-950/40 dark:to-cyan-950/30">
        <p className="font-semibold text-emerald-900 dark:text-emerald-50">
          Why institutions still pick it up first
        </p>
        <p className="mt-3 leading-relaxed text-emerald-950/85 dark:text-emerald-50/95">
          You get<strong className="mx-1"> shareable snapshots</strong>
          anchored on a deterministic URL alongside open MIT code you can rerun behind IAM and your own RPC keys—not a mysterious black-box feed.
          It is<strong className="mx-1"> not</strong>
          KYC, sanctioned-party screening, or full history—it is the friendly prelude before heavyweight tooling.
        </p>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-zinc-50/90 p-5 text-sm text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100">
        <p className="font-medium text-zinc-900 dark:text-zinc-50">Private & capped</p>
        <p className="mt-2 leading-relaxed text-zinc-600 dark:text-zinc-400">
          Read-only lookups from Solana RPC only—nothing leaves your custody story except public chain facts. Highlights
          come from recent activity (small cap), never the entire lifetime reel.
        </p>
      </section>

      <section className="grid gap-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950 sm:grid-cols-2">
        <div>
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">Labels = clues, not court proof</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            “Swap-ish” badges are guesses from program fingerprints. When prosecutors get involved you still need audited
            indexers—we are the colored sticky notes beforehand.
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
