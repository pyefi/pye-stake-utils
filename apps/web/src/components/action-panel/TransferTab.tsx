"use client";

import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  buildTransferStakeAuthorityTransaction,
  buildTransferWithdrawAuthorityTransaction,
} from "pye-stake-utils";
import { useWalletStore } from "@/store/wallet-provider";
import { useStakeStore } from "@/store/stake-provider";
import { useUIStore } from "@/store/ui-provider";
import { Button } from "@/components/ui/button";

type AuthorityType = "stake" | "withdraw";

const AUTHORITY_LABELS: Record<AuthorityType, string> = {
  stake: "Staker Authority",
  withdraw: "Withdraw Authority",
};

const AUTHORITY_DESCRIPTIONS: Record<AuthorityType, string> = {
  stake: "The staker authority can delegate and deactivate this account.",
  withdraw:
    "The withdraw authority can withdraw lamports from this account when it is inactive.",
};

function isValidPublicKey(key: string): boolean {
  try {
    new PublicKey(key);
    return true;
  } catch {
    return false;
  }
}

export default function TransferTab() {
  const { sendTransaction } = useWallet();
  const { connection } = useConnection();

  const walletStatus = useWalletStore((s) => s.status);
  const publicKey = useWalletStore((s) => s.publicKey);

  const stakeAccounts = useStakeStore((s) => s.stakeAccounts);
  const refresh = useStakeStore((s) => s.refresh);

  const selectedPubkey = useUIStore((s) => s.selectedAccountPubkey);
  const txStatus = useUIStore((s) => s.txStatus);
  const txSignature = useUIStore((s) => s.txSignature);
  const txError = useUIStore((s) => s.txError);
  const setTxStatus = useUIStore((s) => s.setTxStatus);
  const setTxSuccess = useUIStore((s) => s.setTxSuccess);
  const setTxError = useUIStore((s) => s.setTxError);
  const resetTx = useUIStore((s) => s.resetTx);

  const [authorityType, setAuthorityType] = useState<AuthorityType>("stake");
  const [newAuthority, setNewAuthority] = useState("");

  const selectedAccount =
    stakeAccounts.find((a) => a.pubkey === selectedPubkey) ?? null;

  const addressValid = newAuthority.length > 0 && isValidPublicKey(newAuthority);

  const handleTransfer = async () => {
    if (!selectedAccount || !publicKey || !addressValid) return;
    setTxStatus("pending");
    try {
      const params = {
        connection,
        stakeAccountPubkey: new PublicKey(selectedAccount.pubkey),
        currentAuthorityPubkey: new PublicKey(publicKey),
        newAuthorityPubkey: new PublicKey(newAuthority),
      };
      const { transaction: tx } =
        authorityType === "stake"
          ? await buildTransferStakeAuthorityTransaction(params)
          : await buildTransferWithdrawAuthorityTransaction(params);
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, "confirmed");
      setTxSuccess(sig);
      setNewAuthority("");
      refresh(connection, new PublicKey(publicKey));
    } catch (err) {
      setTxError(err instanceof Error ? err.message : String(err));
    }
  };

  const monoStyle = {
    fontFeatureSettings:
      "'cv01' 1,'cv02' 1,'cv03' 1,'cv04' 1,'zero' 1,'lnum' 1,'tnum' 1",
  } as const;

  if (walletStatus !== "connected") {
    return (
      <p className="text-sm text-text-secondary">
        Connect your wallet to transfer authority.
      </p>
    );
  }

  if (!selectedAccount) {
    return (
      <p className="text-sm text-text-secondary">
        Select a stake account from the list.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Authority type selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-text-secondary eyebrow-xs">
          Authority Type
        </label>
        <div className="flex gap-2">
          {(["stake", "withdraw"] as AuthorityType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setAuthorityType(type)}
              className={`flex-1 h-9 rounded-[4px] text-sm transition-colors border-t ${
                authorityType === type
                  ? "bg-layers-surface-lowered-2 border-layers-elevation-shadow text-text-primary shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-highlight)]"
                  : "bg-layers-surface-raised-1 border-layers-elevation-highlight text-text-secondary shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-shadow)] hover:text-text-primary"
              }`}
            >
              {AUTHORITY_LABELS[type]}
            </button>
          ))}
        </div>
        <p className="text-xs text-text-secondary">
          {AUTHORITY_DESCRIPTIONS[authorityType]}
        </p>
      </div>

      {/* New authority address input */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-text-secondary eyebrow-xs">
          New Authority Address
        </label>
        <input
          type="text"
          value={newAuthority}
          onChange={(e) => setNewAuthority(e.target.value)}
          placeholder="Enter Solana address"
          className="h-11 px-3 rounded-[6px] bg-layers-surface-lowered-1 border-t border-layers-elevation-highlight text-sm text-text-primary placeholder:text-text-secondary shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-shadow)] outline-none focus:ring-1 focus:ring-brand-primary-purple"
          style={monoStyle}
        />
        {newAuthority && !addressValid && (
          <p className="text-xs text-brand-action-red">
            Invalid Solana address
          </p>
        )}
      </div>

      {/* Warning */}
      <div className="flex gap-2 p-3 rounded-[6px] bg-[rgba(229,72,77,0.08)] border border-[rgba(229,72,77,0.25)] text-xs text-text-secondary">
        <span className="shrink-0">⚠</span>
        <span>
          This action is irreversible. Make sure the new authority address is
          correct before confirming.
        </span>
      </div>

      {/* Tx feedback */}
      {txStatus === "success" && txSignature && (
        <div className="p-3 rounded-[6px] bg-[rgba(13,156,94,0.1)] border border-[rgba(13,156,94,0.3)] text-xs text-brand-action-green flex flex-col gap-1">
          <span className="font-semibold">Transfer confirmed</span>
          <a
            href={`https://solscan.io/tx/${txSignature}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline break-all"
          >
            {txSignature.slice(0, 20)}...
          </a>
          <button onClick={resetTx} className="mt-1 underline text-left">
            Dismiss
          </button>
        </div>
      )}
      {txStatus === "error" && txError && (
        <div className="p-3 rounded-[6px] bg-[rgba(229,72,77,0.1)] border border-[rgba(229,72,77,0.3)] text-xs text-brand-action-red">
          <span className="font-semibold">Error: </span>
          {txError}
          <button onClick={resetTx} className="ml-2 underline">
            Dismiss
          </button>
        </div>
      )}

      {/* CTA */}
      <Button
        className="w-full"
        onClick={handleTransfer}
        disabled={!addressValid || txStatus === "pending"}
      >
        {txStatus === "pending"
          ? "Transferring..."
          : `Transfer ${AUTHORITY_LABELS[authorityType]}`}
      </Button>
    </div>
  );
}
