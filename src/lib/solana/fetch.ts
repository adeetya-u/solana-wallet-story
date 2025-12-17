import type { ConfirmedSignatureInfo, ParsedTransactionWithMeta } from "@solana/web3.js";
import { Connection, PublicKey } from "@solana/web3.js";

/** Hard cap keeps free RPC quotas predictable. */
export const MAX_SIGNATURES = 100;

const PAGE_SIZE = 20;

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

const FETCH_CHUNK = 5;

/** Fetch parsed transactions with small sequential chunks to ease rate limits. */
export async function fetchParsedTransactionsBatched(
  connection: Connection,
  signatures: string[],
): Promise<ParsedTransactionWithMeta[]> {
  const out: ParsedTransactionWithMeta[] = [];

  for (let i = 0; i < signatures.length; i += FETCH_CHUNK) {
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
