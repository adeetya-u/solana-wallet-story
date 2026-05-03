import Link from "next/link";
import {
  BarChart3,
  Cpu,
  ShieldCheck,
  Link2,
  type LucideIcon,
} from "lucide-react";
import { demoDashboardHref } from "@/lib/solana/demo";

function FeatureCard({
  icon: Icon,
  title,
  body,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-none">
      <Icon
        className="mb-3 size-5 text-[var(--accent)]"
        strokeWidth={2}
        aria-hidden
      />
      <h2 className="text-[15px] font-semibold text-[var(--foreground)]">{title}</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-[var(--muted)]">{body}</p>
    </section>
  );
}

export default function Home() {
  const demoHref = demoDashboardHref();
  return (
    <main className="mx-auto flex w-full max-w-[960px] flex-1 flex-col gap-14 px-4 pb-24 pt-12 sm:px-8 lg:pt-16">
      <div className="max-w-xl space-y-5">
        <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[var(--accent)] dark:opacity-90">
          Solpeek
        </p>
        <h1 className="text-balance text-[2.375rem] font-semibold leading-[1.08] tracking-tight text-[var(--foreground)] sm:text-[2.75rem]">
          Read-only Solana address summaries.
        </h1>
        <p className="max-w-lg text-[17px] leading-relaxed text-[var(--muted)]">
          Paste an address. Get a quick summary of recent on-chain activity.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href={demoHref}
          className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-[var(--accent)] px-7 text-[15px] font-semibold text-white transition hover:bg-[var(--accent-hover)]"
        >
          View demo
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-7 text-[15px] font-semibold text-[var(--foreground)] transition hover:bg-[var(--accent-muted)]"
        >
          Use my wallet
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <FeatureCard
          icon={BarChart3}
          title="Program rollups"
          body="A quick breakdown of what this address touched recently."
        />
        <FeatureCard
          icon={Link2}
          title="Shareable URLs"
          body="Open the same view later with a link."
        />
        <FeatureCard
          icon={ShieldCheck}
          title="Custody-neutral"
          body="Read-only. No seed phrase. No custody."
        />
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--accent-muted)] px-6 py-7 dark:bg-[var(--surface)]">
        <div className="flex items-start gap-3">
          <Cpu className="mt-0.5 size-5 shrink-0 text-[var(--accent)]" strokeWidth={2} aria-hidden />
          <div>
            <h2 className="text-[15px] font-semibold text-[var(--foreground)]">Run it yourself</h2>
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[var(--muted)]">
              MIT licensed. Host it and point it at your RPC.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
