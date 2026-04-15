"use client";

import { useEffect, useRef, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useWalletStore } from "@/store/wallet-provider";
import { shortenAddress } from "@/lib/format";

const monoStyle = {
  fontFeatureSettings:
    "'cv01' 1, 'cv02' 1, 'cv03' 1, 'cv04' 1, 'zero' 1, 'lnum' 1, 'tnum' 1",
} as const;

function WalletDropdown({
  onCopyAddress,
  onDisconnect,
}: {
  onCopyAddress: () => void;
  onDisconnect: () => void;
}) {
  return (
    <div className="absolute right-0 top-[calc(100%+4px)] z-50">
      <div className="relative flex flex-col gap-2 items-end p-2 rounded-[4px] bg-layers-surface-raised-1 border-t border-layers-elevation-highlight shadow-[0px_4px_8px_0px_rgba(0,0,0,0.07)]">
        <button
          onClick={onCopyAddress}
          className="text-sm font-normal text-text-primary whitespace-nowrap hover:text-text-secondary transition-colors cursor-pointer"
          style={monoStyle}
        >
          Copy address
        </button>
        <button
          onClick={onDisconnect}
          className="text-sm font-normal text-text-primary whitespace-nowrap hover:text-text-secondary transition-colors cursor-pointer"
          style={monoStyle}
        >
          Disconnect
        </button>
        <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-shadow)]" />
      </div>
    </div>
  );
}

export default function WalletButton() {
  const { publicKey, connected, connecting, disconnect } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
  const fetchedKeyRef = useRef<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const setWalletStatus = useWalletStore((s) => s.setWalletStatus);
  const setPublicKey = useWalletStore((s) => s.setPublicKey);
  const setDisplayAddress = useWalletStore((s) => s.setDisplayAddress);
  const setBalanceLamports = useWalletStore((s) => s.setBalanceLamports);
  const resetWallet = useWalletStore((s) => s.resetWallet);

  const fetchBalance = async (retries = 3) => {
    if (!publicKey || !connection) return;
    for (let i = 0; i < retries; i++) {
      try {
        const balance = await connection.getBalance(publicKey, "confirmed");
        setBalanceLamports(balance);
        return;
      } catch {
        if (i < retries - 1) {
          await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
        }
      }
    }
    setBalanceLamports(null);
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

  // Refresh balance every 30s while connected
  useEffect(() => {
    if (!connected || !publicKey) return;
    const interval = setInterval(() => fetchBalance(1), 30_000);
    return () => clearInterval(interval);
  }, [connected, publicKey?.toBase58()]);

  // Subscribe to account changes for real-time balance updates
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

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClick = () => {
    if (connected) {
      setIsOpen((prev) => !prev);
    } else {
      setVisible(true);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={handleClick}
        disabled={connecting}
        className="relative flex items-center gap-2 h-9 bg-layers-surface-default border-t border-layers-elevation-highlight rounded px-3 cursor-pointer disabled:cursor-wait shrink-0"
      >
        {!connected && !connecting && (
          <span
            className="text-sm font-normal text-brand-primary-purple"
            style={monoStyle}
          >
            Connect Wallet
          </span>
        )}
        {connecting && (
          <span
            className="text-sm font-normal text-text-secondary"
            style={monoStyle}
          >
            Connecting...
          </span>
        )}
        {connected && publicKey && (
          <span
            className="text-sm font-normal text-text-primary"
            style={monoStyle}
          >
            {shortenAddress(publicKey.toBase58())}
          </span>
        )}
        <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-shadow)]" />
      </button>
      {connected && isOpen && (
        <WalletDropdown
          onCopyAddress={() => {
            navigator.clipboard.writeText(publicKey!.toBase58());
            setIsOpen(false);
          }}
          onDisconnect={() => {
            disconnect();
            setIsOpen(false);
          }}
        />
      )}
    </div>
  );
}
