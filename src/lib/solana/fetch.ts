import type { ConfirmedSignatureInfo, ParsedTransactionWithMeta } from "@solana/web3.js";
import { Connection, PublicKey } from "@solana/web3.js";
import { sleep } from "@/lib/solana/delay";

/** Hard cap: smaller window = faster loads on free RPC tiers (parallel single calls, not batch RPC). */
export const MAX_SIGNATURES = 48;

const PAGE_SIZE = 24;

/** Pace signature pagination — many upstreams throttle `getSignaturesForAddress`. */
const SIGNATURE_PAGE_GAP_MS = 40;

/**
 * Paginate `getSignaturesForAddress` until `max` signatures or exhaustion.
 */
export async function fetchRecentSignatures(
  connection: Connection,
  address: PublicKey,
  max = MAX_SIGNATURES,
): Promise<ConfirmedSignatureInfo[]> {
  const all: ConfirmedSignatureInfo[] = [];
  let before: string | undefined;
  while (all.length < max) {
    if (all.length > 0) await sleep(SIGNATURE_PAGE_GAP_MS);
    const batch = await connection.getSignaturesForAddress(address, {
      limit: Math.min(PAGE_SIZE, max - all.length),
      before,
    });
    if (!batch.length) break;
    all.push(...batch);
    before = batch[batch.length - 1]!.signature;
    if (batch.length < PAGE_SIZE) break;
  }
  return all;
}

const PARSED_TX_CONFIG = { maxSupportedTransactionVersion: 0 as const };

/**
 * Concurrent single-RPC `getTransaction` (parsed) — each POST is one JSON-RPC object, not an
 * array batch (`_rpcBatchRequest`), so Helius free and similar gateways accept it while we keep latency down.
 */
const PARSED_FETCH_CONCURRENCY = 8;

/** Short pause between parallel waves so RPM quotas are less likely to trip. */
const PARSED_FETCH_WAVE_GAP_MS = 55;

export async function fetchParsedTransactionsConcurrent(
  connection: Connection,
  signatures: string[],
): Promise<ParsedTransactionWithMeta[]> {
  const out: ParsedTransactionWithMeta[] = [];

  for (let base = 0; base < signatures.length; base += PARSED_FETCH_CONCURRENCY) {
    if (base > 0) await sleep(PARSED_FETCH_WAVE_GAP_MS);
    const slice = signatures.slice(base, base + PARSED_FETCH_CONCURRENCY);
    const wave = await Promise.all(
      slice.map((sig) =>
        connection.getParsedTransaction(sig, PARSED_TX_CONFIG),
      ),
    );
    for (const t of wave) {
      if (t !== null) out.push(t);
    }
  }

  return out;
}
