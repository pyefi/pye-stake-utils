"use client";

import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import {
  buildTransferStakeAuthorityTransaction,
  buildTransferWithdrawAuthorityTransaction,
  buildTransferBothAuthoritiesTransaction,
} from "@/lib/stake-ops";
import { shortenAddress } from "@/lib/format";
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

const monoStyle = {
  fontFeatureSettings:
    "'cv01' 1,'cv02' 1,'cv03' 1,'cv04' 1,'zero' 1,'lnum' 1,'tnum' 1",
} as const;

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

function AuthorityRow({
  label,
  description,
  isYou,
  address,
  checked,
  onToggle,
  isLast,
}: {
  label: string;
  description: string;
  isYou: boolean;
  address: string;
  checked: boolean;
  onToggle: () => void;
  isLast: boolean;
}) {
  const positionClasses = isLast
    ? "border-t border-layers-elevation-shadow rounded-b-[6px]"
    : "";

  if (isYou) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-start gap-2 p-[10px] bg-layers-surface-lowered-1 shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-highlight)] text-left ${positionClasses}`}
      >
        <AuthorityCheckbox checked={checked} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-primary">{label}</span>
            <span className="text-[10px] font-mono text-brand-action-green">You</span>
          </div>
          <p className="text-[10px] text-text-secondary mt-0.5">{description}</p>
        </div>
      </button>
    );
  }

  return (
    <div className={`flex items-start gap-2 p-[10px] bg-layers-surface-lowered-1 shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-highlight)] opacity-55 ${positionClasses}`}>
      <div className="size-4 flex-shrink-0 flex items-center justify-center mt-[1px]">
        <LockIcon />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-primary">{label}</span>
          <span className="text-[10px] font-mono text-text-disabled">
            {shortenAddress(address)}
          </span>
        </div>
        <p className="text-[10px] text-text-secondary mt-0.5">{description}</p>
      </div>
    </div>
  );
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
      const { transaction: tx } =
        selectedTypes.length === 2
          ? await buildTransferBothAuthoritiesTransaction(params)
          : selectedTypes[0] === "stake"
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

  if (walletStatus !== "connected") {
    return (
      <div className="flex-1 flex flex-col">
        <div className="opacity-50 pointer-events-none flex-1 flex flex-col justify-between gap-4">
          <div className="flex flex-col gap-4">
            <div className="rounded-[6px] border-t border-layers-elevation-shadow shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-highlight)] overflow-hidden">
              <AuthorityRow
                label="Staker Authority"
                description="Can delegate and deactivate"
                isYou={true}
                address=""
                checked={true}
                onToggle={() => {}}
                isLast={false}
              />
              <AuthorityRow
                label="Withdraw Authority"
                description="Can withdraw when inactive"
                isYou={true}
                address=""
                checked={true}
                onToggle={() => {}}
                isLast={true}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-text-secondary eyebrow-xs">New Authority Address</label>
              <div className="h-11 px-3 rounded-[6px] bg-layers-surface-lowered-1 border-t border-layers-elevation-shadow shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-highlight)] flex items-center">
                <span className="text-sm text-text-secondary">Enter Solana address</span>
              </div>
            </div>
          </div>

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
        <div className="rounded-[6px] border-t border-layers-elevation-shadow shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-highlight)] overflow-hidden">
          <AuthorityRow
            label="Staker Authority"
            description="Can delegate and deactivate"
            isYou={authority?.staker.isYou ?? false}
            address={authority?.staker.address ?? ""}
            checked={stakeChecked}
            onToggle={() => setStakeChecked((c) => !c)}
            isLast={false}
          />
          <AuthorityRow
            label="Withdraw Authority"
            description="Can withdraw when inactive"
            isYou={authority?.withdraw.isYou ?? false}
            address={authority?.withdraw.address ?? ""}
            checked={withdrawChecked}
            onToggle={() => setWithdrawChecked((c) => !c)}
            isLast={true}
          />
        </div>

        {selectedTypes.length === 2 && (
          <div className="px-[10px] py-1.5 rounded-[6px] bg-[rgba(154,77,255,0.1)] border border-[rgba(154,77,255,0.25)] text-[11px] text-[#b78eff]">
            Both selected — bundled into a single transaction.
          </div>
        )}

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

      <div className="flex flex-col gap-3">
        <div className="p-3 rounded-[6px] bg-[rgba(229,72,77,0.08)] border border-[rgba(229,72,77,0.25)] text-xs text-text-secondary">
          {selectedTypes.length === 2
            ? "This action is irreversible. Both authorities will be transferred."
            : "This action is irreversible. Make sure the new authority address is correct before confirming."}
        </div>

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

        <Button
          size="lg"
          className="w-full"
          onClick={handleTransfer}
          disabled={!addressValid || selectedTypes.length === 0 || txStatus === "pending"}
        >
          {txStatus === "pending" ? "Transferring..." : ctaLabel}
        </Button>
      </div>
    </div>
  );
}
