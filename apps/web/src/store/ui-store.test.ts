import { describe, it, expect, beforeEach } from "vitest";
import { createUIStore } from "./ui-store";

describe("UIStore", () => {
  let store: ReturnType<typeof createUIStore>;

  beforeEach(() => {
    store = createUIStore();
  });

  it("starts with no selected account and state-change tab active", () => {
    const s = store.getState();
    expect(s.selectedAccountPubkey).toBeNull();
    expect(s.activeTab).toBe("state-change");
  });

  it("selectAccount sets the pubkey", () => {
    store.getState().selectAccount("abc123");
    expect(store.getState().selectedAccountPubkey).toBe("abc123");
  });

  it("setActiveTab switches tabs", () => {
    store.getState().setActiveTab("split");
    expect(store.getState().activeTab).toBe("split");
  });

  it("setSplitSol updates splitSol", () => {
    store.getState().setSplitSol(5);
    expect(store.getState().splitSol).toBe(5);
  });

  it("setTransferAddress updates transferAddress", () => {
    store.getState().setTransferAddress("newAddr");
    expect(store.getState().transferAddress).toBe("newAddr");
  });

  it("setTxStatus sets status and clears signature", () => {
    store.getState().setTxStatus("pending");
    expect(store.getState().txStatus).toBe("pending");
    expect(store.getState().txSignature).toBeNull();
  });

  it("setTxSuccess sets status to success and stores signature", () => {
    store.getState().setTxSuccess("sig123");
    expect(store.getState().txStatus).toBe("success");
    expect(store.getState().txSignature).toBe("sig123");
  });

  it("resetTx clears tx state", () => {
    store.getState().setTxSuccess("sig123");
    store.getState().resetTx();
    expect(store.getState().txStatus).toBeNull();
    expect(store.getState().txSignature).toBeNull();
  });
});
