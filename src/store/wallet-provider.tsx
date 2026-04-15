"use client";

import {
  createContext,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useStore } from "zustand";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { createWalletStore, type WalletStore } from "./wallet-store";
import "@solana/wallet-adapter-react-ui/styles.css";

const RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.mainnet-beta.solana.com";

type WalletStoreApi = ReturnType<typeof createWalletStore>;
const WalletStoreContext = createContext<WalletStoreApi | null>(null);

export function WalletStoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<WalletStoreApi>(undefined);
  if (!storeRef.current) {
    storeRef.current = createWalletStore();
  }

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    [],
  );

  return (
    <ConnectionProvider endpoint={RPC_ENDPOINT}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletStoreContext.Provider value={storeRef.current}>
            {children}
          </WalletStoreContext.Provider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export function useWalletStore<T>(selector: (s: WalletStore) => T): T {
  const store = useContext(WalletStoreContext);
  if (!store) throw new Error("useWalletStore must be inside WalletStoreProvider");
  return useStore(store, selector);
}
