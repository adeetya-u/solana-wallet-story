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
    <div
      className="inline-flex rounded-md border border-slate-200 bg-slate-100/80 p-0.5 text-[13px] font-medium dark:border-slate-700 dark:bg-slate-900/80"
      role="group"
      aria-label="Network"
    >
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => setCluster(o.value)}
          className={`rounded px-3 py-1.5 transition-colors ${
            cluster === o.value
              ? "bg-white text-teal-800 shadow-sm dark:bg-slate-800 dark:text-teal-200"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
