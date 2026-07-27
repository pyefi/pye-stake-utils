import { describe, it, expect } from "vitest";
import {
  FALLBACK_MIN_DELEGATION_LAMPORTS,
  fetchMinimumDelegation,
} from "./fetch-minimum-delegation";

describe("fetchMinimumDelegation", () => {
  it("returns the minimum reported by the cluster", async () => {
    const connection = {
      getStakeMinimumDelegation: async () => ({
        context: { slot: 1 },
        value: 1_000_000_000,
      }),
    };

    await expect(fetchMinimumDelegation(connection)).resolves.toBe(
      1_000_000_000,
    );
  });

  it("returns whatever the cluster reports, not a hardcoded 1 SOL", async () => {
    const connection = {
      getStakeMinimumDelegation: async () => ({
        context: { slot: 1 },
        value: 1,
      }),
    };

    await expect(fetchMinimumDelegation(connection)).resolves.toBe(1);
  });

  it("falls back to the known mainnet minimum when the RPC call fails", async () => {
    const connection = {
      getStakeMinimumDelegation: async () => {
        throw new Error("method not supported");
      },
    };

    // Fail closed: guessing too low would let doomed transactions through.
    await expect(fetchMinimumDelegation(connection)).resolves.toBe(
      FALLBACK_MIN_DELEGATION_LAMPORTS,
    );
    expect(FALLBACK_MIN_DELEGATION_LAMPORTS).toBe(1_000_000_000);
  });
});
