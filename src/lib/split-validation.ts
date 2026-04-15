const RENT_EXEMPT_MINIMUM_SOL = 0.00228;

/**
 * Returns an error string if the split amount is invalid, or null if valid.
 */
export function validateSplitAmount(
  splitSol: number,
  totalSol: number,
): string | null {
  if (splitSol <= 0) return "Enter an amount";
  const remaining = totalSol - splitSol;
  if (remaining <= 0) return "Not enough remaining balance";
  if (remaining < RENT_EXEMPT_MINIMUM_SOL) {
    return `Original account must keep at least ${RENT_EXEMPT_MINIMUM_SOL} SOL (rent-exempt minimum)`;
  }
  if (splitSol < RENT_EXEMPT_MINIMUM_SOL) {
    return `New account must have at least ${RENT_EXEMPT_MINIMUM_SOL} SOL (rent-exempt minimum)`;
  }
  return null;
}
