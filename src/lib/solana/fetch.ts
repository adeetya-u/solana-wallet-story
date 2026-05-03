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

/** Per request: Helius free tier rejects JSON-RPC *batch* envelopes; pacing still eases RPM. */
const BETWEEN_PARSED_TX_MS = 135;

const PARSED_TX_CONFIG = { maxSupportedTransactionVersion: 0 as const };

/**
 * Sequential `getTransaction` (parsed) calls — avoids `_rpcBatchRequest`, which paid-only
 * gateways like Helius free disallow even for a length-1 batch.
 */
export async function fetchParsedTransactionsSequential(
  connection: Connection,
  signatures: string[],
): Promise<ParsedTransactionWithMeta[]> {
  const out: ParsedTransactionWithMeta[] = [];

  for (let i = 0; i < signatures.length; i++) {
    if (i > 0) await sleep(BETWEEN_PARSED_TX_MS);
    const t = await connection.getParsedTransaction(
      signatures[i]!,
      PARSED_TX_CONFIG,
    );
    if (t !== null) out.push(t);
  }

  return out;
}
