import { lamportsToSol } from "./format";

/**
 * The stake program requires every delegated stake account to hold at least
 * `getStakeMinimumDelegation()` lamports of stake. Splitting is checked on both
 * sides: the new account and whatever remains in the original. Violating either
 * fails on chain with `StakeError::InsufficientDelegation` (custom error 0xc).
 *
 * The minimum is a cluster/feature-gate value — it was 1 lamport for years and
 * is now 1 SOL on mainnet — so it must always be passed in from
 * `fetchMinimumDelegation()` rather than hardcoded here.
 *
 * All amounts are lamports of *delegated stake*, not total account lamports.
 * The new account's rent-exempt reserve is funded separately by the fee payer,
 * so it does not come out of the split amount.
 */
export function validateSplitAmount(
  splitLamports: number,
  delegatedLamports: number,
  minDelegationLamports: number,
): string | null {
  if (splitLamports <= 0) return "Enter an amount";

  const remaining = delegatedLamports - splitLamports;
  if (remaining <= 0) return "Not enough remaining balance";

  const minSol = lamportsToSol(minDelegationLamports);

  if (splitLamports < minDelegationLamports) {
    return `New account must have at least ${minSol} SOL of stake (network minimum)`;
  }
  if (remaining < minDelegationLamports) {
    return `Original account must keep at least ${minSol} SOL of stake (network minimum)`;
  }

  return null;
}

/**
 * Whether an account is large enough to be split at all. Below twice the
 * minimum delegation there is no split amount that satisfies both sides, so the
 * UI should disable the action outright rather than report an amount error.
 */
export function canSplitAccount(
  delegatedLamports: number,
  minDelegationLamports: number,
): boolean {
  return delegatedLamports >= minDelegationLamports * 2;
}
