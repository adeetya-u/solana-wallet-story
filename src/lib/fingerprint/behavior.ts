import type { WalletInsights } from "@/lib/solana/insights";

export type BehaviorTagId =
  | "defi_heavy"
  | "token_mover"
  | "nft_leaning"
  | "governance"
  | "memo_user"
  | "high_failure"
  | "program_sprawl"
  | "program_concentrated";

export type BehaviorTag = {
  id: BehaviorTagId;
  label: string;
  score: number; // 0..1
  reason: string;
};

export type BehaviorFingerprint = {
  version: 1;
  tags: BehaviorTag[];
  headline: string;
  details: string;
};

function clamp01(x: number): number {
  if (Number.isNaN(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

function safeDiv(a: number, b: number): number {
  return b <= 0 ? 0 : a / b;
}

export type BehaviorFeatures = {
  txs: number;
  sigs: number;
  coverage: number; // txs / sigs
  failureRate: number;
  uniquePrograms: number;
  uniqueProgramsPerTx: number;
  swapRate: number;
  tokenRate: number;
  nftRate: number;
  voteRate: number;
  memoRate: number;
  topProgramShare: number; // most common program invocations / total invocations for topPrograms list
};

export function extractBehaviorFeatures(insights: WalletInsights): BehaviorFeatures {
  const txs = insights.fetchedTransactions;
  const sigs = insights.fetchedSignatures;
  const attempts = insights.successfulTransactions + insights.failedTransactions;

  const failureRate = clamp01(safeDiv(insights.failedTransactions, attempts));
  const uniquePrograms = insights.uniqueProgramsCount;
  const uniqueProgramsPerTx = safeDiv(uniquePrograms, Math.max(1, txs));

  const swapRate = clamp01(safeDiv(insights.buckets.swapLike, Math.max(1, txs)));
  const tokenRate = clamp01(
    safeDiv(insights.buckets.splTokenLike, Math.max(1, txs)),
  );
  const nftRate = clamp01(
    safeDiv(insights.buckets.metadataLike, Math.max(1, txs)),
  );
  const voteRate = clamp01(safeDiv(insights.buckets.voteLike, Math.max(1, txs)));
  const memoRate = clamp01(safeDiv(insights.buckets.memoLike, Math.max(1, txs)));

  const topProgramsTotal = insights.topPrograms.reduce((acc, r) => acc + r.count, 0);
  const topProgramMax = insights.topPrograms.reduce((m, r) => Math.max(m, r.count), 0);
  const topProgramShare = clamp01(safeDiv(topProgramMax, Math.max(1, topProgramsTotal)));

  return {
    txs,
    sigs,
    coverage: clamp01(safeDiv(txs, Math.max(1, sigs))),
    failureRate,
    uniquePrograms,
    uniqueProgramsPerTx,
    swapRate,
    tokenRate,
    nftRate,
    voteRate,
    memoRate,
    topProgramShare,
  };
}

function scoreBand(x: number, low: number, high: number): number {
  if (x <= low) return 0;
  if (x >= high) return 1;
  return (x - low) / (high - low);
}

export function buildBehaviorFingerprint(insights: WalletInsights): BehaviorFingerprint {
  const f = extractBehaviorFeatures(insights);

  const tags: BehaviorTag[] = [];

  const defiScore = clamp01(scoreBand(f.swapRate, 0.18, 0.55));
  if (defiScore > 0.12) {
    tags.push({
      id: "defi_heavy",
      label: "DeFi-heavy",
      score: defiScore,
      reason: `Swap-like activity appears in ${pct(f.swapRate)} of parsed transactions.`,
    });
  }

  const tokenScore = clamp01(scoreBand(f.tokenRate, 0.25, 0.75));
  if (tokenScore > 0.12) {
    tags.push({
      id: "token_mover",
      label: "Token mover",
      score: tokenScore,
      reason: `Token program touches show up in ${pct(f.tokenRate)} of parsed transactions.`,
    });
  }

  const nftScore = clamp01(scoreBand(f.nftRate, 0.08, 0.35));
  if (nftScore > 0.12) {
    tags.push({
      id: "nft_leaning",
      label: "NFT-leaning",
      score: nftScore,
      reason: `NFT metadata touches show up in ${pct(f.nftRate)} of parsed transactions.`,
    });
  }

  const voteScore = clamp01(scoreBand(f.voteRate, 0.02, 0.12));
  if (voteScore > 0.2) {
    tags.push({
      id: "governance",
      label: "Governance voter",
      score: voteScore,
      reason: `Vote program shows up in ${pct(f.voteRate)} of parsed transactions.`,
    });
  }

  const memoScore = clamp01(scoreBand(f.memoRate, 0.03, 0.2));
  if (memoScore > 0.2) {
    tags.push({
      id: "memo_user",
      label: "Memo usage",
      score: memoScore,
      reason: `Memo program shows up in ${pct(f.memoRate)} of parsed transactions.`,
    });
  }

  const failureScore = clamp01(scoreBand(f.failureRate, 0.08, 0.25));
  if (failureScore > 0.2) {
    tags.push({
      id: "high_failure",
      label: "High failure rate",
      score: failureScore,
      reason: `${pct(f.failureRate)} of parsed transactions failed.`,
    });
  }

  const sprawlScore = clamp01(scoreBand(f.uniqueProgramsPerTx, 0.2, 0.55));
  if (sprawlScore > 0.2) {
    tags.push({
      id: "program_sprawl",
      label: "Many programs",
      score: sprawlScore,
      reason: `About ${f.uniquePrograms} unique program IDs across ${f.txs} parsed transactions.`,
    });
  }

  const concentrationScore = clamp01(scoreBand(f.topProgramShare, 0.35, 0.7));
  if (concentrationScore > 0.2) {
    tags.push({
      id: "program_concentrated",
      label: "One program dominates",
      score: concentrationScore,
      reason: `The top program accounts for ~${pct(f.topProgramShare)} of counted invocations in the top list.`,
    });
  }

  const sorted = [...tags].sort((a, b) => b.score - a.score);
  const top = sorted.slice(0, 3);

  const headline =
    top.length > 0 ? top.map((t) => t.label).join(" · ") : "No clear pattern yet";

  const details =
    f.txs === 0
      ? "No parsed transactions yet."
      : `Based on ${f.txs} parsed transactions out of ${f.sigs} signatures.`;

  return { version: 1, tags: sorted, headline, details };
}

