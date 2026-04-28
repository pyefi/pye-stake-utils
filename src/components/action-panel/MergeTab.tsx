"use client";

import { useEffect, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useWalletStore } from "@/store/wallet-provider";
import { useStakeStore } from "@/store/stake-provider";
import { useUIStore } from "@/store/ui-provider";
import { Button } from "@/components/ui/button";
import { formatSol, shortenAddress } from "@/lib/format";
import { buildMergeStakeTransaction, validateMerge } from "@/lib/stake-ops";
import type { StakeAccount } from "@/lib/types/stake";

const monoStyle = {
  fontFeatureSettings:
    "'cv01' 1,'cv02' 1,'cv03' 1,'cv04' 1,'zero' 1,'lnum' 1,'tnum' 1",
} as const;

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

function AccountSummaryRow({
  account,
  leading,
  surface = "lowered",
  isLast = false,
  showIcon = true,
  disabledReason,
}: {
  account: StakeAccount;
  leading?: React.ReactNode;
  surface?: "lowered" | "raised";
  isLast?: boolean;
  showIcon?: boolean;
  disabledReason?: string;
}) {
  const isRaised = surface === "raised";
  const lastClasses = isLast ? "rounded-b-[6px]" : "";
  const surfaceClasses = isRaised
    ? "p-3 rounded-[6px] bg-layers-surface-raised-1 border-t border-layers-elevation-highlight shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-shadow)]"
    : `px-3 py-2.5 bg-layers-surface-lowered-1 shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-highlight)] ${lastClasses}`;
  const iconSize = isRaised ? "size-8" : "size-7";
  const nameSize = isRaised ? "text-sm" : "text-xs";
  const dim = disabledReason ? "opacity-55" : "";

  return (
    <div className={`flex items-center gap-3 ${surfaceClasses} ${dim}`}>
      {leading}
      {showIcon &&
        (account.validatorIcon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={account.validatorIcon}
            alt={account.validatorName}
            className={`${iconSize} rounded-full border border-layers-elevation-shadow shrink-0`}
          />
        ) : (
          <div
            className={`${iconSize} rounded-full bg-layers-surface-lowered-2 border border-layers-elevation-shadow flex items-center justify-center shrink-0`}
          >
            <span
              className={`${isRaised ? "text-xs" : "text-[10px]"} text-text-secondary`}
            >
              {(account.validatorName || "??").slice(0, 2)}
            </span>
          </div>
        ))}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`${nameSize} text-text-primary truncate`}>
            {account.validatorName || "Unknown validator"}
          </span>
          <span
            className="text-[10px] font-mono text-text-secondary shrink-0"
            style={monoStyle}
          >
            {shortenAddress(account.pubkey)}
          </span>
        </div>
        {disabledReason ? (
          <p className="text-[10px] text-text-secondary mt-0.5">
            {disabledReason}
          </p>
        ) : (
          <p
            className="text-[10px] text-text-secondary mt-0.5"
            style={monoStyle}
          >
            {formatSol(account.lamports)} SOL · {account.state}
          </p>
        )}
      </div>
    </div>
  );
}

function SourceRadio({ checked }: { checked: boolean }) {
  return (
    <div
      className={`size-4 rounded-full flex-shrink-0 flex items-center justify-center ${
        checked
          ? "bg-brand-primary-purple border border-brand-primary-purple"
          : "bg-layers-surface-default border-t border-t-layers-elevation-highlight shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-shadow)]"
      }`}
    >
      {checked && <div className="size-1.5 rounded-full bg-white" />}
    </div>
  );
}

export default function MergeTab() {
  const { sendTransaction } = useWallet();
  const { connection } = useConnection();

  const walletStatus = useWalletStore((s) => s.status);
  const publicKey = useWalletStore((s) => s.publicKey);

  const stakeAccounts = useStakeStore((s) => s.stakeAccounts);
  const refresh = useStakeStore((s) => s.refresh);

  const selectedPubkey = useUIStore((s) => s.selectedAccountPubkey);
  const mergeSourcePubkey = useUIStore((s) => s.mergeSourcePubkey);
  const setMergeSourcePubkey = useUIStore((s) => s.setMergeSourcePubkey);
  const txStatus = useUIStore((s) => s.txStatus);
  const txSignature = useUIStore((s) => s.txSignature);
  const txError = useUIStore((s) => s.txError);
  const setTxStatus = useUIStore((s) => s.setTxStatus);
  const setTxSuccess = useUIStore((s) => s.setTxSuccess);
  const setTxError = useUIStore((s) => s.setTxError);
  const resetTx = useUIStore((s) => s.resetTx);

  const [currentEpoch, setCurrentEpoch] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    connection
      .getEpochInfo()
      .then((info) => {
        if (!cancelled) setCurrentEpoch(info.epoch);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [connection]);

  const destination =
    stakeAccounts.find((a) => a.pubkey === selectedPubkey) ?? null;

  const nowUnix = Math.floor(Date.now() / 1000);
  const candidates =
    destination && publicKey && currentEpoch !== null
      ? stakeAccounts
          .filter((a) => a.pubkey !== destination.pubkey)
          .map((a) => ({
            account: a,
            result: validateMerge(
              destination,
              a,
              publicKey,
              currentEpoch,
              nowUnix,
            ),
          }))
      : [];

  const sourceEntry =
    candidates.find(
      (c) => c.account.pubkey === mergeSourcePubkey && c.result.ok,
    ) ?? null;
  const source = sourceEntry?.account ?? null;

  if (walletStatus !== "connected") {
    return (
      <p className="text-sm text-text-secondary">
        Connect your wallet to merge stake accounts.
      </p>
    );
  }

  if (!destination) {
    return (
      <p className="text-sm text-text-secondary">
        Select a stake account from the list.
      </p>
    );
  }

  const resultLamports = source ? destination.lamports + source.lamports : null;

  const handleMerge = async () => {
    if (!destination || !source || !publicKey) return;
    setTxStatus("pending");
    try {
      const { transaction: tx } = await buildMergeStakeTransaction({
        connection,
        destinationStakePubkey: new PublicKey(destination.pubkey),
        sourceStakePubkey: new PublicKey(source.pubkey),
        authorizedPubkey: new PublicKey(publicKey),
      });
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, "confirmed");
      setTxSuccess(sig);
      setMergeSourcePubkey(null);
      refresh(connection, new PublicKey(publicKey));
    } catch (err) {
      setTxError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-4 min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin-themed flex flex-col gap-3 pr-2 -mr-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-text-secondary eyebrow-xs">
            Keep open
          </label>
          <AccountSummaryRow account={destination} surface="raised" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-text-secondary eyebrow-xs">
            Close & merge in
          </label>
          {candidates.length === 0 ? (
            <div className="p-[10px] rounded-[6px] bg-layers-surface-lowered-1 text-xs text-text-secondary border-t border-layers-elevation-shadow shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-highlight)]">
              You have no other stake accounts to merge.
            </div>
          ) : (
            <div className="rounded-[6px] border-t border-layers-elevation-shadow shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-highlight)] overflow-hidden flex flex-col">
              {candidates.map(({ account, result }, i) => {
                const isLast = i === candidates.length - 1;
                if (!result.ok) {
                  return (
                    <div
                      key={account.pubkey}
                      className={
                        isLast ? "border-t border-layers-elevation-shadow" : ""
                      }
                    >
                      <AccountSummaryRow
                        account={account}
                        leading={
                          <div className="size-4 flex-shrink-0 flex items-center justify-center">
                            <LockIcon />
                          </div>
                        }
                        isLast={isLast}
                        showIcon={false}
                        disabledReason={result.reason}
                      />
                    </div>
                  );
                }
                const checked = mergeSourcePubkey === account.pubkey;
                return (
                  <button
                    key={account.pubkey}
                    type="button"
                    onClick={() => setMergeSourcePubkey(account.pubkey)}
                    className={`text-left ${
                      isLast ? "border-t border-layers-elevation-shadow" : ""
                    }`}
                  >
                    <AccountSummaryRow
                      account={account}
                      leading={<SourceRadio checked={checked} />}
                      isLast={isLast}
                      showIcon={false}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {source && resultLamports !== null && (
        <div className="shrink-0 flex flex-col gap-1.5">
          <label className="text-xs text-text-secondary eyebrow-xs">
            Result
          </label>
          <div className="p-3 rounded-[6px] bg-layers-surface-raised-1 border-t border-layers-elevation-highlight shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-shadow)] flex items-center gap-3">
            {destination.validatorIcon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={destination.validatorIcon}
                alt={destination.validatorName}
                className="size-8 rounded-full border border-layers-elevation-shadow shrink-0"
              />
            ) : (
              <div className="size-8 rounded-full bg-layers-surface-lowered-2 border border-layers-elevation-shadow flex items-center justify-center shrink-0">
                <span className="text-xs text-text-secondary">
                  {(destination.validatorName || "??").slice(0, 2)}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-text-primary truncate">
                  {destination.validatorName || "Unknown validator"}
                </span>
                <span
                  className="text-[10px] font-mono text-text-secondary shrink-0"
                  style={monoStyle}
                >
                  {shortenAddress(destination.pubkey)}
                </span>
              </div>
              <p
                className="text-[10px] text-brand-action-green mt-0.5"
                style={monoStyle}
              >
                {formatSol(destination.lamports)} +{" "}
                {formatSol(source.lamports)} = {formatSol(resultLamports)} SOL ·{" "}
                {destination.state.charAt(0).toUpperCase() +
                  destination.state.slice(1)}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="shrink-0 flex flex-col gap-3">
        <div className="p-3 rounded-[6px] bg-[rgba(229,72,77,0.08)] border border-[rgba(229,72,77,0.25)] text-xs text-text-secondary">
          {source ? (
            <>
              This is irreversible.{" "}
              <span className="font-mono" style={monoStyle}>
                {shortenAddress(source.pubkey)}
              </span>{" "}
              will be permanently closed and its balance moved into{" "}
              <span className="font-mono" style={monoStyle}>
                {shortenAddress(destination.pubkey)}
              </span>
              .
            </>
          ) : (
            "Select an account to merge in. It will be permanently closed and its balance moved into the account you keep."
          )}
        </div>

        {txStatus === "success" && txSignature && (
          <div className="p-3 rounded-[6px] bg-[rgba(13,156,94,0.1)] border border-[rgba(13,156,94,0.3)] text-xs text-brand-action-green flex flex-col gap-1">
            <span className="font-semibold">Merge confirmed</span>
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
          onClick={handleMerge}
          disabled={!source || txStatus === "pending"}
        >
          {txStatus === "pending" ? "Merging..." : "Confirm Merge"}
        </Button>
      </div>
    </div>
  );
}
