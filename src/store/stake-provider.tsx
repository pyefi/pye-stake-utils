"use client";

import {
  createContext,
  useContext,
  useRef,
  type ReactNode,
} from "react";
import { useStore } from "zustand";
import { createStakeStore } from "@/store/stake-store";
import type { StakeStore } from "@/store/stake-store";

type StakeStoreApi = ReturnType<typeof createStakeStore>;
const StakeStoreContext = createContext<StakeStoreApi | null>(null);

export function StakeStoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<StakeStoreApi>(undefined);
  if (!storeRef.current) {
    storeRef.current = createStakeStore();
  }

  return (
    <StakeStoreContext.Provider value={storeRef.current}>
      {children}
    </StakeStoreContext.Provider>
  );
}

export function useStakeStore<T>(selector: (s: StakeStore) => T): T {
  const store = useContext(StakeStoreContext);
  if (!store) throw new Error("useStakeStore must be inside StakeStoreProvider");
  return useStore(store, selector);
}
