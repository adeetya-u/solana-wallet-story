"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  CLUSTER_STORAGE_KEY,
  getEndpointForCluster,
  type SolanaCluster,
} from "@/lib/solana/endpoints";

export interface ClusterContextValue {
  cluster: SolanaCluster;
  setCluster: (c: SolanaCluster) => void;
  endpoint: string;
}

const ClusterContext = createContext<ClusterContextValue | null>(null);

export function ClusterProvider({ children }: { children: React.ReactNode }) {
  const [cluster, setClusterState] = useState<SolanaCluster>("mainnet-beta");

  const setCluster = useCallback((c: SolanaCluster) => {
    setClusterState(c);
    try {
      localStorage.setItem(CLUSTER_STORAGE_KEY, c);
    } catch {
      /* ignore */
    }
  }, []);

  const customMainnet =
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim() || undefined;

  const endpoint = useMemo(
    () => getEndpointForCluster(cluster, customMainnet, undefined),
    [cluster, customMainnet],
  );

  const value = useMemo(
    () => ({ cluster, setCluster, endpoint }),
    [cluster, setCluster, endpoint],
  );

  return (
    <ClusterContext.Provider value={value}>{children}</ClusterContext.Provider>
  );
}

export function useCluster(): ClusterContextValue {
  const ctx = useContext(ClusterContext);
  if (!ctx) {
    throw new Error("useCluster must be used within ClusterProvider");
  }
  return ctx;
}
