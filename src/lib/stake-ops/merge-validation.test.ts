import { describe, it, expect } from "vitest";
import { validateMerge } from "./merge-validation";
import type { StakeAccount, StakeAccountState, StakeLockup } from "@/lib/types";

const WALLET = "WaLLeT11111111111111111111111111111111111111";
const OTHER = "OtHeR111111111111111111111111111111111111111";
const VOTER_A = "VoTeRAaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const VOTER_B = "VoTeRBbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const PUB_A = "AccountA1111111111111111111111111111111111111";
const PUB_B = "AccountB1111111111111111111111111111111111111";

const NOW_UNIX = 1_700_000_000;
const CURRENT_EPOCH = 700;

function acc(overrides: Partial<StakeAccount> = {}): StakeAccount {
  return {
    pubkey: PUB_A,
    validatorVoteAccount: VOTER_A,
    validatorName: "Validator A",
    validatorIcon: "",
    lamports: 1_000_000_000,
    state: "inactive",
    authorities: ["staker", "withdrawer"],
    lockup: null,
    ...overrides,
  };
}

function lockup(overrides: Partial<StakeLockup> = {}): StakeLockup {
  return {
    epoch: 0,
    unixTimestamp: 0,
    custodian: WALLET,
    ...overrides,
  };
}

describe("validateMerge", () => {
  it("rejects merging an account into itself", () => {
    const dest = acc({ pubkey: PUB_A });
    const src = acc({ pubkey: PUB_A });
    const result = validateMerge(dest, src, WALLET, CURRENT_EPOCH, NOW_UNIX);
    expect(result.ok).toBe(false);
  });

  it("rejects when wallet is not staker on the source", () => {
    const dest = acc({ pubkey: PUB_A });
    const src = acc({ pubkey: PUB_B, authorities: ["withdrawer"] });
    const result = validateMerge(dest, src, WALLET, CURRENT_EPOCH, NOW_UNIX);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/staker/i);
  });

  it("rejects when wallet is not staker on the destination", () => {
    const dest = acc({ pubkey: PUB_A, authorities: ["withdrawer"] });
    const src = acc({ pubkey: PUB_B });
    const result = validateMerge(dest, src, WALLET, CURRENT_EPOCH, NOW_UNIX);
    expect(result.ok).toBe(false);
  });

  it("accepts both inactive", () => {
    const dest = acc({ pubkey: PUB_A, state: "inactive" });
    const src = acc({ pubkey: PUB_B, state: "inactive" });
    expect(validateMerge(dest, src, WALLET, CURRENT_EPOCH, NOW_UNIX).ok).toBe(true);
  });

  it("accepts both active on the same validator", () => {
    const dest = acc({ pubkey: PUB_A, state: "active", validatorVoteAccount: VOTER_A });
    const src = acc({ pubkey: PUB_B, state: "active", validatorVoteAccount: VOTER_A });
    expect(validateMerge(dest, src, WALLET, CURRENT_EPOCH, NOW_UNIX).ok).toBe(true);
  });

  it("rejects both active on different validators", () => {
    const dest = acc({ pubkey: PUB_A, state: "active", validatorVoteAccount: VOTER_A });
    const src = acc({ pubkey: PUB_B, state: "active", validatorVoteAccount: VOTER_B });
    const result = validateMerge(dest, src, WALLET, CURRENT_EPOCH, NOW_UNIX);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/validator/i);
  });

  it("accepts both deactivating on the same validator", () => {
    const dest = acc({ pubkey: PUB_A, state: "deactivating" });
    const src = acc({ pubkey: PUB_B, state: "deactivating" });
    expect(validateMerge(dest, src, WALLET, CURRENT_EPOCH, NOW_UNIX).ok).toBe(true);
  });

  it("rejects both deactivating on different validators", () => {
    const dest = acc({ pubkey: PUB_A, state: "deactivating", validatorVoteAccount: VOTER_A });
    const src = acc({ pubkey: PUB_B, state: "deactivating", validatorVoteAccount: VOTER_B });
    expect(validateMerge(dest, src, WALLET, CURRENT_EPOCH, NOW_UNIX).ok).toBe(false);
  });

  it("accepts activating + inactive in either direction", () => {
    const a = acc({ pubkey: PUB_A, state: "activating" });
    const b = acc({ pubkey: PUB_B, state: "inactive" });
    expect(validateMerge(a, b, WALLET, CURRENT_EPOCH, NOW_UNIX).ok).toBe(true);
    expect(validateMerge(b, a, WALLET, CURRENT_EPOCH, NOW_UNIX).ok).toBe(true);
  });

  for (const [d, s] of [
    ["active", "inactive"],
    ["active", "activating"],
    ["active", "deactivating"],
    ["activating", "activating"],
    ["activating", "deactivating"],
    ["deactivating", "inactive"],
  ] as Array<[StakeAccountState, StakeAccountState]>) {
    it(`rejects ${d} + ${s}`, () => {
      const dest = acc({ pubkey: PUB_A, state: d });
      const src = acc({ pubkey: PUB_B, state: s });
      expect(validateMerge(dest, src, WALLET, CURRENT_EPOCH, NOW_UNIX).ok).toBe(false);
    });
  }

  it("rejects when source has an in-force lockup and wallet is not custodian", () => {
    const dest = acc({ pubkey: PUB_A });
    const src = acc({
      pubkey: PUB_B,
      lockup: lockup({ epoch: CURRENT_EPOCH + 10, custodian: OTHER }),
    });
    const result = validateMerge(dest, src, WALLET, CURRENT_EPOCH, NOW_UNIX);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/lockup/i);
  });

  it("rejects when destination has an in-force lockup (unix-time) and wallet is not custodian", () => {
    const dest = acc({
      pubkey: PUB_A,
      lockup: lockup({ unixTimestamp: NOW_UNIX + 86_400, custodian: OTHER }),
    });
    const src = acc({ pubkey: PUB_B });
    expect(validateMerge(dest, src, WALLET, CURRENT_EPOCH, NOW_UNIX).ok).toBe(false);
  });

  it("accepts in-force lockup when wallet is the custodian and lockups match", () => {
    const lk = lockup({ epoch: CURRENT_EPOCH + 10, custodian: WALLET });
    const dest = acc({ pubkey: PUB_A, lockup: lk });
    const src = acc({ pubkey: PUB_B, lockup: lk });
    expect(validateMerge(dest, src, WALLET, CURRENT_EPOCH, NOW_UNIX).ok).toBe(true);
  });

  it("rejects when both have lockups that differ", () => {
    const dest = acc({ pubkey: PUB_A, lockup: lockup({ epoch: 100 }) });
    const src = acc({ pubkey: PUB_B, lockup: lockup({ epoch: 200 }) });
    const result = validateMerge(dest, src, WALLET, CURRENT_EPOCH, NOW_UNIX);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/lockup/i);
  });

  it("rejects when one side has lockup and the other does not", () => {
    const dest = acc({ pubkey: PUB_A, lockup: lockup({ epoch: 100 }) });
    const src = acc({ pubkey: PUB_B, lockup: null });
    expect(validateMerge(dest, src, WALLET, CURRENT_EPOCH, NOW_UNIX).ok).toBe(false);
  });

  it("accepts when both lockups are expired and identical", () => {
    const lk = lockup({ epoch: CURRENT_EPOCH - 50, custodian: OTHER });
    const dest = acc({ pubkey: PUB_A, lockup: lk });
    const src = acc({ pubkey: PUB_B, lockup: lk });
    expect(validateMerge(dest, src, WALLET, CURRENT_EPOCH, NOW_UNIX).ok).toBe(true);
  });
});
