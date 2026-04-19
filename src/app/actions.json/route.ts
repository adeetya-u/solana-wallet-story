import { ACTIONS_CORS_HEADERS } from "@solana/actions";

/**
 * Blink clients discover Actions via /.well-known or /actions.json at site root per spec:
 * https://solana.com/developers/guides/advanced/actions
 *
 * Served dynamically so ACCESS_CONTROL_* headers accompany the discovery file on Vercel.
 */
export async function GET() {
  return Response.json(
    {
      rules: [{ pathPattern: "/tip*", apiPath: "/api/actions/tip" }],
    },
    {
      headers: {
        ...ACTIONS_CORS_HEADERS,
        "Content-Type": "application/json",
      },
    },
  );
}
