# Solpeek

**Site:** [`https://solpeek-live.vercel.app`](https://solpeek-live.vercel.app) — try the [live demo](https://solpeek-live.vercel.app/dashboard?address=7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU), paste any address, or connect Phantom / Solflare on **Mainnet** or **Devnet**.

Production is wired to the Vercel project **`solpeek-live`** (Next.js on this repo). After `git clone`, run `vercel link` and pick that project if you deploy from the CLI.

**JSON-RPC `403` in the browser:** set **`SOLANA_RPC_URL`** (Helius / QuickNode mainnet HTTPS) on Vercel so **`/api/solana-rpc`** can relay from the server; then redeploy.

On Vercel → **solpeek-live** → **Environment Variables**, set **`NEXT_PUBLIC_APP_URL`** to **`https://solpeek-live.vercel.app`** (Actions metadata), **`SOLANA_RPC_URL`**, and any optional vars (then **Redeploy**).

If Production looks gated or stale, open **solpeek-live** → **Deployments** → confirm the latest build is promoted and review **Deployment Protection**.

Inspired in part by Solana Foundation [RFP themes](https://solana.com/developers/defi/rfp/free-ideas)—keeping the build small and runnable on Vercel without an indexer.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Why this exists (business / trader / dev angle)

Most products either (a) dump raw transaction rows like a block explorer, or (b) require a paid indexer for rich labels. Solpeek sits in the middle: **fast, shareable, read-only program exposure** for the **newest N signatures**—so you can answer “what does this wallet actually touch?” (DEX routers, SPL, staking, metadata programs, failure rate in sample) **before** you integrate it in code or move funds OTC. No custody, no seed phrase; optional wallet connect for your own address.

## Architecture

Mainnet reads go to **`/api/solana-rpc`** (same origin), which forwards to **`SOLANA_RPC_URL`** on the server so keys stay off the client and public-RPC **403** from browsers is avoided. Devnet still uses the public devnet cluster URL. Wallet Adapter uses `@solana/web3.js` (`ConnectionProvider`). There is **no indexer**: the UI caps history (default **48** newest signatures) and loads parsed `getTransaction` calls as **parallel single-RPC requests** (not JSON-RPC batch arrays), which stays compatible with free RPC tiers that disallow batching.

```mermaid
flowchart LR
  subgraph client [Browser]
    UA[WalletAdapter]
    Dash[Dashboard_UI]
  end
  subgraph server [Vercel]
    Proxy["/api/solana-rpc"]
    Discovery["/actions.json"]
    Tip["/api/actions/tip"]
  end
  RPC[Upstream_RPC]
  UA --> Dash
  Dash --> Proxy
  Proxy --> RPC
  BlinkClient[Blink_clients] --> Discovery
  BlinkClient --> Tip
```

## Features

| Area | What it demonstrates |
|------|-----------------------|
| **Instant demo** | Home → “Try live demo” loads a busy mainnet signer with **no wallet connect** |
| **Explorer mode** | `/dashboard?address=<pubkey>` read-only for any wallet or program-owned account |
| **Dashboard** | Bounded-window program rollup + heuristic “behavior hints” (explorer-style tx lists deliberately out of scope for speed) |
| **Mainnet RPC proxy** | Browser → `/api/solana-rpc` → `SOLANA_RPC_URL` (avoids public-RPC **403**) |
| **Cluster toggle** | `mainnet-beta` vs `devnet`, persisted locally |
| **Optional mint lookup** | `getParsedTokenAccountsByOwner` for a pasted mint pubkey |
| **Solana Actions** | `GET/POST OPTIONS` `/api/actions/tip` (+ root [`/actions.json`](./src/app/actions.json/route.ts) for Blink discovery) |

“Heuristic” labels (`swap-like`, etc.) infer intent from observed program IDs (e.g. Jupiter v6, SPL Token)—they are **not** audited classifications.

## Local development

Requirements: Node 20+ recommended.

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Scope | Purpose |
|----------|--------|---------|
| `SOLANA_RPC_URL` | Server | **Mainnet** upstream for `/api/solana-rpc` (Helius / QuickNode HTTPS). Strongly recommended in production. |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | Public | Optional: forces **direct** browser → RPC (skips proxy; URL visible in DevTools). |
| `NEXT_PUBLIC_APP_URL` | Public | Fallback origin for Action metadata when deployed behind proxies (`https://your-app.vercel.app`). |
| `TIP_RECIPIENT` | Server | Solana pubkey (base58) that receives SOL from the Blink tip Action. Omit to show a disabled state in `GET`. |

Copy from [`.env.example`](.env.example).

## Deploy on Vercel

1. Link **Git**: connect repository [**adeetya-u/solana-wallet-story**](https://github.com/adeetya-u/solana-wallet-story), **Production branch** `main`, **Root Directory** `.` (repo root). Use—or create—a project named **`solpeek-live`** if you want the same hostname convention.
2. Set **Production** variables: **`SOLANA_RPC_URL`** = your Helius / QuickNode mainnet HTTPS URL (required so mainnet demos work—public RPC blocks many browsers). Also set **`NEXT_PUBLIC_APP_URL=https://solpeek-live.vercel.app`** (or your deployed origin). Optional: **`TIP_RECIPIENT`**.
3. Redeploy. Framework preset: Next.js (`vercel.json` already pins install/build).

## Blink / Actions testing

- Discovery file: `{YOUR_ORIGIN}/actions.json`
- Action endpoint: `{YOUR_ORIGIN}/api/actions/tip`
- When `TIP_RECIPIENT` is unset, wallets still render metadata with a disabled state describing missing configuration.

Official reference: [Actions and blinks — Solana](https://solana.com/developers/guides/advanced/actions).

## Security & disclaimer

Insight cards use **only public chain data**. The tip Action asks you to sign a **`SystemProgram.transfer`** you authorize in your wallet. Review every transaction preview and never expose private keys.

This project is demo software; Solana Labs / Foundation are unrelated.

## Scripts

```bash
npm run dev       # Turbopack dev server
npm run build     # Production build + typecheck
npm run lint      # ESLint
```
