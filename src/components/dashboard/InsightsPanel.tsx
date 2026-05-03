import type { WalletInsights } from "@/lib/solana/insights";
import { MAX_SIGNATURES } from "@/lib/solana/fetch";

const BAR_PALETTE = [
  "bg-gradient-to-r from-teal-600 to-cyan-500",
  "bg-gradient-to-r from-slate-600 to-slate-500",
  "bg-gradient-to-r from-amber-500 to-orange-600",
  "bg-gradient-to-r from-emerald-600 to-teal-500",
  "bg-gradient-to-r from-blue-600 to-sky-500",
];

type Props = {
  insights: WalletInsights;
  streaming?: boolean;
};

export function InsightsPanelSkeleton({
  signatureTargetHint,
}: {
  signatureTargetHint: number | null;
}) {
  return (
    <div
      id="solpeek-visualization"
      className="scroll-mt-24 space-y-6"
      aria-busy="true"
      aria-label="Loading visualization"
    >
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-700">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-teal-700 dark:text-teal-400">
            Visualization
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Charts load progressively
          </h2>
          <p className="mt-2 max-w-xl text-[14px] text-slate-600 dark:text-slate-400">
            {signatureTargetHint !== null ? (
              <>
                Targeting{" "}
                <strong className="text-teal-800 dark:text-teal-300">
                  {signatureTargetHint}
                </strong>{" "}
                recent actions—decoded rows stream into the visuals below.
              </>
            ) : (
              <>Resolving signatures, then fetching transaction payloads…</>
            )}
          </p>
        </div>
      </header>
      <div className="grid gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-[7.25rem] animate-pulse rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-900"
          />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl border border-slate-200 bg-gradient-to-r from-slate-100 via-slate-50 to-teal-50/70 dark:border-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-teal-950/40" />
      <div className="h-40 animate-pulse rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900" />
    </div>
  );
}

export function InsightsPanel({ insights, streaming = false }: Props) {
  const totalAttempts =
    insights.successfulTransactions + insights.failedTransactions;
  const okPct =
    totalAttempts === 0
      ? 0
      : Math.round((100 * insights.successfulTransactions) / totalAttempts);

  const activityRows = [
    {
      key: "swap",
      icon: "↔",
      label: "Trading & swap-style flows",
      sub: "DEX-style programs (heuristic)",
      count: insights.buckets.swapLike,
    },
    {
      key: "token",
      icon: "🪙",
      label: "Token moves",
      sub: "SPL token programs",
      count: insights.buckets.splTokenLike,
    },
    {
      key: "nft",
      icon: "🖼",
      label: "NFT collections & metadata",
      sub: "Metaplex-related touches",
      count: insights.buckets.metadataLike,
    },
    {
      key: "vote",
      icon: "🗳",
      label: "Network voting",
      sub: "Validator vote program",
      count: insights.buckets.voteLike,
    },
    {
      key: "memo",
      icon: "📝",
      label: "Memo notes",
      sub: "On-chain labels",
      count: insights.buckets.memoLike,
    },
  ];

  const maxBucket = Math.max(1, ...activityRows.map((r) => r.count));
  const maxProgramHits = Math.max(
    1,
    ...insights.topPrograms.map((r) => r.count),
  );

  const cardWrap =
    "rounded-xl border border-slate-200 bg-[var(--surface)] shadow-sm dark:border-slate-800 dark:bg-slate-950/50";

  return (
    <div id="solpeek-visualization" className="scroll-mt-24 grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-700">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-teal-700 dark:text-teal-400">
            Visualization
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Synopsis
          </h2>
          <p className="sr-only">
            Charts and percentages for sampled recent activity
          </p>
        </div>
        {streaming && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100">
            Streaming · {insights.fetchedTransactions}/{insights.fetchedSignatures}
          </div>
        )}
      </header>

      <div className={`${cardWrap} bg-teal-50/40 p-5 dark:bg-teal-950/20`}>
        <p className="max-w-2xl text-pretty text-[14px] leading-relaxed text-slate-700 dark:text-slate-300">
          Sample of the&nbsp;
          <strong className="font-semibold text-teal-800 dark:text-teal-300">
            newest {insights.fetchedSignatures} public actions
          </strong>
          &nbsp;(cap {MAX_SIGNATURES}). Bars show how often each flavor of program appeared in those
          rows—overlap across categories is normal.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <GlowStat
          label="Moves sampled"
          value={insights.fetchedSignatures}
          hint="Ledger fingerprints in window"
          className="border-slate-200 ring-slate-200/70 dark:border-slate-700 dark:ring-slate-700"
          valueClass="text-teal-700 dark:text-teal-300"
        />
        <GlowStat
          label="Succeeded"
          value={insights.successfulTransactions}
          hint="Parsed without error flag"
          className="border-emerald-200/70 ring-emerald-100 dark:border-emerald-900 dark:ring-emerald-900/50"
          valueClass="text-emerald-700 dark:text-emerald-400"
        />
        <GlowStat
          label="Ran into trouble"
          value={insights.failedTransactions}
          hint="Failures in sample"
          className="border-rose-200/70 ring-rose-100 dark:border-rose-900 dark:ring-rose-900/40"
          valueClass="text-rose-700 dark:text-rose-400"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className={`${cardWrap} p-5 lg:col-span-1`}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            Success mix
          </p>
          <p className="mt-3 text-center text-[13px] text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {insights.successfulTransactions} ok
            </span>
            {" · "}
            <span className="font-semibold text-rose-600 dark:text-rose-400">
              {insights.failedTransactions} failed
            </span>
          </p>
          {totalAttempts > 0 ? (
            <SuccessRing pct={okPct} />
          ) : (
            <p className="mt-6 text-center text-[13px] text-slate-500 dark:text-slate-400">
              No parsed rows yet—ring appears after first decoded move.
            </p>
          )}
          <p className="mt-2 text-center font-mono text-2xl font-bold tabular-nums text-teal-700 dark:text-teal-300">
            {totalAttempts === 0 ? "—" : `${okPct}%`}
          </p>
          <p className="mt-4 text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">
            Based on {insights.fetchedTransactions} parsed moves in this pull—not lifetime history.
          </p>
        </div>

        <div className={`${cardWrap} space-y-3 p-5 lg:col-span-2`}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            Activity composition
          </p>
          <span className="inline-block rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[12px] text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            Bar length ∝ touches in snippet
          </span>
          <ul className="mt-3 space-y-4">
            {activityRows.map((row, idx) => {
              const pct = insights.fetchedTransactions
                ? Math.round((100 * row.count) / insights.fetchedTransactions)
                : 0;
              const w = `${Math.round((100 * row.count) / maxBucket)}%`;
              const grad = BAR_PALETTE[idx % BAR_PALETTE.length]!;
              return (
                <li key={row.key}>
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base opacity-90" aria-hidden>
                        {row.icon}
                      </span>
                      <div>
                        <p className="text-[14px] font-medium text-slate-900 dark:text-slate-100">
                          {row.label}
                        </p>
                        <p className="text-[12px] text-slate-500 dark:text-slate-400">{row.sub}</p>
                      </div>
                    </div>
                    <span className="tabular-nums text-[13px] font-semibold text-slate-800 dark:text-slate-100">
                      {row.count}{" "}
                      <span className="font-normal text-slate-500">({pct}%*)</span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-sm bg-slate-200 dark:bg-slate-800">
                    <div
                      className={`${grad} h-full rounded-sm transition-all duration-700`}
                      style={{ width: insights.fetchedTransactions ? w : "0%" }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="pt-2 text-[11px] text-slate-500 dark:text-slate-400">
            *Touches ÷ parsed moves—categories overlap.
          </p>
        </div>
      </div>

      <div className={`${cardWrap} p-5`}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          Top programs (address → hits)
        </p>
        <p className="mt-2 text-[14px] text-slate-600 dark:text-slate-400">
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {insights.uniqueProgramsCount} distinct program IDs
          </span>
          {" "}in sampled rows.
        </p>
        <ul className="mt-5 space-y-3">
          {insights.topPrograms.length === 0 && (
            <li className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-[14px] text-slate-600 dark:border-slate-700 dark:text-slate-400">
              {streaming
                ? "Program ranking fills while additional rows decode…"
                : "No parsed program touches yet."}
            </li>
          )}
          {insights.topPrograms.map((row, idx) => {
            const frac = `${Math.round((100 * row.count) / maxProgramHits)}%`;
            const tint = PROGRAM_ROW_TINTS[idx % PROGRAM_ROW_TINTS.length];
            return (
              <li key={row.programId}>
                <div className="flex items-start justify-between gap-3 font-mono text-[11px] text-slate-600 dark:text-slate-400 sm:text-xs">
                  <span
                    className="min-w-0 flex-1 break-all rounded border border-slate-100 bg-slate-50 px-2 py-1 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                    title={row.programId}
                  >
                    {truncateMid(row.programId, 44)}
                  </span>
                  <span className="shrink-0 font-semibold text-slate-900 dark:text-slate-100">
                    ×{row.count}
                  </span>
                </div>
                <div className={`mt-1 h-2 overflow-hidden rounded-sm ${tint.track}`}>
                  <div
                    className={`h-full rounded-sm ${tint.bar}`}
                    style={{ width: frac }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className={`${cardWrap} border-dashed p-5`}>
        <p className="text-[14px] font-semibold text-slate-900 dark:text-slate-50">
          Slot interval (sample depth)
        </p>
        <p className="mt-3 font-mono text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
          {insights.oldestFetchedSlot ?? "—"} → {insights.newestFetchedSlot ?? "—"}
        </p>
      </div>
    </div>
  );
}

const PROGRAM_ROW_TINTS = [
  { track: "bg-slate-200 dark:bg-slate-800", bar: "bg-gradient-to-r from-teal-600 to-cyan-600" },
  { track: "bg-slate-200 dark:bg-slate-800", bar: "bg-gradient-to-r from-sky-600 to-blue-600" },
  { track: "bg-slate-200 dark:bg-slate-800", bar: "bg-gradient-to-r from-amber-500 to-orange-600" },
  { track: "bg-slate-200 dark:bg-slate-800", bar: "bg-gradient-to-r from-emerald-600 to-teal-600" },
  { track: "bg-slate-200 dark:bg-slate-800", bar: "bg-gradient-to-r from-slate-600 to-slate-500" },
] as const;

function truncateMid(id: string, max: number): string {
  if (id.length <= max) return id;
  const edge = Math.floor((max - 3) / 2);
  return `${id.slice(0, edge)}…${id.slice(-edge)}`;
}

function GlowStat({
  label,
  value,
  hint,
  className,
  valueClass,
}: {
  label: string;
  value: number;
  hint: string;
  className: string;
  valueClass: string;
}) {
  return (
    <div
      className={`rounded-xl border bg-[var(--surface)] px-4 py-4 shadow-sm ring-1 ring-inset dark:bg-slate-950/60 ${className}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className={`mt-2 text-[2rem] font-semibold tabular-nums tracking-tight ${valueClass}`}>
        {value}
      </p>
      <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">{hint}</p>
    </div>
  );
}

function SuccessRing({ pct }: { pct: number }) {
  const clipped = Math.max(0, Math.min(100, pct));
  return (
    <div
      className="mx-auto mt-5 flex justify-center"
      role="img"
      aria-label={`${clipped}% of sampled moves succeeded`}
    >
      <div className="relative size-40">
        <div
          className="absolute inset-0 rounded-full shadow-inner"
          style={{
            background: `conic-gradient(rgb(13 148 136) ${clipped * 3.6}deg, rgb(244 114 182) 0deg)`,
          }}
        />
        <div className="absolute inset-[12%] rounded-full bg-[var(--surface)] dark:bg-slate-950" />
      </div>
    </div>
  );
}
