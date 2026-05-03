import type {
  ParsedTransactionWithMeta,
  PublicKey,
} from "@solana/web3.js";
import { Connection } from "@solana/web3.js";
import {
  METAPLEX_METADATA_IDS,
  SPL_MEMO_PROGRAM,
  SPL_TOKEN_PROGRAM,
  SWAP_PROGRAM_IDS,
  TOKEN_2022_PROGRAM,
  VOTE_PROGRAM,
} from "@/lib/solana/constants";
import { sleep } from "@/lib/solana/delay";
import {
  fetchParsedTransactionsConcurrent,
  fetchRecentSignatures,
  MAX_SIGNATURES,
  PARSED_FETCH_CONCURRENCY,
  PARSED_FETCH_WAVE_GAP_MS,
  PARSED_TX_CONFIG,
} from "@/lib/solana/fetch";

export interface WalletInsights {
  windowLabel: string;
  fetchedSignatures: number;
  fetchedTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  uniqueProgramsCount: number;
  topPrograms: { programId: string; count: number }[];
  buckets: {
    swapLike: number;
    splTokenLike: number;
    metadataLike: number;
    voteLike: number;
    memoLike: number;
  };
  slotRange: { min: number | null; max: number | null };
  oldestFetchedSlot: number | null;
  newestFetchedSlot: number | null;
}

export function extractProgramIds(
  tx: ParsedTransactionWithMeta,
): Set<string> {
  const ids = new Set<string>();
  const message = tx.transaction.message;
  for (const ix of message.instructions) {
    if ("programId" in ix && typeof ix.programId !== "undefined") {
      ids.add(ix.programId.toBase58());
    }
  }
  const inner = tx.meta?.innerInstructions;
  if (inner) {
    for (const block of inner) {
      for (const ix of block.instructions) {
        ids.add(ix.programId.toBase58());
      }
    }
  }
  return ids;
}

function categorizeProgramSet(ids: Set<string>): WalletInsights["buckets"] {
  let swapLike = 0;
  let splTokenLike = 0;
  let metadataLike = 0;
  let voteLike = 0;
  let memoLike = 0;
  if ([...ids].some((id) => SWAP_PROGRAM_IDS.has(id))) swapLike++;
  if (ids.has(SPL_TOKEN_PROGRAM) || ids.has(TOKEN_2022_PROGRAM))
    splTokenLike++;
  if ([...ids].some((id) => METAPLEX_METADATA_IDS.has(id))) metadataLike++;
  if (ids.has(VOTE_PROGRAM)) voteLike++;
  if (ids.has(SPL_MEMO_PROGRAM)) memoLike++;
  return { swapLike, splTokenLike, metadataLike, voteLike, memoLike };
}

export function buildWalletInsights(
  sigStrings: string[],
  txs: ParsedTransactionWithMeta[],
): WalletInsights {
  const programCounts = new Map<string, number>();
  const bucketsAgg = {
    swapLike: 0,
    splTokenLike: 0,
    metadataLike: 0,
    voteLike: 0,
    memoLike: 0,
  };

  let successfulTransactions = 0;
  let failedTransactions = 0;
  let minSlot: number | null = null;
  let maxSlot: number | null = null;

  for (const tx of txs) {
    const err = tx.meta?.err;
    if (err) failedTransactions++;
    else successfulTransactions++;

    const slot = tx.slot;
    if (minSlot === null || slot < minSlot) minSlot = slot;
    if (maxSlot === null || slot > maxSlot) maxSlot = slot;

    const ids = extractProgramIds(tx);
    const cat = categorizeProgramSet(ids);
    bucketsAgg.swapLike += cat.swapLike;
    bucketsAgg.splTokenLike += cat.splTokenLike;
    bucketsAgg.metadataLike += cat.metadataLike;
    bucketsAgg.voteLike += cat.voteLike;
    bucketsAgg.memoLike += cat.memoLike;

    ids.forEach((id) =>
      programCounts.set(id, (programCounts.get(id) ?? 0) + 1),
    );
  }

  const topPrograms = [...programCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([programId, count]) => ({ programId, count }));

  return {
    windowLabel: `Last ${sigStrings.length} signatures (≤${MAX_SIGNATURES})`,
    fetchedSignatures: sigStrings.length,
    fetchedTransactions: txs.length,
    successfulTransactions,
    failedTransactions,
    uniqueProgramsCount: programCounts.size,
    topPrograms,
    buckets: bucketsAgg,
    slotRange:
      minSlot !== null && maxSlot !== null
        ? { min: minSlot, max: maxSlot }
        : { min: null, max: null },
    oldestFetchedSlot: minSlot,
    newestFetchedSlot: maxSlot,
  };
}

export async function loadWalletInsights(
  connection: Connection,
  pubkey: PublicKey,
): Promise<WalletInsights> {
  const signatures = await fetchRecentSignatures(connection, pubkey);
  const sigStrings = signatures.map((s) => s.signature).filter(Boolean);
  const txs = await fetchParsedTransactionsConcurrent(connection, sigStrings);
  return buildWalletInsights(sigStrings, txs);
}

/** Decode transactions in waves so the UI can paint charts before the full window finishes. */
export async function loadWalletInsightsProgressive(
  connection: Connection,
  pubkey: PublicKey,
  opts: {
    onSignatures: (count: number) => void;
    onUpdate: (data: WalletInsights, complete: boolean) => void;
    shouldAbort: () => boolean;
  },
): Promise<void> {
  const signatures = await fetchRecentSignatures(connection, pubkey);
  if (opts.shouldAbort()) return;

  const sigStrings = signatures.map((s) => s.signature).filter(Boolean);
  opts.onSignatures(sigStrings.length);

  if (sigStrings.length === 0) {
    opts.onUpdate(buildWalletInsights([], []), true);
    return;
  }

  const txs: ParsedTransactionWithMeta[] = [];
  for (
    let base = 0;
    base < sigStrings.length;
    base += PARSED_FETCH_CONCURRENCY
  ) {
    if (opts.shouldAbort()) return;
    if (base > 0) await sleep(PARSED_FETCH_WAVE_GAP_MS);
    if (opts.shouldAbort()) return;

    const slice = sigStrings.slice(base, base + PARSED_FETCH_CONCURRENCY);
    const wave = await Promise.all(
      slice.map((sig) =>
        connection.getParsedTransaction(sig, PARSED_TX_CONFIG),
      ),
    );
    for (const t of wave) if (t !== null) txs.push(t);

    const complete =
      base + PARSED_FETCH_CONCURRENCY >= sigStrings.length;
    opts.onUpdate(buildWalletInsights(sigStrings, txs), complete);
    if (opts.shouldAbort()) return;
  }
}

export async function loadMintSnapshot(
  connection: Connection,
  owner: PublicKey,
  mint: PublicKey,
): Promise<{ amountUi: string; decimals: number } | null> {
  const res = await connection.getParsedTokenAccountsByOwner(owner, {
    mint,
  });
  if (!res.value.length) return null;
  const first = res.value[0]!.account.data.parsed.info;
  const tokenAmount = first.tokenAmount;
  return {
    amountUi: tokenAmount.uiAmountString ?? String(tokenAmount.uiAmount ?? 0),
    decimals: tokenAmount.decimals,
  };
}
