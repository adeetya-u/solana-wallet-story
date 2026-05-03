import type { WalletInsights } from "@/lib/solana/insights";
import { extractBehaviorFeatures, type BehaviorFeatures } from "./behavior";

export type StoredSnapshotV1 = {
  version: 1;
  savedAtMs: number;
  address: string;
  cluster: string;
  insights: Pick<
    WalletInsights,
    | "fetchedSignatures"
    | "fetchedTransactions"
    | "successfulTransactions"
    | "failedTransactions"
    | "uniqueProgramsCount"
    | "topPrograms"
    | "buckets"
    | "oldestFetchedSlot"
    | "newestFetchedSlot"
  >;
};

export type ChangeLine = {
  kind: "up" | "down" | "flat";
  text: string;
};

function clamp01(x: number): number {
  if (Number.isNaN(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

function safeDiv(a: number, b: number): number {
  return b <= 0 ? 0 : a / b;
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

function diffKind(delta: number, eps: number): "up" | "down" | "flat" {
  if (Math.abs(delta) <= eps) return "flat";
  return delta > 0 ? "up" : "down";
}

function topProgramId(insights: StoredSnapshotV1["insights"]): string | null {
  if (!insights.topPrograms.length) return null;
  return insights.topPrograms[0]!.programId;
}

function featureSetFromStored(s: StoredSnapshotV1["insights"]): BehaviorFeatures {
  // Build a WalletInsights-shaped object with only required fields for feature extraction.
  const w: WalletInsights = {
    windowLabel: "",
    fetchedSignatures: s.fetchedSignatures,
    fetchedTransactions: s.fetchedTransactions,
    successfulTransactions: s.successfulTransactions,
    failedTransactions: s.failedTransactions,
    uniqueProgramsCount: s.uniqueProgramsCount,
    topPrograms: s.topPrograms,
    buckets: s.buckets,
    slotRange: { min: s.oldestFetchedSlot, max: s.newestFetchedSlot },
    oldestFetchedSlot: s.oldestFetchedSlot,
    newestFetchedSlot: s.newestFetchedSlot,
  };
  return extractBehaviorFeatures(w);
}

export function makeSnapshotKey(address: string, cluster: string): string {
  return `solpeek.snapshot.v1:${cluster}:${address}`;
}

export function loadSnapshot(
  address: string,
  cluster: string,
): StoredSnapshotV1 | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(makeSnapshotKey(address, cluster));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSnapshotV1;
    if (parsed?.version !== 1) return null;
    if (parsed.address !== address || parsed.cluster !== cluster) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSnapshot(
  address: string,
  cluster: string,
  insights: WalletInsights,
): void {
  if (typeof window === "undefined") return;
  const snap: StoredSnapshotV1 = {
    version: 1,
    savedAtMs: Date.now(),
    address,
    cluster,
    insights: {
      fetchedSignatures: insights.fetchedSignatures,
      fetchedTransactions: insights.fetchedTransactions,
      successfulTransactions: insights.successfulTransactions,
      failedTransactions: insights.failedTransactions,
      uniqueProgramsCount: insights.uniqueProgramsCount,
      topPrograms: insights.topPrograms,
      buckets: insights.buckets,
      oldestFetchedSlot: insights.oldestFetchedSlot,
      newestFetchedSlot: insights.newestFetchedSlot,
    },
  };
  try {
    window.localStorage.setItem(makeSnapshotKey(address, cluster), JSON.stringify(snap));
  } catch {
    // ignore quota or privacy mode failures
  }
}

export function computeWhatChanged(
  prev: StoredSnapshotV1,
  current: WalletInsights,
): ChangeLine[] {
  const prevF = featureSetFromStored(prev.insights);
  const curF = extractBehaviorFeatures(current);

  const lines: ChangeLine[] = [];

  const failureDelta = curF.failureRate - prevF.failureRate;
  const failureKind = diffKind(failureDelta, 0.02);
  if (failureKind !== "flat") {
    lines.push({
      kind: failureKind,
      text: `Failure rate ${failureKind === "up" ? "rose" : "fell"} from ${pct(prevF.failureRate)} to ${pct(curF.failureRate)}.`,
    });
  }

  const progDelta = current.uniqueProgramsCount - prev.insights.uniqueProgramsCount;
  const progKind = diffKind(progDelta, 2);
  if (progKind !== "flat") {
    lines.push({
      kind: progKind,
      text: `Unique programs ${progKind === "up" ? "increased" : "decreased"} from ${prev.insights.uniqueProgramsCount} to ${current.uniqueProgramsCount}.`,
    });
  }

  const swapDelta = curF.swapRate - prevF.swapRate;
  const swapKind = diffKind(swapDelta, 0.06);
  if (swapKind !== "flat") {
    lines.push({
      kind: swapKind,
      text: `Swap-like activity ${swapKind === "up" ? "increased" : "decreased"} (${pct(prevF.swapRate)} to ${pct(curF.swapRate)}).`,
    });
  }

  const tokenDelta = curF.tokenRate - prevF.tokenRate;
  const tokenKind = diffKind(tokenDelta, 0.07);
  if (tokenKind !== "flat") {
    lines.push({
      kind: tokenKind,
      text: `Token program touches ${tokenKind === "up" ? "increased" : "decreased"} (${pct(prevF.tokenRate)} to ${pct(curF.tokenRate)}).`,
    });
  }

  const prevTop = topProgramId(prev.insights);
  const curTop = current.topPrograms[0]?.programId ?? null;
  if (prevTop && curTop && prevTop !== curTop) {
    lines.push({
      kind: "flat",
      text: "Top program changed in the recent window.",
    });
  }

  const prevCoverage = clamp01(safeDiv(prevF.txs, Math.max(1, prevF.sigs)));
  const curCoverage = clamp01(safeDiv(current.fetchedTransactions, Math.max(1, current.fetchedSignatures)));
  const covDelta = curCoverage - prevCoverage;
  const covKind = diffKind(covDelta, 0.08);
  if (covKind !== "flat") {
    lines.push({
      kind: covKind,
      text: `Parsed coverage ${covKind === "up" ? "improved" : "dropped"} (${pct(prevCoverage)} to ${pct(curCoverage)}).`,
    });
  }

  return lines.slice(0, 4);
}

