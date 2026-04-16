"use client";

import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import {
  buildTransferStakeAuthorityTransaction,
  buildTransferWithdrawAuthorityTransaction,
} from "@/lib/stake-ops";
import { useWalletStore } from "@/store/wallet-provider";
import { useStakeStore } from "@/store/stake-provider";
import { useUIStore } from "@/store/ui-provider";
import { Button } from "@/components/ui/button";

type AuthorityType = "stake" | "withdraw";

// TODO: replace mock with real authority data from chain in follow-up branch
interface AuthorityOwnership {
  staker: { isYou: boolean; address: string };
  withdraw: { isYou: boolean; address: string };
}

function getMockAuthority(publicKey: string): AuthorityOwnership {
  return {
    staker: { isYou: true, address: publicKey },
    withdraw: { isYou: true, address: publicKey },
  };
}

function LockIcon() {
  return (
    <svg
      width="9"
      height="9"
      viewBox="0 0 16 16"
      fill="none"
      className="text-text-disabled"
    >
      <rect
        x="5"
        y="2"
        width="6"
        height="7"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M4 7h8v6a2 2 0 01-2 2H6a2 2 0 01-2-2V7z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
}

function AuthorityCheckbox({ checked }: { checked: boolean }) {
  return (
    <div
      className={`size-4 rounded-[3px] flex-shrink-0 flex items-center justify-center mt-[1px] ${
        checked
          ? "bg-brand-primary-purple border border-brand-primary-purple"
          : "bg-layers-surface-default border-t border-t-layers-elevation-highlight shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-shadow)]"
      }`}
    >
      {checked && (
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
          <path
            d="M2.5 6L5 8.5L9.5 3.5"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}

function truncateAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

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

  const { setVisible } = useWalletModal();
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

  const [stakeChecked, setStakeChecked] = useState(true);
  const [withdrawChecked, setWithdrawChecked] = useState(true);
  const [newAuthority, setNewAuthority] = useState("");

  const selectedAccount =
    stakeAccounts.find((a) => a.pubkey === selectedPubkey) ?? null;

  const authority = publicKey ? getMockAuthority(publicKey) : null;

  const bothChecked = stakeChecked && withdrawChecked;
  const noneChecked = !stakeChecked && !withdrawChecked;

  const selectedTypes: AuthorityType[] = [];
  if (stakeChecked && authority?.staker.isYou) selectedTypes.push("stake");
  if (withdrawChecked && authority?.withdraw.isYou) selectedTypes.push("withdraw");

  const ctaLabel =
    selectedTypes.length === 2
      ? "Transfer Both Authorities"
      : selectedTypes.length === 1
        ? `Transfer ${selectedTypes[0] === "stake" ? "Staker" : "Withdraw"} Authority`
        : "Transfer Authority";

  const addressValid = newAuthority.length > 0 && isValidPublicKey(newAuthority);

  const handleTransfer = async () => {
    if (!selectedAccount || !publicKey || !addressValid || selectedTypes.length === 0) return;
    setTxStatus("pending");
    try {
      const params = {
        connection,
        stakeAccountPubkey: new PublicKey(selectedAccount.pubkey),
        currentAuthorityPubkey: new PublicKey(publicKey),
        newAuthorityPubkey: new PublicKey(newAuthority),
      };
      // TODO: bundle into single TX in follow-up branch when both selected
      const { transaction: tx } =
        selectedTypes[0] === "stake"
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
      <div className="flex-1 flex flex-col">
        <div className="opacity-50 pointer-events-none flex-1 flex flex-col justify-between gap-4">
          {/* Mock: authority card */}
          <div className="flex flex-col gap-4">
            <div className="rounded-[6px] border-t border-layers-elevation-shadow shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-highlight)] overflow-hidden">
              <div className="flex items-start gap-2 p-[10px] bg-layers-surface-lowered-1 shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-highlight)]">
                <AuthorityCheckbox checked={true} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-primary">Staker Authority</span>
                    <span className="text-[10px] font-mono text-brand-action-green">You</span>
                  </div>
                  <p className="text-[10px] text-text-secondary mt-0.5">Can delegate and deactivate</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-[10px] bg-layers-surface-lowered-1 border-t border-layers-elevation-shadow rounded-b-[6px] shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-highlight)]">
                <AuthorityCheckbox checked={true} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-primary">Withdraw Authority</span>
                    <span className="text-[10px] font-mono text-brand-action-green">You</span>
                  </div>
                  <p className="text-[10px] text-text-secondary mt-0.5">Can withdraw when inactive</p>
                </div>
              </div>
            </div>

            {/* Mock: address input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-text-secondary eyebrow-xs">New Authority Address</label>
              <div className="h-11 px-3 rounded-[6px] bg-layers-surface-lowered-1 border-t border-layers-elevation-shadow shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-highlight)] flex items-center">
                <span className="text-sm text-text-secondary">Enter Solana address</span>
              </div>
            </div>
          </div>

          {/* Mock: bottom section */}
          <div className="flex flex-col gap-3">
            <div className="p-3 rounded-[6px] bg-[rgba(229,72,77,0.08)] border border-[rgba(229,72,77,0.25)] text-xs text-text-secondary">
              This action is irreversible. Both authorities will be transferred.
            </div>
            <Button size="lg" className="w-full" disabled>
              Transfer Both Authorities
            </Button>
          </div>
        </div>
      </div>
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
    <div className="flex-1 flex flex-col justify-between gap-4">
      <div className="flex flex-col gap-3">
        {/* Merged authority card */}
        <div className="rounded-[6px] border-t border-layers-elevation-shadow shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-highlight)] overflow-hidden">
          {/* Staker row */}
          {authority?.staker.isYou ? (
            <button
              type="button"
              onClick={() => setStakeChecked((c) => !c)}
              className="w-full flex items-start gap-2 p-[10px] bg-layers-surface-lowered-1 shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-highlight)] text-left"
            >
              <AuthorityCheckbox checked={stakeChecked} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-primary">Staker Authority</span>
                  <span className="text-[10px] font-mono text-brand-action-green">You</span>
                </div>
                <p className="text-[10px] text-text-secondary mt-0.5">Can delegate and deactivate</p>
              </div>
            </button>
          ) : (
            <div className="flex items-start gap-2 p-[10px] bg-layers-surface-lowered-1 shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-highlight)] opacity-55">
              <div className="size-4 flex-shrink-0 flex items-center justify-center mt-[1px]">
                <LockIcon />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-primary">Staker Authority</span>
                  <span className="text-[10px] font-mono text-text-disabled">
                    {truncateAddress(authority?.staker.address ?? "")}
                  </span>
                </div>
                <p className="text-[10px] text-text-secondary mt-0.5">Can delegate and deactivate</p>
              </div>
            </div>
          )}

          {/* Withdraw row */}
          {authority?.withdraw.isYou ? (
            <button
              type="button"
              onClick={() => setWithdrawChecked((c) => !c)}
              className="w-full flex items-start gap-2 p-[10px] bg-layers-surface-lowered-1 border-t border-layers-elevation-shadow rounded-b-[6px] shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-highlight)] text-left"
            >
              <AuthorityCheckbox checked={withdrawChecked} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-primary">Withdraw Authority</span>
                  <span className="text-[10px] font-mono text-brand-action-green">You</span>
                </div>
                <p className="text-[10px] text-text-secondary mt-0.5">Can withdraw when inactive</p>
              </div>
            </button>
          ) : (
            <div className="flex items-start gap-2 p-[10px] bg-layers-surface-lowered-1 border-t border-layers-elevation-shadow rounded-b-[6px] shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-highlight)] opacity-55">
              <div className="size-4 flex-shrink-0 flex items-center justify-center mt-[1px]">
                <LockIcon />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-primary">Withdraw Authority</span>
                  <span className="text-[10px] font-mono text-text-disabled">
                    {truncateAddress(authority?.withdraw.address ?? "")}
                  </span>
                </div>
                <p className="text-[10px] text-text-secondary mt-0.5">Can withdraw when inactive</p>
              </div>
            </div>
          )}
        </div>

        {/* Bundle note */}
        {bothChecked && authority?.staker.isYou && authority?.withdraw.isYou && (
          <div className="px-[10px] py-1.5 rounded-[6px] bg-[rgba(154,77,255,0.1)] border border-[rgba(154,77,255,0.25)] text-[11px] text-[#b78eff]">
            Both selected — bundled into a single transaction.
          </div>
        )}

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
            className="h-11 px-3 rounded-[6px] bg-layers-surface-lowered-1 border-t border-layers-elevation-shadow text-sm text-text-primary placeholder:text-text-secondary shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-highlight)] outline-none focus:ring-1 focus:ring-brand-primary-purple"
            style={monoStyle}
          />
          {newAuthority && !addressValid && (
            <p className="text-xs text-brand-action-red">
              Invalid Solana address
            </p>
          )}
        </div>
      </div>

      {/* Bottom section */}
      <div className="flex flex-col gap-3">
        {/* Warning */}
        <div className="p-3 rounded-[6px] bg-[rgba(229,72,77,0.08)] border border-[rgba(229,72,77,0.25)] text-xs text-text-secondary">
          {selectedTypes.length === 2
            ? "This action is irreversible. Both authorities will be transferred."
            : "This action is irreversible. Make sure the new authority address is correct before confirming."}
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
          size="lg"
          className="w-full"
          onClick={handleTransfer}
          disabled={!addressValid || noneChecked || txStatus === "pending"}
        >
          {txStatus === "pending" ? "Transferring..." : ctaLabel}
        </Button>
      </div>
    </div>
  );
}
