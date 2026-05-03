import type { ConfirmedSignatureInfo, ParsedTransactionWithMeta } from "@solana/web3.js";
import { Connection, PublicKey } from "@solana/web3.js";
import { sleep } from "@/lib/solana/delay";

/** Hard cap keeps free RPC quotas predictable. */
export const MAX_SIGNATURES = 100;

const PAGE_SIZE = 20;

/** Pace signature pagination — many upstreams throttle `getSignaturesForAddress`. */
const SIGNATURE_PAGE_GAP_MS = 65;

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

/**
 * One tx per RPC batch chunk: `@solana/web3.js` batch-stacks `getTransaction` in a
 * single HTTP call; upstreams rate-limit per method, so small batches reduce burst RPM.
 */
const FETCH_CHUNK = 1;

/** Breathing room between chunk requests so retries do not collide with quotas. */
const CHUNK_GAP_MS = 135;

/** Fetch parsed transactions with small sequential chunks to ease rate limits. */
export async function fetchParsedTransactionsBatched(
  connection: Connection,
  signatures: string[],
): Promise<ParsedTransactionWithMeta[]> {
  const out: ParsedTransactionWithMeta[] = [];

  for (let i = 0; i < signatures.length; i += FETCH_CHUNK) {
    if (i > 0) await sleep(CHUNK_GAP_MS);
    const chunk = signatures.slice(i, i + FETCH_CHUNK);
    const batch = await connection.getParsedTransactions(chunk, {
      maxSupportedTransactionVersion: 0,
    });
    for (const t of batch) {
      if (t !== null) out.push(t);
    }
  }

  return out;
}
