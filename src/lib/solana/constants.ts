/** SPL Token Program (classic) */
export const SPL_TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

/** Token-2022 */
export const TOKEN_2022_PROGRAM = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

/** Metaplex Token Metadata (legacy layout + mpl-token-metadata generated id) */
export const METAPLEX_METADATA_IDS = new Set<string>([
  "metaqbxxUerdq28cjYFo44hWJmPpjKmJNQ459ApZbSq",
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
]);

/** Jupiter v6 aggregator program — verified base58 decode in @solana/web3.js */
export const JUPITER_V6_PROGRAM = "JUP6LkbZbjS1jKKwapdHNQyWFNwNmkEsJBAp4551652";

export const SPL_MEMO_PROGRAM = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";

/** System vote program indicator */
export const VOTE_PROGRAM = "Vote111111111111111111111111111111111111111";

export const SWAP_PROGRAM_IDS = new Set<string>([
  JUPITER_V6_PROGRAM,
]);
