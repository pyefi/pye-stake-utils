import { createStore } from "zustand/vanilla";

export type Tab = "state-change" | "split" | "transfer";
export type TxStatus = "pending" | "success" | "error" | null;

export interface UIState {
  selectedAccountPubkey: string | null;
  activeTab: Tab;
  splitSol: number;
  transferAddress: string;
  txStatus: TxStatus;
  txSignature: string | null;
  txError: string | null;
}

export interface UIActions {
  selectAccount: (pubkey: string | null) => void;
  setActiveTab: (tab: Tab) => void;
  setSplitSol: (sol: number) => void;
  setTransferAddress: (address: string) => void;
  setTxStatus: (status: TxStatus) => void;
  setTxSuccess: (signature: string) => void;
  setTxError: (error: string) => void;
  resetTx: () => void;
}

export type UIStore = UIState & UIActions;

const initialState: UIState = {
  selectedAccountPubkey: null,
  activeTab: "state-change",
  splitSol: 0,
  transferAddress: "",
  txStatus: null,
  txSignature: null,
  txError: null,
};

export function createUIStore() {
  return createStore<UIStore>()((set) => ({
    ...initialState,

    selectAccount(pubkey) {
      set({ selectedAccountPubkey: pubkey });
    },

    setActiveTab(tab) {
      set({ activeTab: tab });
    },

    setSplitSol(sol) {
      set({ splitSol: sol });
    },

    setTransferAddress(address) {
      set({ transferAddress: address });
    },

    setTxStatus(status) {
      set({ txStatus: status, txSignature: null, txError: null });
    },

    setTxSuccess(signature) {
      set({ txStatus: "success", txSignature: signature, txError: null });
    },

    setTxError(error) {
      set({ txStatus: "error", txSignature: null, txError: error });
    },

    resetTx() {
      set({ txStatus: null, txSignature: null, txError: null });
    },
  }));
}
