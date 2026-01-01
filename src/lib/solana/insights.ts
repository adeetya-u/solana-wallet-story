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
