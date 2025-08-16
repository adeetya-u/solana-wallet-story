# Solpeek

**Site:** [`https://solpeek.vercel.app`](https://solpeek.vercel.app) — try the [live demo](https://solpeek.vercel.app/dashboard?address=7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU), paste any address, or connect Phantom / Solflare on **Mainnet** or **Devnet**.

**JSON-RPC `403` in the browser:** set **`SOLANA_RPC_URL`** (Helius / QuickNode mainnet HTTPS) on Vercel so **`/api/solana-rpc`** can relay from the server; then redeploy.

If the domain ever shows an old CRA shell (“Solpeek Stream”), open Vercel → **solpeek** → set the latest **Next** build as Production and review **Deployment Protection** for production.

Inspired in part by Solana Foundation [RFP themes](https://solana.com/developers/defi/rfp/free-ideas)—keeping the build small and runnable on Vercel without an indexer.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
