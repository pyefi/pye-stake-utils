"use client";

import { useWalletStore } from "@/store/wallet-provider";
import { useStakeStore } from "@/store/stake-provider";
import { useUIStore } from "@/store/ui-provider";
import { Button } from "@/components/ui/button";
import { formatSol, shortenAddress } from "@/lib/format";
import type { StakeAccount } from "@/lib/types/stake";

const monoStyle = {
  fontFeatureSettings:
    "'cv01' 1,'cv02' 1,'cv03' 1,'cv04' 1,'zero' 1,'lnum' 1,'tnum' 1",
} as const;

function AccountSummaryRow({
  account,
  trailing,
  surface = "lowered",
  isLast = false,
}: {
  account: StakeAccount;
  trailing?: React.ReactNode;
  surface?: "lowered" | "raised";
  isLast?: boolean;
}) {
  const isRaised = surface === "raised";
  const lastClasses = isLast ? "rounded-b-[6px]" : "";
  const surfaceClasses = isRaised
    ? "p-3 rounded-[6px] bg-layers-surface-raised-1 border-t border-layers-elevation-highlight shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-shadow)]"
    : `px-3 py-2.5 bg-layers-surface-lowered-1 shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-highlight)] ${lastClasses}`;
  const iconSize = isRaised ? "size-8" : "size-7";
  const nameSize = isRaised ? "text-sm" : "text-xs";

  return (
    <div className={`flex items-center gap-3 ${surfaceClasses}`}>
      {account.validatorIcon ? (
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
      )}
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
        <p
          className="text-[10px] text-text-secondary mt-0.5"
          style={monoStyle}
        >
          {formatSol(account.lamports)} SOL · {account.state}
        </p>
      </div>
      {trailing}
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
  const walletStatus = useWalletStore((s) => s.status);
  const stakeAccounts = useStakeStore((s) => s.stakeAccounts);

  const selectedPubkey = useUIStore((s) => s.selectedAccountPubkey);
  const mergeSourcePubkey = useUIStore((s) => s.mergeSourcePubkey);
  const setMergeSourcePubkey = useUIStore((s) => s.setMergeSourcePubkey);

  const destination =
    stakeAccounts.find((a) => a.pubkey === selectedPubkey) ?? null;

  const candidates = destination
    ? stakeAccounts.filter((a) => {
        if (a.pubkey === destination.pubkey) return false;
        const d = destination.state;
        const s = a.state;
        if (d === "inactive" && s === "inactive") return true;
        if (d === "deactivating" && s === "deactivating") return true;
        if (d === "active" && s === "active") {
          return a.validatorVoteAccount === destination.validatorVoteAccount;
        }
        if (
          (d === "activating" && s === "inactive") ||
          (d === "inactive" && s === "activating")
        )
          return true;
        return false;
      })
    : [];

  const source = candidates.find((a) => a.pubkey === mergeSourcePubkey) ?? null;

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

  const resultLamports = source
    ? destination.lamports + source.lamports
    : null;

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
              {destination.state === "active"
                ? "No other active accounts delegated to the same validator."
                : `No other ${destination.state} accounts available to merge.`}
            </div>
          ) : (
            <div className="rounded-[6px] border-t border-layers-elevation-shadow shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-highlight)] overflow-hidden flex flex-col">
              {candidates.map((account, i) => {
                const checked = mergeSourcePubkey === account.pubkey;
                const isLast = i === candidates.length - 1;
                return (
                  <button
                    key={account.pubkey}
                    type="button"
                    onClick={() => setMergeSourcePubkey(account.pubkey)}
                    className={`text-left ${
                      isLast
                        ? "border-t border-layers-elevation-shadow"
                        : ""
                    }`}
                  >
                    <AccountSummaryRow
                      account={account}
                      trailing={<SourceRadio checked={checked} />}
                      isLast={isLast}
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
                {formatSol(destination.lamports)} + {formatSol(source.lamports)} = {formatSol(resultLamports)} SOL · {destination.state.charAt(0).toUpperCase() + destination.state.slice(1)}
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
        <Button size="lg" className="w-full" disabled>
          Confirm Merge
        </Button>
      </div>
    </div>
  );
}
