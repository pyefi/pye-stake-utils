"use client";

import { useEffect } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useWalletStore } from "@/store/wallet-provider";
import { useStakeStore } from "@/store/stake-provider";
import { useUIStore } from "@/store/ui-provider";
import { fetchValidatorMap } from "@/lib/fetch-validator-map";

export default function StakeSyncer() {
  const { connection } = useConnection();
  const walletStatus = useWalletStore((s) => s.status);
  const publicKey = useWalletStore((s) => s.publicKey);
  const refresh = useStakeStore((s) => s.refresh);
  const reset = useStakeStore((s) => s.reset);
  const loadMinDelegation = useStakeStore((s) => s.loadMinDelegation);
  const stakeAccounts = useStakeStore((s) => s.stakeAccounts);
  const lastFetchedAt = useStakeStore((s) => s.lastFetchedAt);
  const selectedAccountPubkey = useUIStore((s) => s.selectedAccountPubkey);
  const selectAccount = useUIStore((s) => s.selectAccount);

  // Cluster constant, independent of the wallet — load it up front so the
  // action panels can validate against it before the first transaction.
  useEffect(() => {
    loadMinDelegation(connection);
  }, []);

  useEffect(() => {
    if (walletStatus === "connected" && publicKey) {
      const load = async () => {
        const validatorMap = await fetchValidatorMap();
        refresh(connection, new PublicKey(publicKey), validatorMap);
      };
      load();
    } else if (walletStatus === "disconnected") {
      reset();
    }
  }, [walletStatus, publicKey]);

  // After every fetch, deselect if the selected account is no longer accessible
  // (e.g. both authorities were transferred away to another wallet)
  useEffect(() => {
    if (
      lastFetchedAt !== null &&
      selectedAccountPubkey &&
      !stakeAccounts.some((a) => a.pubkey === selectedAccountPubkey)
    ) {
      selectAccount(null);
    }
  }, [lastFetchedAt]);

  return null;
}
