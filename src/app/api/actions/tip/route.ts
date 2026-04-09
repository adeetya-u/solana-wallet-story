import { ACTIONS_CORS_HEADERS, createPostResponse } from "@solana/actions";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

function appOrigin(req: Request): string {
  const url = new URL(req.url);
  if (url.origin && url.origin !== "null") return url.origin;
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (base) return base;
  return "http://localhost:3000";
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: ACTIONS_CORS_HEADERS });
}

export async function GET(req: Request) {
  const origin = appOrigin(req);
  const icon = `${origin}/solana-wallet-story-icon.svg`;
  const recipient = process.env.TIP_RECIPIENT?.trim();

  const base = {
    type: "action" as const,
    icon,
    title: "Support Solpeek",
    description: "Optional SOL tip to Solpeek. You sign a simple transfer.",
    label: recipient ? "Tip SOL" : "Tip (not configured)",
  };

  if (!recipient) {
    return Response.json(
      {
        ...base,
        disabled: true,
        error: {
          message:
            "Set TIP_RECIPIENT in server environment variables to enable tips.",
        },
      },
      { headers: ACTIONS_CORS_HEADERS },
    );
  }

  const hrefBase = `${origin}/api/actions/tip`;
  return Response.json(
    {
      ...base,
      links: {
        actions: [
          {
            type: "transaction" as const,
            label: "0.01 SOL",
            href: `${hrefBase}?amount=0.01`,
          },
          {
            type: "transaction" as const,
            label: "0.05 SOL",
            href: `${hrefBase}?amount=0.05`,
          },
        ],
      },
    },
    { headers: ACTIONS_CORS_HEADERS },
  );
}

export async function POST() {
  return Response.json(
    { message: "Tip handler not wired yet" },
    { status: 501 },
  );
}
