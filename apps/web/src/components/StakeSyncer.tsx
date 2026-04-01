"use client";

import { useEffect } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useWalletStore } from "@/store/wallet-provider";
import { useStakeStore } from "@/store/stake-provider";

export default function StakeSyncer() {
  const { connection } = useConnection();
  const walletStatus = useWalletStore((s) => s.status);
  const publicKey = useWalletStore((s) => s.publicKey);
  const refresh = useStakeStore((s) => s.refresh);
  const reset = useStakeStore((s) => s.reset);

  useEffect(() => {
    if (walletStatus === "connected" && publicKey) {
      refresh(connection, new PublicKey(publicKey));
    } else if (walletStatus === "disconnected") {
      reset();
    }
  }, [walletStatus, publicKey]);

  return null;
}
