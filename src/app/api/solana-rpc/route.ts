import { clusterApiUrl } from "@solana/web3.js";
import { NextResponse } from "next/server";

/**
 * Same-origin JSON-RPC proxy so the browser never talks to brittle public mainnet IPs
 * directly (often 403 Forbidden). Prefer SOLANA_RPC_URL (Helius, QuickNode, etc.) server-side.
 */
export async function POST(req: Request) {
  let bodyText: string;
  try {
    bodyText = await req.text();
  } catch {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: { code: -32700, message: "Failed to read body" },
        id: null,
      },
      { status: 400 },
    );
  }

  const upstream =
    process.env.SOLANA_RPC_URL?.trim() || clusterApiUrl("mainnet-beta");

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(upstream, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: bodyText,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: { code: -32002, message: "Upstream RPC transport error" },
        id: null,
      },
      { status: 502 },
    );
  }

  const text = await upstreamRes.text();

  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );

  return new NextResponse(text, {
    status: upstreamRes.status,
    headers,
  });
}
