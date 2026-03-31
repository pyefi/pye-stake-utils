import { createStore } from "zustand/vanilla";
import { Connection, PublicKey } from "@solana/web3.js";
import { fetchStakeAccounts } from "../lib/fetch-stake-accounts.js";
import type { StakeAccount } from "../types/index.js";

export interface StakeState {
  stakeAccounts: StakeAccount[];
  loading: boolean;
  error: string | null;
  lastFetchedAt: number | null;
}

export interface StakeActions {
  setStakeAccounts: (accounts: StakeAccount[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  /**
   * Fetch stake accounts from chain and update store.
   * Only shows loading spinner when store is empty (initial fetch).
   * Pass a validatorMap to resolve vote accounts to names/icons.
   */
  refresh: (
    connection: Connection,
    owner: PublicKey,
    validatorMap?: Map<string, { name: string; icon: string }>,
  ) => Promise<void>;
  reset: () => void;
}

export type StakeStore = StakeState & StakeActions;

const initialState: StakeState = {
  stakeAccounts: [],
  loading: false,
  error: null,
  lastFetchedAt: null,
};

export function createStakeStore() {
  return createStore<StakeStore>()((set, get) => ({
    ...initialState,

    setStakeAccounts(accounts) {
      set({ stakeAccounts: accounts, lastFetchedAt: Date.now() });
    },

    setLoading(loading) {
      set({ loading });
    },

    setError(error) {
      set({ error });
    },

    async refresh(connection, owner, validatorMap) {
      // Only show loading spinner on initial fetch (no data yet)
      if (get().stakeAccounts.length === 0) {
        set({ loading: true });
      }
      try {
        const accounts = await fetchStakeAccounts(connection, owner, validatorMap);
        set({
          stakeAccounts: accounts,
          error: null,
          lastFetchedAt: Date.now(),
        });
      } catch (err) {
        set({
          error: err instanceof Error ? err.message : String(err),
        });
      } finally {
        set({ loading: false });
      }
    },

    reset() {
      set(initialState);
    },
  }));
}
