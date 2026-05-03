import type { WalletInsights } from "@/lib/solana/insights";
import { extractBehaviorFeatures } from "./behavior";

type TrainedModelV1 = {
  version: 1;
  trainedAtIso: string;
  window: { maxSignatures: number };
  featureNames: string[];
  mean: number[];
  std: number[];
  centroids: number[][];
  examplesPerCluster: number[];
};

export type ClusterMatch = {
  clusterIndex: number;
  distance: number;
  percentile: number; // heuristic 0..100 lower distance is "more typical"
};

function l2(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    s += d * d;
  }
  return Math.sqrt(s);
}

function zNormalize(v: number[], mu: number[], sd: number[]): number[] {
  const out = new Array(v.length);
  for (let i = 0; i < v.length; i++) {
    const denom = (sd[i] ?? 0) <= 1e-9 ? 1 : (sd[i] ?? 1);
    out[i] = ((v[i] ?? 0) - (mu[i] ?? 0)) / denom;
  }
  return out;
}

function toVector(insights: WalletInsights): number[] {
  const f = extractBehaviorFeatures(insights);
  return [
    f.coverage,
    f.failureRate,
    f.uniqueProgramsPerTx,
    f.swapRate,
    f.tokenRate,
    f.nftRate,
    f.voteRate,
    f.memoRate,
    f.topProgramShare,
  ];
}

export function loadTrainedModel(): TrainedModelV1 | null {
  return null;
}

export function matchCluster(
  insights: WalletInsights,
  model: TrainedModelV1,
): ClusterMatch {
  const v = toVector(insights);
  const z = zNormalize(v, model.mean, model.std);

  let bestIdx = 0;
  let bestD = Infinity;
  const dists: number[] = [];
  for (let i = 0; i < model.centroids.length; i++) {
    const d = l2(z, model.centroids[i]!);
    dists.push(d);
    if (d < bestD) {
      bestD = d;
      bestIdx = i;
    }
  }

  // Very small heuristic: map the best distance against the distribution of centroid distances.
  // Lower is "more typical". This is not a statistically rigorous percentile.
  const sorted = [...dists].sort((a, b) => a - b);
  const rank = sorted.indexOf(bestD);
  const pct = Math.round((100 * (rank + 1)) / sorted.length);

  return { clusterIndex: bestIdx, distance: bestD, percentile: pct };
}

let cached: TrainedModelV1 | null = null;

export async function getTrainedModel(): Promise<TrainedModelV1 | null> {
  if (cached) return cached;
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch("/fingerprint-model.json", { cache: "force-cache" });
    if (!res.ok) return null;
    const m = (await res.json()) as TrainedModelV1;
    if (m?.version !== 1) return null;
    if (!Array.isArray(m.centroids) || m.centroids.length < 2) return null;
    cached = m;
    return cached;
  } catch {
    return null;
  }
}

