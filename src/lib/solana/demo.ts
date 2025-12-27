/** Active mainnet pubkey used for instant “open and it works” demo (no wallet). */
export const DEMO_WALLET_MAINNET =
  "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";

export function demoDashboardHref(): string {
  return `/dashboard?address=${encodeURIComponent(DEMO_WALLET_MAINNET)}`;
}
