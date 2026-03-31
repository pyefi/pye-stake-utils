"use client";

import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import {
  buildDeactivateStakeTransaction,
  buildDelegateStakeTransaction,
} from "pye-stake-utils";
import { useWalletStore } from "@/store/wallet-provider";
import { useStakeStore } from "@/store/stake-provider";
import { useUIStore } from "@/store/ui-provider";
import { Button } from "@/components/ui/button";
import { StateBadge } from "@/components/ui/badge";

const EPOCH_ALERT =
  "State transitions happen at the next epoch boundary. The account cannot be split or transferred while a state change is pending.";

const LAMPORTS_PER_SOL = 1_000_000_000;

export default function StateChangeTab() {
  const { sendTransaction } = useWallet();
  const { setVisible } = useWalletModal();
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

  const [voteAccount, setVoteAccount] = useState("");

  const selectedAccount =
    stakeAccounts.find((a) => a.pubkey === selectedPubkey) ?? null;

  const handleDeactivate = async () => {
    if (!selectedAccount || !publicKey) return;
    setTxStatus("pending");
    try {
      const { transaction: tx } = await buildDeactivateStakeTransaction({
        connection,
        stakeAccountPubkey: new PublicKey(selectedAccount.pubkey),
        authorizedPubkey: new PublicKey(publicKey),
      });
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, "confirmed");
      setTxSuccess(sig);
      refresh(connection, new PublicKey(publicKey));
    } catch (err) {
      setTxError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleActivate = async () => {
    if (!selectedAccount || !publicKey || !voteAccount) return;
    setTxStatus("pending");
    try {
      const { transaction: tx } = await buildDelegateStakeTransaction({
        connection,
        stakeAccountPubkey: new PublicKey(selectedAccount.pubkey),
        authorizedPubkey: new PublicKey(publicKey),
        votePubkey: new PublicKey(voteAccount),
      });
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, "confirmed");
      setTxSuccess(sig);
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
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-secondary">
          Connect your wallet to manage stake account state.
        </p>
        <Button onClick={() => setVisible(true)} className="w-full" size="lg">
          Connect wallet
        </Button>
      </div>
    );
  }

  if (!selectedAccount) {
    return (
      <p className="text-sm text-text-secondary">
        Select a stake account from the list to get started.
      </p>
    );
  }

  const sol = (selectedAccount.lamports / LAMPORTS_PER_SOL).toLocaleString(
    undefined,
    { minimumFractionDigits: 2, maximumFractionDigits: 4 },
  );

  const isDeactivating = selectedAccount.state === "deactivating";

  return (
    <div className="flex-1 flex flex-col justify-between gap-4">
      {/* Top section */}
      <div className="flex flex-col gap-4">
        {/* Selected account summary */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-text-secondary eyebrow-xs">Selected Account</span>
          <div className="flex items-center gap-3 p-3 rounded-[6px] bg-layers-surface-raised-1 border-t border-layers-elevation-highlight shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-shadow)]">
            {selectedAccount.validatorIcon ? (
              <img
                src={selectedAccount.validatorIcon}
                alt={selectedAccount.validatorName}
                className="size-8 rounded-full border border-layers-elevation-shadow shrink-0"
              />
            ) : (
              <div className="size-8 rounded-full bg-layers-surface-lowered-2 border border-layers-elevation-shadow flex items-center justify-center shrink-0">
                <span className="text-xs text-text-secondary">
                  {selectedAccount.validatorName.slice(0, 2)}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <span className="text-sm text-text-primary truncate">
                {selectedAccount.validatorName}
              </span>
              <StateBadge state={selectedAccount.state} />
            </div>
            <span className="text-sm text-text-primary shrink-0" style={monoStyle}>
              {sol} SOL
            </span>
          </div>
        </div>

        {/* Context description */}
        <div className="flex flex-col gap-3">
          <span className="text-xs text-text-secondary eyebrow-xs">Action</span>
          {isDeactivating ? (
            <p className="text-sm text-text-secondary">
              This account is{" "}
              <span className="font-semibold text-text-primary">deactivating</span>.
              A state change is already pending — wait until it becomes inactive
              before taking further action.
            </p>
          ) : selectedAccount.state === "activating" ? (
            <p className="text-sm text-text-secondary">
              This account is{" "}
              <span className="font-semibold text-text-primary">activating</span>.
              Rewards will begin once activation is complete (next epoch boundary).
            </p>
          ) : selectedAccount.state === "active" ? (
            <p className="text-sm text-text-secondary">
              This account is{" "}
              <span className="font-semibold text-text-primary">active</span> and
              currently earning rewards. Deactivating begins a cooldown before funds
              become withdrawable.
            </p>
          ) : (
            <>
              <p className="text-sm text-text-secondary">
                This account is{" "}
                <span className="font-semibold text-text-primary">inactive</span>.
                Activating it will stake the SOL with the validator. Rewards begin
                after activation completes.
              </p>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-text-secondary eyebrow-xs">
                  Validator Vote Account
                </label>
                <input
                  type="text"
                  value={voteAccount}
                  onChange={(e) => setVoteAccount(e.target.value)}
                  placeholder="Enter validator vote account address"
                  className="h-11 px-3 rounded-[6px] bg-layers-surface-lowered-1 border-t border-layers-elevation-shadow text-sm text-text-primary placeholder:text-text-secondary shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-highlight)] outline-none focus:ring-1 focus:ring-brand-primary-purple"
                  style={monoStyle}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom section */}
      <div className="flex flex-col gap-3">
        {/* Epoch alert */}
        {!isDeactivating && (
          <div className="p-3 rounded-[6px] bg-layers-surface-lowered-1 border-t border-layers-elevation-shadow shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-highlight)] text-xs text-text-secondary">
            {EPOCH_ALERT}
          </div>
        )}

        {/* Tx feedback */}
        {txStatus === "success" && txSignature && (
          <div className="p-3 rounded-[6px] bg-[rgba(13,156,94,0.1)] border border-[rgba(13,156,94,0.3)] text-xs text-brand-action-green flex flex-col gap-1">
            <span className="font-semibold">Transaction confirmed</span>
            <a
              href={`https://solscan.io/tx/${txSignature}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline break-all"
            >
              {txSignature.slice(0, 20)}...
            </a>
            <button onClick={resetTx} className="mt-1 text-left underline text-xs">
              Dismiss
            </button>
          </div>
        )}
        {txStatus === "error" && txError && (
          <div className="p-3 rounded-[6px] bg-[rgba(229,72,77,0.1)] border border-[rgba(229,72,77,0.3)] text-xs text-brand-action-red">
            <span className="font-semibold">Error: </span>
            {txError}
            <button onClick={resetTx} className="ml-2 underline text-xs">
              Dismiss
            </button>
          </div>
        )}

        {/* CTA */}
        {!isDeactivating && (
          <>
            {selectedAccount.state === "active" ? (
              <Button
                variant="destructive"
                size="lg"
                className="w-full"
                onClick={handleDeactivate}
                disabled={txStatus === "pending"}
              >
                {txStatus === "pending" ? "Deactivating..." : "Deactivate Stake"}
              </Button>
            ) : selectedAccount.state === "inactive" ? (
              <Button
                size="lg"
                className="w-full"
                onClick={handleActivate}
                disabled={txStatus === "pending" || !voteAccount.trim()}
              >
                {txStatus === "pending" ? "Activating..." : "Activate Stake"}
              </Button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
