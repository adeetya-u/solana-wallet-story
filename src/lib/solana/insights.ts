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
import {
  fetchParsedTransactionsBatched,
  fetchRecentSignatures,
  MAX_SIGNATURES,
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

export async function loadWalletInsights(
  connection: Connection,
  pubkey: PublicKey,
): Promise<WalletInsights> {
  const signatures = await fetchRecentSignatures(connection, pubkey);
  const sigStrings = signatures.map((s) => s.signature).filter(Boolean);
  const txs = await fetchParsedTransactionsBatched(connection, sigStrings);

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
