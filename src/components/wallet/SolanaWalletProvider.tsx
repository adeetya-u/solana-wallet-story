"use client";

import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { useMemo } from "react";
import { ClusterProvider, useCluster } from "@/components/wallet/ClusterContext";

import "@solana/wallet-adapter-react-ui/styles.css";

function WalletInner({ children }: { children: React.ReactNode }) {
  const { endpoint } = useCluster();

  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider
      endpoint={endpoint}
      config={{ commitment: "confirmed" }}
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
