import type { Connection } from "@solana/web3.js";

/**
 * Used when the cluster cannot be asked for its minimum. This is the current
 * mainnet value, and erring high is the safe direction: a too-low guess would
 * let the UI submit transactions that fail on chain with
 * `StakeError::InsufficientDelegation`.
 */
export const FALLBACK_MIN_DELEGATION_LAMPORTS = 1_000_000_000;

/**
 * The minimum delegated stake, in lamports, that the stake program requires
 * every delegated account to hold. Feature-gate dependent — 1 lamport before
 * the 1-SOL raise activated, 1 SOL on mainnet now — so it is read from the
 * cluster rather than hardcoded.
 */
export async function fetchMinimumDelegation(
  connection: Pick<Connection, "getStakeMinimumDelegation">,
): Promise<number> {
  try {
    const { value } = await connection.getStakeMinimumDelegation();
    return value;
  } catch {
    return FALLBACK_MIN_DELEGATION_LAMPORTS;
  }
}
