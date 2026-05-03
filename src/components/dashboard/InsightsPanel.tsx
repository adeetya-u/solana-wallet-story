import type { WalletInsights } from "@/lib/solana/insights";
import { MAX_SIGNATURES } from "@/lib/solana/fetch";

const BAR_PALETTE = [
  "bg-gradient-to-r from-violet-500 to-fuchsia-500",
  "bg-gradient-to-r from-sky-500 to-cyan-400",
  "bg-gradient-to-r from-amber-500 to-orange-500",
  "bg-gradient-to-r from-emerald-500 to-teal-400",
  "bg-gradient-to-r from-rose-500 to-pink-500",
];

type Props = {
  insights: WalletInsights;
  /** More ledger rows still decoding */
  streaming?: boolean;
};

/** Skeleton layout so the visualization region is visible while RPC warms up. */
export function InsightsPanelSkeleton({
  signatureTargetHint,
}: {
  /** When known, shown under the title (e.g. “Found 24 actions to chart”). */
  signatureTargetHint: number | null;
}) {
  return (
    <div
      id="solpeek-visualization"
      className="scroll-mt-28 space-y-6"
      aria-busy="true"
      aria-label="Loading visualization"
    >
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-violet-200/80 pb-4 dark:border-violet-900/70">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-violet-600 dark:text-violet-400">
            Visualization
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-white">
            Your charts appear here—seconds, not silence
          </h2>
          <p className="mt-2 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
            {signatureTargetHint !== null ? (
              <>
                Locked onto{" "}
                <strong className="text-violet-700 dark:text-violet-300">
                  {signatureTargetHint}
                </strong>{" "}
                recent ledger actions—painting colored bars once each move is decoded.
              </>
            ) : (
              <>Finding recent public actions for this wallet, then fetching chart data…</>
            )}
          </p>
        </div>
      </header>
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-3xl bg-gradient-to-br from-zinc-200 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900"
          />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-3xl bg-gradient-to-r from-violet-100/70 via-fuchsia-100/50 to-cyan-100/70 dark:from-violet-950/40 dark:via-zinc-900 dark:to-cyan-950/30" />
      <div className="h-48 animate-pulse rounded-3xl bg-zinc-200/70 dark:bg-zinc-800" />
    </div>
  );
}

/** Plain-language charts for the bounded wallet synopsis. */
export function InsightsPanel({ insights, streaming = false }: Props) {
  const totalAttempts = insights.successfulTransactions + insights.failedTransactions;
  const okPct =
    totalAttempts === 0
      ? 0
      : Math.round((100 * insights.successfulTransactions) / totalAttempts);

  const activityRows = [
    {
      key: "swap",
      icon: "↔",
      label: "Trading & swap-style flows",
      sub: "DEX-style programs (shortcut label)",
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
      sub: "Validator vote program touches",
      count: insights.buckets.voteLike,
    },
    {
      key: "memo",
      icon: "📝",
      label: "Memo notes",
      sub: "Tiny on-chain labels",
      count: insights.buckets.memoLike,
    },
  ];

  const maxBucket = Math.max(1, ...activityRows.map((r) => r.count));
  const maxProgramHits = Math.max(
    1,
    ...insights.topPrograms.map((r) => r.count),
  );

  return (
    <div
      id="solpeek-visualization"
      className="grid gap-8 scroll-mt-28"
    >
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-violet-200/70 pb-4 dark:border-violet-900/60">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-violet-600 dark:text-violet-400">
            Visualization
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            At-a-glance story
          </h2>
        </div>
        {streaming && (
          <div className="rounded-full bg-amber-100 px-4 py-2 text-xs font-semibold text-amber-950 shadow-sm ring-1 ring-amber-300 dark:bg-amber-950/50 dark:text-amber-100 dark:ring-amber-800">
            Live fill · decoded {insights.fetchedTransactions}/{insights.fetchedSignatures}
          </div>
        )}
      </header>

      <div className="rounded-3xl border-2 border-violet-300/70 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-6 shadow-lg shadow-violet-500/10 dark:border-violet-700/60 dark:from-violet-950/50 dark:via-zinc-950 dark:to-fuchsia-950/30">
        <p className="max-w-2xl text-pretty text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          We skim the&nbsp;
          <strong className="text-violet-700 dark:text-violet-300">
            newest {insights.fetchedSignatures} public actions
          </strong>
          {" "}
          (up to {MAX_SIGNATURES}). Think of each bar as&nbsp;
          <em>how often those actions brushed different parts of Solana recently</em>—not a full
          life story on-chain. One action can trip multiple buckets.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <GlowStat
          label="Moves sampled"
          value={insights.fetchedSignatures}
          hint="Fingerprints fetched from the ledger"
          className="from-sky-500/15 to-violet-500/15 ring-sky-300/80 dark:ring-sky-600/60"
          valueClass="text-sky-600 dark:text-sky-300"
        />
        <GlowStat
          label="Succeeded"
          value={insights.successfulTransactions}
          hint="Completed cleanly in this slice"
          className="from-emerald-500/15 to-teal-500/15 ring-emerald-300/70 dark:ring-emerald-600/60"
          valueClass="text-emerald-600 dark:text-emerald-300"
        />
        <GlowStat
          label="Ran into trouble"
          value={insights.failedTransactions}
          hint="Errors surfaced in sampled moves"
          className="from-rose-500/15 to-orange-400/15 ring-rose-300/70 dark:ring-rose-600/60"
          valueClass="text-rose-600 dark:text-rose-300"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-inner dark:border-zinc-700 dark:bg-zinc-900 lg:col-span-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            Success mix
          </p>
          <p className="mt-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
            In this snippet:{" "}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {insights.successfulTransactions} clears
            </span>{" "}
            •{" "}
            <span className="font-semibold text-rose-600 dark:text-rose-400">
              {insights.failedTransactions} hiccups
            </span>
          </p>
          {totalAttempts > 0 ? (
            <SuccessRing pct={okPct} />
          ) : (
            <p className="mt-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              No success/error mix until we parse at least one move.
            </p>
          )}
          <p className="mt-2 text-center font-mono text-3xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
            {totalAttempts === 0 ? "—" : `${okPct}%`}
            <span className="mt-2 block text-xs font-normal text-zinc-500">
              emerald = smooth · pink = bumped an error flag
            </span>
          </p>
          <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
            Pie only counts parsed moves we fetched ({insights.fetchedTransactions} total)—not everything
            the wallet ever did.
          </p>
        </div>

        <div className="space-y-4 rounded-3xl border border-zinc-200 bg-gradient-to-b from-white to-violet-50/40 p-6 dark:border-zinc-700 dark:from-zinc-900 dark:to-violet-950/30 lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            Where actions showed up on Solana
          </p>
          <div className="flex flex-wrap gap-2 text-xs font-medium">
            <span className="rounded-full bg-white/70 px-2 py-1 text-zinc-600 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-600">
              Longer bars = more touches inside this snippet
            </span>
          </div>
          <ul className="mt-4 space-y-5">
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
                      <span className="text-lg" aria-hidden>
                        {row.icon}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {row.label}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{row.sub}</p>
                      </div>
                    </div>
                    <span className="tabular-nums text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                      {row.count}
                      <span className="ml-1 text-xs font-normal text-zinc-500">
                        ({pct}%*)
                      </span>
                    </span>
                  </div>
                  <div className="mt-2 h-3 overflow-hidden rounded-full bg-zinc-200/70 dark:bg-zinc-700/70">
                    <div
                      className={`${grad} h-full rounded-full shadow-sm transition-all duration-700`}
                      style={{ width: insights.fetchedTransactions ? w : "0%" }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-6 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            *Percent = touches ÷ fetched moves (categories overlap, so percentages can surprise you).
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          Who it talks to (programs)
        </p>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          These are&nbsp;
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {insights.uniqueProgramsCount} different programs{" "}
          </span>
          touched in sampled moves—not people or companies—just on-chain routines.
        </p>
        <ul className="mt-6 space-y-4">
          {insights.topPrograms.length === 0 && (
            <li className="rounded-xl bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
              {streaming
                ? "Program leaderboard fills in while we decode more moves…"
                : "No program touches in decoded moves yet."}
            </li>
          )}
          {insights.topPrograms.map((row, idx) => {
            const frac = `${Math.round((100 * row.count) / maxProgramHits)}%`;
            const tint = PROGRAM_ROW_TINTS[idx % PROGRAM_ROW_TINTS.length];
            return (
              <li key={row.programId}>
                <div className="flex items-start justify-between gap-3 font-mono text-[11px] text-zinc-600 dark:text-zinc-400 sm:text-xs">
                  <span
                    className="min-w-0 flex-1 break-all rounded-md bg-zinc-50 px-2 py-1 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
                    title={row.programId}
                  >
                    {truncateMid(row.programId, 44)}
                  </span>
                  <span className="shrink-0 font-semibold text-zinc-900 dark:text-zinc-100">
                    ×{row.count}
                  </span>
                </div>
                <div className={`mt-1.5 h-2 overflow-hidden rounded-full ${tint.track}`}>
                  <div
                    className={`h-full rounded-full ${tint.bar} shadow`}
                    style={{ width: frac }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="rounded-3xl border border-dashed border-fuchsia-300/70 bg-gradient-to-r from-violet-100/80 via-transparent to-fuchsia-100/50 p-6 text-sm text-zinc-700 dark:border-fuchsia-800/70 dark:from-violet-950/40 dark:via-transparent dark:to-fuchsia-950/30 dark:text-zinc-200">
        <p className="font-semibold text-zinc-900 dark:text-white">Time slice on the ledger</p>
        <p className="mt-3 font-mono text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
          Slot numbers {insights.oldestFetchedSlot ?? "—"} → {insights.newestFetchedSlot ?? "—"} mark how “deep” those sampled moves stretch on Solana—not when the wallet was born.
        </p>
      </div>
    </div>
  );
}

const PROGRAM_ROW_TINTS = [
  { track: "bg-indigo-100 dark:bg-indigo-950/70", bar: "bg-gradient-to-r from-indigo-500 to-violet-600" },
  { track: "bg-cyan-100 dark:bg-cyan-950/70", bar: "bg-gradient-to-r from-cyan-500 to-sky-500" },
  { track: "bg-amber-100 dark:bg-amber-950/70", bar: "bg-gradient-to-r from-amber-500 to-yellow-500" },
  { track: "bg-emerald-100 dark:bg-emerald-950/70", bar: "bg-gradient-to-r from-emerald-500 to-lime-500" },
  { track: "bg-rose-100 dark:bg-rose-950/70", bar: "bg-gradient-to-r from-rose-500 to-orange-400" },
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
      className={`rounded-3xl bg-gradient-to-br px-6 py-5 ring-2 ring-inset backdrop-blur-sm ${className}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
        {label}
      </p>
      <p className={`mt-3 text-4xl font-bold tabular-nums ${valueClass}`}>{value}</p>
      <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">{hint}</p>
    </div>
  );
}

function SuccessRing({ pct }: { pct: number }) {
  const clipped = Math.max(0, Math.min(100, pct));
  return (
    <div className="mx-auto mt-6 flex justify-center" role="img" aria-label={`${clipped}% of sampled moves succeeded`}>
      <div className="relative size-44">
        <div
          className="absolute inset-0 rounded-full shadow-md"
          style={{
            background: `conic-gradient(rgb(52 211 153) ${clipped * 3.6}deg, rgb(244 114 182) 0deg)`,
          }}
        />
        <div className="absolute inset-[13%] rounded-full bg-white shadow-inner dark:bg-zinc-950" />
      </div>
    </div>
  );
}
