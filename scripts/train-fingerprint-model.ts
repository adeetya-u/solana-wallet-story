import fs from "node:fs";
import path from "node:path";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { buildWalletInsights } from "../src/lib/solana/insights";
import { extractBehaviorFeatures } from "../src/lib/fingerprint/behavior";

type Vector = number[];

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

const FEATURE_NAMES = [
  "coverage",
  "failureRate",
  "uniqueProgramsPerTx",
  "swapRate",
  "tokenRate",
  "nftRate",
  "voteRate",
  "memoRate",
  "topProgramShare",
] as const;

function toVector(f: ReturnType<typeof extractBehaviorFeatures>): Vector {
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

function meanVec(vs: Vector[]): Vector {
  const d = vs[0]!.length;
  const out = new Array(d).fill(0);
  for (const v of vs) for (let i = 0; i < d; i++) out[i] += v[i]!;
  for (let i = 0; i < d; i++) out[i] /= Math.max(1, vs.length);
  return out;
}

function stdVec(vs: Vector[], mu: Vector): Vector {
  const d = vs[0]!.length;
  const out = new Array(d).fill(0);
  for (const v of vs) {
    for (let i = 0; i < d; i++) {
      const dx = v[i]! - mu[i]!;
      out[i] += dx * dx;
    }
  }
  for (let i = 0; i < d; i++) out[i] = Math.sqrt(out[i] / Math.max(1, vs.length));
  return out;
}

function zNormalize(v: Vector, mu: Vector, sd: Vector): Vector {
  const out = new Array(v.length);
  for (let i = 0; i < v.length; i++) {
    const denom = sd[i]! <= 1e-9 ? 1 : sd[i]!;
    out[i] = (v[i]! - mu[i]!) / denom;
  }
  return out;
}

function l2(a: Vector, b: Vector): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i]! - b[i]!;
    s += d * d;
  }
  return Math.sqrt(s);
}

function pickInitialCentroids(vs: Vector[], k: number): Vector[] {
  // kmeans++-ish: start with a random point, then pick farthest iteratively (simple and deterministic).
  const centroids: Vector[] = [];
  centroids.push(vs[0]!);
  while (centroids.length < k) {
    let bestIdx = 0;
    let bestDist = -1;
    for (let i = 0; i < vs.length; i++) {
      const v = vs[i]!;
      const d = Math.min(...centroids.map((c) => l2(v, c)));
      if (d > bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    centroids.push(vs[bestIdx]!);
  }
  return centroids.map((c) => [...c]);
}

function kmeans(vs: Vector[], k: number, iters = 30): {
  centroids: Vector[];
  assignments: number[];
  counts: number[];
} {
  let centroids = pickInitialCentroids(vs, k);
  const assignments = new Array(vs.length).fill(0);

  for (let iter = 0; iter < iters; iter++) {
    let changed = 0;
    const clusters: Vector[][] = Array.from({ length: k }, () => []);

    for (let i = 0; i < vs.length; i++) {
      const v = vs[i]!;
      let best = 0;
      let bestD = Infinity;
      for (let c = 0; c < k; c++) {
        const d = l2(v, centroids[c]!);
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
      if (assignments[i] !== best) changed++;
      assignments[i] = best;
      clusters[best]!.push(v);
    }

    const newCentroids: Vector[] = [];
    for (let c = 0; c < k; c++) {
      if (clusters[c]!.length === 0) {
        newCentroids.push(centroids[c]!);
      } else {
        newCentroids.push(meanVec(clusters[c]!));
      }
    }
    centroids = newCentroids;
    if (changed === 0) break;
  }

  const counts = new Array(k).fill(0);
  for (const a of assignments) counts[a] += 1;
  return { centroids, assignments, counts };
}

function readAddresses(filePath: string): string[] {
  const raw = fs.readFileSync(filePath, "utf8");
  return raw
    .split(/\r?\n/g)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"));
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchInsightsGentle(
  connection: Connection,
  pk: PublicKey,
  opts: { maxSignatures: number; delayMs: number },
) {
  // Minimal-RPC version tuned for rate limits:
  // - one getSignaturesForAddress
  // - sequential getParsedTransaction calls with a small delay
  const sigs = await connection.getSignaturesForAddress(pk, {
    limit: opts.maxSignatures,
  });
  const sigStrings = sigs.map((s) => s.signature).filter(Boolean);

  const txs = [];
  for (const sig of sigStrings) {
    // "confirmed" works well for broad RPC providers.
    const tx = await connection.getParsedTransaction(sig, {
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed",
    });
    if (tx) txs.push(tx);
    if (opts.delayMs > 0) await sleep(opts.delayMs);
  }
  return buildWalletInsights(sigStrings, txs);
}

async function main() {
  const args = process.argv.slice(2);
  const inputIdx = args.indexOf("--input");
  const rpcIdx = args.indexOf("--rpc");
  const kIdx = args.indexOf("--k");
  const delayIdx = args.indexOf("--delayMs");
  const maxIdx = args.indexOf("--max");

  const input =
    inputIdx >= 0 ? args[inputIdx + 1] : "data/popular-wallets.txt";
  const rpc =
    rpcIdx >= 0
      ? args[rpcIdx + 1]
      : process.env.SOLANA_RPC_URL || "https://solpeek-live.vercel.app/api/solana-rpc";
  const kRaw = kIdx >= 0 ? args[kIdx + 1] : "6";
  const k = Math.max(3, Math.min(12, Number(kRaw) || 6));
  const delayMsRaw = delayIdx >= 0 ? args[delayIdx + 1] : "250";
  const delayMs = Math.max(0, Math.min(2000, Number(delayMsRaw) || 250));
  const maxSignatures = 24;
  const maxAddressesRaw = maxIdx >= 0 ? args[maxIdx + 1] : "200";
  const maxAddresses = Math.max(20, Math.min(500, Number(maxAddressesRaw) || 200));

  const root = process.cwd();
  const inputPath = path.resolve(root, input);

  if (!fs.existsSync(inputPath)) {
    throw new Error(
      `Missing address list at ${input}. Copy data/popular-wallets.example.txt to data/popular-wallets.txt and fill ~200 addresses.`,
    );
  }

  const endpoint = rpc?.trim() || clusterApiUrl("mainnet-beta");
  const connection = new Connection(endpoint, "confirmed");

  const addrs = readAddresses(inputPath).slice(0, maxAddresses);
  if (addrs.length < 20) {
    throw new Error(`Need more addresses to train. Found ${addrs.length}.`);
  }

  console.log(`Training on ${addrs.length} addresses (k=${k}).`);

  const vectors: Vector[] = [];
  let ok = 0;
  let failed = 0;

  for (const [i, a] of addrs.entries()) {
    try {
      const pk = new PublicKey(a);
      const insights = await fetchInsightsGentle(connection, pk, {
        maxSignatures,
        delayMs,
      });
      const f = extractBehaviorFeatures(insights);
      const v = toVector(f);
      vectors.push(v);
      ok++;
      console.log(`Fetched ${i + 1}/${addrs.length}`);
    } catch (e) {
      failed++;
      console.warn(`Skip ${a}: ${(e as Error).message ?? String(e)}`);
    }
  }

  if (vectors.length < 20) {
    throw new Error(`Too few usable samples: ${vectors.length}.`);
  }

  const mu = meanVec(vectors);
  const sd = stdVec(vectors, mu);
  const z = vectors.map((v) => zNormalize(v, mu, sd));

  const km = kmeans(z, k, 40);

  const model: TrainedModelV1 = {
    version: 1,
    trainedAtIso: new Date().toISOString(),
    window: { maxSignatures: 24 },
    featureNames: [...FEATURE_NAMES],
    mean: mu,
    std: sd,
    centroids: km.centroids,
    examplesPerCluster: km.counts,
  };

  const outPath = path.resolve(root, "public", "fingerprint-model.json");
  fs.writeFileSync(outPath, JSON.stringify(model, null, 2));
  console.log(`Saved model to ${outPath}`);
  console.log(`Usable samples: ${vectors.length}. Skipped: ${failed}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

