"use client";

import { useEffect, useRef } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useWalletStore } from "@/store/wallet-provider";
import { shortenAddress } from "@/lib/format";

export default function WalletButton() {
  const { publicKey, connected, connecting, disconnect } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();

  const setWalletStatus = useWalletStore((s) => s.setWalletStatus);
  const setPublicKey = useWalletStore((s) => s.setPublicKey);
  const setDisplayAddress = useWalletStore((s) => s.setDisplayAddress);
  const setBalanceLamports = useWalletStore((s) => s.setBalanceLamports);
  const resetWallet = useWalletStore((s) => s.resetWallet);

  const fetchedKeyRef = useRef<string | null>(null);

  const fetchBalance = async () => {
    if (!publicKey || !connection) return;
    try {
      const balance = await connection.getBalance(publicKey, "confirmed");
      setBalanceLamports(balance);
    } catch {
      setBalanceLamports(null);
    }
  };

  useEffect(() => {
    if (connecting) {
      setWalletStatus("connecting");
    } else if (connected && publicKey) {
      const base58 = publicKey.toBase58();
      setWalletStatus("connected");
      setPublicKey(base58);
      setDisplayAddress(shortenAddress(base58));
      if (fetchedKeyRef.current !== base58) {
        fetchedKeyRef.current = base58;
        fetchBalance();
      }
    } else {
      resetWallet();
      fetchedKeyRef.current = null;
    }
  }, [connected, connecting, publicKey]);

  useEffect(() => {
    if (!connected || !publicKey || !connection) return;
    const id = connection.onAccountChange(
      publicKey,
      (info) => setBalanceLamports(info.lamports),
      "confirmed",
    );
    return () => {
      connection.removeAccountChangeListener(id);
    };
  }, [connected, publicKey?.toBase58(), connection]);

  const monoStyle = {
    fontFeatureSettings:
      "'cv01' 1,'cv02' 1,'cv03' 1,'cv04' 1,'zero' 1,'lnum' 1,'tnum' 1",
  } as const;

  return (
    <button
      onClick={() => (connected ? disconnect() : setVisible(true))}
      disabled={connecting}
      className="relative flex items-center gap-2 h-9 bg-layers-surface-default border-t border-layers-elevation-highlight rounded px-3 cursor-pointer disabled:cursor-wait shrink-0"
    >
      {!connected && !connecting && (
        <span className="text-sm text-brand-primary-purple" style={monoStyle}>
          Connect Wallet
        </span>
      )}
      {connecting && (
        <span className="text-sm text-text-secondary" style={monoStyle}>
          Connecting...
        </span>
      )}
      {connected && publicKey && (
        <span className="text-sm text-text-primary" style={monoStyle}>
          {shortenAddress(publicKey.toBase58())}
        </span>
      )}
      <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-shadow)]" />
    </button>
  );
}
