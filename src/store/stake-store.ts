import { createStore } from "zustand/vanilla";
import { Connection, PublicKey } from "@solana/web3.js";
import { fetchMinimumDelegation, fetchStakeAccounts } from "@/lib/stake-ops";
import type { StakeAccount } from "@/lib/types";

export interface StakeState {
  stakeAccounts: StakeAccount[];
  loading: boolean;
  error: string | null;
  lastFetchedAt: number | null;
  validatorMap: Map<string, { name: string; icon: string }> | null;
  /**
   * Cluster minimum delegated stake, in lamports. Null until loaded. Actions
   * that would leave an account below this fail on chain, so the UI must not
   * validate amounts before it is known.
   */
  minDelegationLamports: number | null;
}

export interface StakeActions {
  setStakeAccounts: (accounts: StakeAccount[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  refresh: (
    connection: Connection,
    owner: PublicKey,
    validatorMap?: Map<string, { name: string; icon: string }>,
  ) => Promise<void>;
  loadMinDelegation: (connection: Connection) => Promise<void>;
  reset: () => void;
}

export type StakeStore = StakeState & StakeActions;

const initialState: StakeState = {
  stakeAccounts: [],
  loading: false,
  error: null,
  lastFetchedAt: null,
  validatorMap: null,
  minDelegationLamports: null,
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
      const resolvedMap = validatorMap ?? get().validatorMap ?? undefined;
      if (get().stakeAccounts.length === 0) {
        set({ loading: true });
      }
      try {
        const accounts = await fetchStakeAccounts(connection, owner, resolvedMap);
        set({
          stakeAccounts: accounts,
          error: null,
          lastFetchedAt: Date.now(),
          ...(validatorMap ? { validatorMap } : {}),
        });
      } catch (err) {
        set({ error: err instanceof Error ? err.message : String(err) });
      } finally {
        set({ loading: false });
      }
    },

    async loadMinDelegation(connection) {
      // Cluster constant that only changes on feature activation, so one fetch
      // per session is enough.
      if (get().minDelegationLamports !== null) return;
      set({ minDelegationLamports: await fetchMinimumDelegation(connection) });
    },

    reset() {
      // Wallet-scoped state only. minDelegationLamports describes the cluster,
      // not the wallet, and is fetched once per session.
      set({ ...initialState, minDelegationLamports: get().minDelegationLamports });
    },
  }));
}
