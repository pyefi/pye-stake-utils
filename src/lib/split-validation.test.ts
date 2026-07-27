import { describe, it, expect } from "vitest";
import { canSplitAccount, validateSplitAmount } from "./split-validation";

const ONE_SOL = 1_000_000_000;
const MIN_DELEGATION = ONE_SOL; // mainnet value since the 1-SOL raise activated

describe("validateSplitAmount", () => {
  it("returns error when amount is 0", () => {
    expect(validateSplitAmount(0, 10 * ONE_SOL, MIN_DELEGATION)).toBe(
      "Enter an amount",
    );
  });

  it("returns error when amount equals the delegated stake (nothing left)", () => {
    expect(
      validateSplitAmount(10 * ONE_SOL, 10 * ONE_SOL, MIN_DELEGATION),
    ).toMatch(/remaining/i);
  });

  it("returns error when the new account would hold less than the minimum delegation", () => {
    const error = validateSplitAmount(
      0.5 * ONE_SOL,
      10 * ONE_SOL,
      MIN_DELEGATION,
    );
    expect(error).toMatch(/new account/i);
    expect(error).toMatch(/1 SOL/);
  });

  it("returns error when the original account would drop below the minimum delegation", () => {
    const error = validateSplitAmount(
      9.5 * ONE_SOL,
      10 * ONE_SOL,
      MIN_DELEGATION,
    );
    expect(error).toMatch(/original account/i);
    expect(error).toMatch(/1 SOL/);
  });

  it("rejects the PRO-514 split that failed on chain with InsufficientDelegation", () => {
    // Source account 7v1He5wt… had 59,117,038 lamports delegated and the
    // request tried to split off 0.01 SOL. Both sides land under 1 SOL.
    expect(validateSplitAmount(10_000_000, 59_117_038, MIN_DELEGATION)).not.toBe(
      null,
    );
  });

  it("accepts a split that leaves exactly the minimum delegation on both sides", () => {
    expect(
      validateSplitAmount(1 * ONE_SOL, 2 * ONE_SOL, MIN_DELEGATION),
    ).toBeNull();
  });

  it("returns null for a valid split", () => {
    expect(
      validateSplitAmount(5 * ONE_SOL, 10 * ONE_SOL, MIN_DELEGATION),
    ).toBeNull();
  });

  it("honours a lower network minimum instead of hardcoding 1 SOL", () => {
    // A cluster without the 1-SOL raise reports a 1-lamport minimum.
    expect(validateSplitAmount(10_000_000, 59_117_038, 1)).toBeNull();
  });
});

describe("canSplitAccount", () => {
  it("is false when the account cannot cover the minimum on both sides", () => {
    expect(canSplitAccount(59_117_038, MIN_DELEGATION)).toBe(false);
  });

  it("is false just below twice the minimum", () => {
    expect(canSplitAccount(2 * ONE_SOL - 1, MIN_DELEGATION)).toBe(false);
  });

  it("is true at exactly twice the minimum", () => {
    expect(canSplitAccount(2 * ONE_SOL, MIN_DELEGATION)).toBe(true);
  });
});
