"use client";

import { useCluster } from "@/components/wallet/ClusterContext";
import type { SolanaCluster } from "@/lib/solana/endpoints";

const OPTIONS: { value: SolanaCluster; label: string }[] = [
  { value: "mainnet-beta", label: "Mainnet" },
  { value: "devnet", label: "Devnet" },
];

export function ClusterToggle() {
  const { cluster, setCluster } = useCluster();

  return (
    <div className="inline-flex rounded-full border border-zinc-200 bg-zinc-100 p-0.5 text-sm dark:border-zinc-700 dark:bg-zinc-900">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => setCluster(o.value)}
          className={`rounded-full px-3 py-1 font-medium transition-colors ${
            cluster === o.value
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
              : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
