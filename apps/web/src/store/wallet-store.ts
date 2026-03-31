import { createStore } from "zustand/vanilla";
import { immer } from "zustand/middleware/immer";

export type WalletStatus = "disconnected" | "connecting" | "connected";

export interface WalletState {
  status: WalletStatus;
  publicKey: string | null;
  displayAddress: string | null;
  balanceLamports: number | null;
  walletInitialized: boolean;
}

export interface WalletActions {
  setWalletStatus: (status: WalletStatus) => void;
  setPublicKey: (pubkey: string | null) => void;
  setDisplayAddress: (addr: string | null) => void;
  setBalanceLamports: (lamports: number | null) => void;
  setWalletInitialized: (v: boolean) => void;
  resetWallet: () => void;
}

export type WalletStore = WalletState & WalletActions;

const initialState: WalletState = {
  status: "disconnected",
  publicKey: null,
  displayAddress: null,
  balanceLamports: null,
  walletInitialized: false,
};

export function createWalletStore() {
  return createStore<WalletStore>()(
    immer((set) => ({
      ...initialState,

      setWalletStatus: (status) => set((s) => { s.status = status; }),
      setPublicKey: (pubkey) => set((s) => { s.publicKey = pubkey; }),
      setDisplayAddress: (addr) => set((s) => { s.displayAddress = addr; }),
      setBalanceLamports: (lamports) => set((s) => { s.balanceLamports = lamports; }),
      setWalletInitialized: (v) => set((s) => { s.walletInitialized = v; }),
      resetWallet: () => set((s) => {
        s.status = "disconnected";
        s.publicKey = null;
        s.displayAddress = null;
        s.balanceLamports = null;
      }),
    })),
  );
}
