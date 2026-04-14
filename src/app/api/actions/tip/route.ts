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

export async function POST(req: Request) {
  const url = new URL(req.url);
  const amount = Number(url.searchParams.get("amount") ?? "0.01");
  const recipientStr = process.env.TIP_RECIPIENT?.trim();

  if (!recipientStr) {
    return Response.json(
      { message: "Tip recipient not configured" },
      { status: 400, headers: ACTIONS_CORS_HEADERS },
    );
  }

  if (!Number.isFinite(amount) || amount <= 0 || amount > 100) {
    return Response.json(
      { message: "Invalid tip amount" },
      { status: 400, headers: ACTIONS_CORS_HEADERS },
    );
  }

  let parsed: ActionPostBody;
  try {
    parsed = (await req.json()) as ActionPostBody;
  } catch {
    return Response.json(
      { message: "Invalid JSON body" },
      { status: 400, headers: ACTIONS_CORS_HEADERS },
    );
  }

  if (!parsed.account) {
    return Response.json(
      { message: "Missing signing account" },
      { status: 400, headers: ACTIONS_CORS_HEADERS },
    );
  }

  let payer: PublicKey;
  let receiver: PublicKey;
  try {
    payer = new PublicKey(parsed.account);
    receiver = new PublicKey(recipientStr);
  } catch {
    return Response.json(
      { message: "Invalid pubkey" },
      { status: 400, headers: ACTIONS_CORS_HEADERS },
    );
  }

  const lamports = Math.round(amount * LAMPORTS_PER_SOL);

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: payer,
      toPubkey: receiver,
      lamports,
    }),
  );

  const response = await createPostResponse({
    fields: {
      type: "transaction",
      transaction,
      message: `Tip ${amount} SOL. Thank you.`,
    },
  });

  return Response.json(response, { headers: ACTIONS_CORS_HEADERS });
}

interface ActionPostBody {
  account: string;
}
