import { NextResponse } from "next/server";

/** Placeholder same-origin RPC relay until upstream env wiring lands. */
export async function POST(req: Request) {
  try {
    await req.text();
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

  return NextResponse.json(
    {
      jsonrpc: "2.0",
      error: { code: -32001, message: "RPC relay not wired (set SOLANA_RPC_URL)." },
      id: null,
    },
    { status: 503 },
  );
}
