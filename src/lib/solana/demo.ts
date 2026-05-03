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
    id: "metaplex-metadata",
    label: "Metaplex Metadata (program)",
    cluster: "mainnet-beta",
    address: "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
    note: "NFT metadata program",
  },
  {
    id: "jupiter-v6",
    label: "Jupiter v6 (program)",
    cluster: "mainnet-beta",
    address: "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
    note: "Swap routing program",
  },
  {
    id: "whale-1",
    label: "High-balance wallet (address)",
    cluster: "mainnet-beta",
    address: "MJKqp326RZCHnAAbew9MDdui3iCKWco7fsK9sVuZTX2",
    note: "Real wallet activity varies",
  },
];

export const DEMO_WALLET_MAINNET = DEMO_WALLETS[0]!.address;

export function demoDashboardHref(demoId?: string): string {
  const chosen =
    demoId ? DEMO_WALLETS.find((d) => d.id === demoId) : undefined;
  const d = chosen ?? DEMO_WALLETS[0]!;
  return `/dashboard?address=${encodeURIComponent(d.address)}`;
}
