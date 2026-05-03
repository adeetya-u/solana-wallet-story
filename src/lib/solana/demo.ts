export type DemoWallet = {
  id: string;
  label: string;
  cluster: "mainnet-beta" | "devnet";
  address: string;
  note?: string;
};

/**
 * Curated demo wallets.
 * Notes are intentionally short and non-assertive; activity can drift over time.
 */
export const DEMO_WALLETS: DemoWallet[] = [
  {
    id: "raydium",
    label: "Raydium (program)",
    cluster: "mainnet-beta",
    address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    note: "Usually busy; good for charts",
  },
  {
    id: "spl-token",
    label: "SPL Token (program)",
    cluster: "mainnet-beta",
    address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    note: "Core token program",
  },
  {
    id: "metaplex-metadata",
    label: "Metaplex Metadata (program)",
    cluster: "mainnet-beta",
    address: "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
    note: "NFT metadata program",
  },
];

export const DEMO_WALLET_MAINNET = DEMO_WALLETS[0]!.address;

export function demoDashboardHref(demoId?: string): string {
  const chosen =
    demoId ? DEMO_WALLETS.find((d) => d.id === demoId) : undefined;
  const d = chosen ?? DEMO_WALLETS[0]!;
  return `/dashboard?address=${encodeURIComponent(d.address)}`;
}
