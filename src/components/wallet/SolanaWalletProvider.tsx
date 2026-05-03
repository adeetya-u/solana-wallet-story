"use client";

import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import type { ConnectionConfig } from "@solana/web3.js";
import { useMemo } from "react";
import { ClusterProvider, useCluster } from "@/components/wallet/ClusterContext";

const SOLANA_CONNECTION_CONFIG = {
  commitment: "confirmed",
} satisfies ConnectionConfig;

import "@solana/wallet-adapter-react-ui/styles.css";

function WalletInner({ children }: { children: React.ReactNode }) {
  const { cluster, endpoint } = useCluster();

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({
        network:
          cluster === "devnet"
            ? WalletAdapterNetwork.Devnet
            : WalletAdapterNetwork.Mainnet,
      }),
    ],
    [cluster],
  );

  return (
    <ConnectionProvider
      endpoint={endpoint}
      config={SOLANA_CONNECTION_CONFIG}
      key={endpoint}
    >
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export function SolanaWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClusterProvider>
      <WalletInner>{children}</WalletInner>
    </ClusterProvider>
  );
}
