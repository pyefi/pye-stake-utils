"use client";

import { cn } from "@/lib/utils";
import { shortenAddress } from "@/lib/format";
import { StateBadge } from "@/components/ui/badge";
import type { StakeAccount } from "pye-stake-utils";

const LAMPORTS_PER_SOL = 1_000_000_000;

interface Props {
  account: StakeAccount;
  selected: boolean;
  onSelect: (pubkey: string) => void;
}

export default function StakeAccountRow({ account, selected, onSelect }: Props) {
  const sol = (account.lamports / LAMPORTS_PER_SOL).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });

  const monoStyle = {
    fontFeatureSettings:
      "'cv01' 1,'cv02' 1,'cv03' 1,'cv04' 1,'zero' 1,'lnum' 1,'tnum' 1",
  } as const;

  return (
    <button
      type="button"
      onClick={() => onSelect(account.pubkey)}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-layers-elevation-shadow",
        selected
          ? "bg-layers-surface-raised-1"
          : "bg-layers-surface-default hover:bg-layers-surface-raised-1",
      )}
    >
      {/* Radio */}
      <div
        className={cn(
          "size-4 rounded-full border shrink-0 flex items-center justify-center",
          selected
            ? "bg-brand-primary-purple border-brand-purple-8 shadow-[inset_0px_-1px_0px_0px_var(--brand-purple-11)]"
            : "bg-layers-surface-lowered-1 border-layers-elevation-shadow shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-highlight)]",
        )}
      >
        {selected && <div className="size-1.5 rounded-full bg-white" />}
      </div>

      {/* Validator icon */}
      {account.validatorIcon ? (
        <img
          src={account.validatorIcon}
          alt={account.validatorName}
          className="size-8 rounded-full shrink-0 border border-layers-elevation-shadow"
        />
      ) : (
        <div className="size-8 rounded-full shrink-0 bg-layers-surface-lowered-2 border border-layers-elevation-shadow flex items-center justify-center">
          <span className="text-xs text-text-secondary">
            {account.validatorName.slice(0, 2)}
          </span>
        </div>
      )}

      {/* Name + pubkey */}
      <div className="flex-1 min-w-0">
        <div className="text-sm text-text-primary truncate">
          {account.validatorName}
        </div>
        <div
          className="text-xs text-text-secondary font-mono truncate"
          style={monoStyle}
        >
          {shortenAddress(account.pubkey)}
        </div>
      </div>

      {/* SOL + state */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="text-sm text-text-primary" style={monoStyle}>
          {sol} SOL
        </span>
        <StateBadge state={account.state} />
      </div>
    </button>
  );
}
