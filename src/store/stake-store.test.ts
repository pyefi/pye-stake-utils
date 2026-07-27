import { describe, it, expect } from "vitest";
import { createStakeStore } from "./stake-store";
import type { Connection } from "@solana/web3.js";

function fakeConnection(value: number) {
  let calls = 0;
  return {
    connection: {
      getStakeMinimumDelegation: async () => {
        calls += 1;
        return { context: { slot: 1 }, value };
      },
    } as unknown as Connection,
    calls: () => calls,
  };
}

describe("stake store minimum delegation", () => {
  it("starts out unknown", () => {
    expect(createStakeStore().getState().minDelegationLamports).toBeNull();
  });

  it("loads the cluster minimum", async () => {
    const store = createStakeStore();
    const { connection } = fakeConnection(1_000_000_000);

    await store.getState().loadMinDelegation(connection);

    expect(store.getState().minDelegationLamports).toBe(1_000_000_000);
  });

  it("only asks the cluster once", async () => {
    const store = createStakeStore();
    const { connection, calls } = fakeConnection(1_000_000_000);

    await store.getState().loadMinDelegation(connection);
    await store.getState().loadMinDelegation(connection);

    expect(calls()).toBe(1);
  });

  it("keeps the cluster minimum across a wallet reset", async () => {
    const store = createStakeStore();
    const { connection } = fakeConnection(1_000_000_000);

    await store.getState().loadMinDelegation(connection);
    store.getState().setStakeAccounts([]);
    store.getState().reset();

    // reset() clears wallet-scoped state on disconnect. The cluster minimum is
    // not wallet-scoped, and it is only fetched once on mount, so dropping it
    // here would leave it null for the rest of the session.
    expect(store.getState().minDelegationLamports).toBe(1_000_000_000);
    expect(store.getState().stakeAccounts).toEqual([]);
    expect(store.getState().lastFetchedAt).toBeNull();
  });
});
