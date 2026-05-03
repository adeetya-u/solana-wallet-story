import {
  ArrowRightLeft,
  ArrowDownRight,
  ArrowUpRight,
  Coins,
  FileText,
  ImageIcon,
  Minus,
  Sparkles,
  Network,
  Braces,
  Vote,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { WalletInsights } from "@/lib/solana/insights";
import { MAX_SIGNATURES } from "@/lib/solana/fetch";
import { buildBehaviorFingerprint } from "@/lib/fingerprint/behavior";
import {
  computeWhatChanged,
  loadSnapshot,
  saveSnapshot,
} from "@/lib/fingerprint/snapshot";
import { getTrainedModel, matchCluster } from "@/lib/fingerprint/trained";

const BAR_PALETTE = [
  "bg-gradient-to-r from-emerald-600 to-green-400",
  "bg-gradient-to-r from-slate-600 to-slate-500",
  "bg-gradient-to-r from-amber-500 to-orange-600",
  "bg-gradient-to-r from-green-600 to-emerald-500",
  "bg-gradient-to-r from-blue-600 to-sky-500",
];

type Props = {
  insights: WalletInsights;
  streaming?: boolean;
  address?: string;
  cluster?: string;
  complete?: boolean;
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
      aria-label="Loading charts"
    >
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-700">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-400">
            Summary
          </p>
          <h2 className="sr-only">Activity summary charts</h2>
          <p className="mt-1 max-w-xl text-[13px] text-slate-600 dark:text-slate-400">
            {signatureTargetHint !== null ? (
              <>
                Fetching payloads for{" "}
                <span className="font-medium tabular-nums">{signatureTargetHint}</span> signatures…
              </>
            ) : (
              <>Resolving signature list…</>
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
      <div className="h-64 animate-pulse rounded-xl border border-slate-200 bg-gradient-to-r from-slate-100 via-[var(--accent-muted)]/40 to-green-50/70 dark:border-slate-800 dark:from-slate-900 dark:via-neutral-950 dark:to-[var(--accent-muted)]" />
      <div className="h-40 animate-pulse rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900" />
    </div>
  );
}

export function InsightsPanel({
  insights,
  streaming = false,
  address,
  cluster,
  complete = true,
}: Props) {
  const totalAttempts =
    insights.successfulTransactions + insights.failedTransactions;
  const okPct =
    totalAttempts === 0
      ? 0
      : Math.round((100 * insights.successfulTransactions) / totalAttempts);

  const fingerprint = useMemo(
    () => buildBehaviorFingerprint(insights),
    [insights],
  );

  const [clusterMatch, setClusterMatch] = useState<ReturnType<typeof matchCluster> | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      if (insights.fetchedTransactions <= 0) {
        setClusterMatch(null);
        return;
      }
      const model = await getTrainedModel();
      if (!alive) return;
      if (!model) {
        setClusterMatch(null);
        return;
      }
      setClusterMatch(matchCluster(insights, model));
    })();
    return () => {
      alive = false;
    };
  }, [insights]);

  const previous = useMemo(() => {
    if (!address || !cluster) return null;
    return loadSnapshot(address, cluster);
  }, [address, cluster]);

  const whatChanged = useMemo(() => {
    if (!previous) return [];
    return computeWhatChanged(previous, insights);
  }, [previous, insights]);

  useEffect(() => {
    if (!address || !cluster) return;
    if (!complete) return;
    // Avoid overwriting a good baseline with an "empty parse" run.
    // Some RPCs return null parsed transactions even when signatures exist.
    if (insights.fetchedSignatures > 0 && insights.fetchedTransactions === 0) return;
    saveSnapshot(address, cluster, insights);
  }, [address, cluster, complete, insights]);

  const activityRows: {
    key: string;
    label: string;
    sub: string;
    count: number;
    icon: LucideIcon;
  }[] = [
    {
      key: "swap",
      label: "DEX / aggregator",
      sub: "Heuristic mapping",
      count: insights.buckets.swapLike,
      icon: ArrowRightLeft,
    },
    {
      key: "token",
      label: "SPL Token",
      sub: "",
      count: insights.buckets.splTokenLike,
      icon: Coins,
    },
    {
      key: "nft",
      label: "NFT / metadata",
      sub: "Metaplex family",
      count: insights.buckets.metadataLike,
      icon: ImageIcon,
    },
    {
      key: "vote",
      label: "Vote program",
      sub: "",
      count: insights.buckets.voteLike,
      icon: Vote,
    },
    {
      key: "memo",
      label: "Memo program",
      sub: "",
      count: insights.buckets.memoLike,
      icon: FileText,
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
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-400">
            Summary
          </p>
          <h2 className="sr-only">Recent signature window</h2>
        </div>
        {streaming && (
          <div className="rounded-full border border-[var(--border)] bg-[var(--accent-muted)] px-3 py-1 text-[11px] font-medium text-[var(--foreground)] dark:bg-neutral-900">
            Partial · {insights.fetchedTransactions}/{insights.fetchedSignatures}
          </div>
        )}
      </header>

      <div className={`${cardWrap} p-5`}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          Fingerprint
        </p>
        {clusterMatch ? (
          <p className="mt-2 text-[13px] text-slate-600 dark:text-slate-400">
            Similarity: closest to cluster {clusterMatch.clusterIndex + 1} (match {clusterMatch.strength}/100).
          </p>
        ) : null}
        <p className="mt-2 text-[15px] font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          {fingerprint.headline}
        </p>
        <p className="mt-1 text-[13px] text-slate-600 dark:text-slate-400">
          {fingerprint.details}
        </p>
        {insights.fetchedSignatures > 0 && insights.fetchedTransactions === 0 ? (
          <p className="mt-3 text-[13px] text-slate-600 dark:text-slate-400">
            No parsed transactions were returned for this window. Try Refresh, or switch RPC.
          </p>
        ) : null}
        <ul className="mt-4 space-y-2">
          {fingerprint.tags.slice(0, 3).map((t) => (
            <li key={t.id} className="flex gap-3">
              <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--accent-muted)] text-[var(--accent)] dark:bg-neutral-900 dark:text-emerald-300">
                <span className="text-[11px] font-semibold tabular-nums">
                  {Math.round(t.score * 10)}/10
                </span>
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">
                  {t.label}
                </p>
                <p className="text-[12px] leading-relaxed text-slate-600 dark:text-slate-400">
                  {t.reason}
                </p>
              </div>
            </li>
          ))}
          {fingerprint.tags.length === 0 ? (
            <li className="text-[13px] text-slate-600 dark:text-slate-400">
              Not enough signal in the parsed window yet.
            </li>
          ) : null}
        </ul>

        <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            Model
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-4">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-900 dark:text-slate-100">
                <Network className="size-4 text-[var(--accent)]" aria-hidden />
                Chain reads
              </div>
              <p className="mt-1 text-[12px] text-slate-600 dark:text-slate-400">
                Recent signatures and parsed transactions.
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-900 dark:text-slate-100">
                <Braces className="size-4 text-[var(--accent)]" aria-hidden />
                Features
              </div>
              <p className="mt-1 text-[12px] text-slate-600 dark:text-slate-400">
                Rates and counts from the window.
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-900 dark:text-slate-100">
                <Sparkles className="size-4 text-[var(--accent)]" aria-hidden />
                Clusters
              </div>
              <p className="mt-1 text-[12px] text-slate-600 dark:text-slate-400">
                Closest cluster gives a similarity hint.
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-900 dark:text-slate-100">
                <ArrowRightLeft className="size-4 text-[var(--accent)]" aria-hidden />
                Fingerprint
              </div>
              <p className="mt-1 text-[12px] text-slate-600 dark:text-slate-400">
                Short tags plus what changed on this device.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            What changed
          </p>
          {insights.fetchedSignatures > 0 && insights.fetchedTransactions === 0 ? (
            <p className="mt-2 text-[13px] text-slate-600 dark:text-slate-400">
              Skipping comparison because no parsed transactions were returned in the current run.
            </p>
          ) : !previous ? (
            <p className="mt-2 text-[13px] text-slate-600 dark:text-slate-400">
              No prior snapshot on this device for this address and cluster.
            </p>
          ) : whatChanged.length === 0 ? (
            <p className="mt-2 text-[13px] text-slate-600 dark:text-slate-400">
              No material changes detected in the summary signals.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {whatChanged.map((l, idx) => {
                const Icon =
                  l.kind === "up"
                    ? ArrowUpRight
                    : l.kind === "down"
                      ? ArrowDownRight
                      : Minus;
                const tint =
                  l.kind === "up"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : l.kind === "down"
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-slate-500 dark:text-slate-400";
                return (
                  <li key={idx} className="flex gap-2">
                    <Icon className={`mt-[2px] size-4 shrink-0 ${tint}`} aria-hidden />
                    <span className="text-[13px] text-slate-700 dark:text-slate-300">
                      {l.text}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className={`${cardWrap} border-slate-200 bg-slate-50/90 p-4 dark:border-slate-700 dark:bg-slate-900/40`}>
        <p className="text-[13px] leading-snug text-slate-700 dark:text-slate-300">
          Latest <span className="font-medium tabular-nums">{insights.fetchedSignatures}</span> signatures
          (maximum {MAX_SIGNATURES}). Parsed transactions only; category counts are heuristic and overlap.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <GlowStat
          label="Signatures"
          value={insights.fetchedSignatures}
          hint=""
          className="border-slate-200 ring-slate-200/70 dark:border-slate-700 dark:ring-slate-700"
          valueClass="text-slate-800 dark:text-slate-100"
        />
        <GlowStat
          label="Succeeded"
          value={insights.successfulTransactions}
          hint=""
          className="border-emerald-200/80 ring-emerald-100 dark:border-emerald-900 dark:ring-emerald-950/55"
          valueClass="text-[var(--chart-ok)]"
        />
        <GlowStat
          label="Failed"
          value={insights.failedTransactions}
          hint=""
          className="border-rose-200/70 ring-rose-100 dark:border-rose-900 dark:ring-rose-900/40"
          valueClass="text-rose-700 dark:text-rose-400"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className={`${cardWrap} p-5 lg:col-span-1`}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            Outcomes
          </p>
          <p className="mt-3 text-center text-[13px] text-slate-600 dark:text-slate-400">
            <span className="font-medium text-[var(--chart-ok)]">
              {insights.successfulTransactions} success
            </span>
            <span className="text-slate-400 dark:text-slate-500"> / </span>
            <span className="font-medium text-rose-600 dark:text-rose-400">
              {insights.failedTransactions} failure
            </span>
          </p>
          {totalAttempts > 0 ? (
            <SuccessRing pct={okPct} />
          ) : (
            <p className="mt-6 text-center text-[13px] text-slate-500 dark:text-slate-400">
              Pending parsed transactions.
            </p>
          )}
          <p className="mt-2 text-center font-mono text-2xl font-semibold tabular-nums text-slate-800 dark:text-slate-100">
            {totalAttempts === 0 ? "-" : `${okPct}%`}
          </p>
          <p className="mt-4 text-[12px] text-slate-500 dark:text-slate-400">
            {insights.fetchedTransactions} parsed TXs · window only.
          </p>
        </div>

        <div className={`${cardWrap} space-y-3 p-5 lg:col-span-2`}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            Categories (heuristic)
          </p>
          <ul className="mt-3 space-y-4">
            {activityRows.map((row, idx) => {
              const Icon = row.icon;
              const pct = insights.fetchedTransactions
                ? Math.round((100 * row.count) / insights.fetchedTransactions)
                : 0;
              const w = `${Math.round((100 * row.count) / maxBucket)}%`;
              const grad = BAR_PALETTE[idx % BAR_PALETTE.length]!;
              return (
                <li key={row.key}>
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="flex min-w-0 gap-3">
                      <span
                        className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--accent-muted)] text-[var(--accent)] dark:bg-neutral-900 dark:text-emerald-300"
                        aria-hidden
                      >
                        <Icon className="size-4 stroke-[2]" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[14px] font-medium text-slate-900 dark:text-slate-100">
                          {row.label}
                        </p>
                        {row.sub ? (
                          <p className="text-[12px] text-slate-500 dark:text-slate-400">{row.sub}</p>
                        ) : null}
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
            *Approximate touches ÷ parsed TXs · non-exclusive.
          </p>
        </div>
      </div>

      <div className={`${cardWrap} p-5`}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          Programs · invocations
        </p>
        <p className="mt-2 text-[13px] text-slate-600 dark:text-slate-400">
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {insights.uniqueProgramsCount}
          </span>
          {" "}unique program IDs in window.
        </p>
        <ul className="mt-5 space-y-3">
          {insights.topPrograms.length === 0 && (
            <li className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-[13px] text-slate-600 dark:border-slate-700 dark:text-slate-400">
              {streaming ? "Updating…" : "No programs in parsed set."}
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
                  <span className="shrink-0 font-semibold tabular-nums text-slate-900 dark:text-slate-100">
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
        <p className="text-[13px] font-semibold text-slate-900 dark:text-slate-50">
          Slot span (parsed window)
        </p>
        <p className="mt-3 font-mono text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
          {insights.oldestFetchedSlot ?? "-"} → {insights.newestFetchedSlot ?? "-"}
        </p>
      </div>
    </div>
  );
}

const PROGRAM_ROW_TINTS = [
  { track: "bg-slate-200 dark:bg-slate-800", bar: "bg-gradient-to-r from-emerald-600 to-green-500" },
  { track: "bg-slate-200 dark:bg-slate-800", bar: "bg-gradient-to-r from-sky-600 to-blue-600" },
  { track: "bg-slate-200 dark:bg-slate-800", bar: "bg-gradient-to-r from-amber-500 to-orange-600" },
  { track: "bg-slate-200 dark:bg-slate-800", bar: "bg-gradient-to-r from-green-600 to-emerald-500" },
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
      {hint ? (
        <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}

function SuccessRing({ pct }: { pct: number }) {
  const clipped = Math.max(0, Math.min(100, pct));
  return (
    <div
      className="mx-auto mt-5 flex justify-center"
      role="img"
      aria-label={`${clipped}% succeeded in parsed sample`}
    >
      <div className="relative size-40">
        <div
          className="absolute inset-0 rounded-full shadow-inner"
          style={{
            background: `conic-gradient(var(--chart-ok) ${clipped * 3.6}deg, var(--chart-fail) 0deg)`,
          }}
        />
        <div className="absolute inset-[12%] rounded-full bg-[var(--surface)] dark:bg-slate-950" />
      </div>
    </div>
  );
}
