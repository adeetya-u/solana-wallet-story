import { clusterApiUrl } from "@solana/web3.js";

export type SolanaCluster = "mainnet-beta" | "devnet";

export const CLUSTER_STORAGE_KEY = "solana-wallet-story-cluster";

const DEFAULT_RPC: Record<SolanaCluster, string> = {
  "mainnet-beta": clusterApiUrl("mainnet-beta"),
  devnet: clusterApiUrl("devnet"),
};

/**
 * Resolve HTTP JSON-RPC endpoint for Wallet Adapter / reads.
 *
 * Mainnet in the browser defaults to the same-origin proxy `/api/solana-rpc`
 * (unless NEXT_PUBLIC_SOLANA_RPC_URL is set for a direct—public—URL).
 * That avoids public-rpc 403s from browser contexts; the proxy uses SOLANA_RPC_URL on the server.
 */
export function getEndpointForCluster(
  cluster: SolanaCluster,
  customMainnetRpc?: string,
  /** `window.location.origin` in the browser; omit on server / first paint. */
  browserOrigin?: string,
): string {
  if (cluster === "devnet") {
    return DEFAULT_RPC.devnet;
  }

  const trimmedClient = customMainnetRpc?.trim();
  if (trimmedClient) {
    return trimmedClient;
  }

  if (browserOrigin) {
    return `${browserOrigin}/api/solana-rpc`;
  }

  return DEFAULT_RPC["mainnet-beta"];
}
