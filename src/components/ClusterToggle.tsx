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
      className="inline-flex rounded-full border border-neutral-200 bg-neutral-100/90 p-1 text-[12px] font-semibold tracking-wide dark:border-neutral-800 dark:bg-neutral-950/90"
      role="group"
      aria-label="Network"
    >
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => setCluster(o.value)}
          className={`rounded-full px-4 py-1.5 transition-colors ${
            cluster === o.value
              ? "bg-neutral-950 text-white shadow-sm dark:bg-white dark:text-neutral-950"
              : "text-[var(--muted)] hover:text-[var(--foreground)] dark:hover:text-slate-200"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
