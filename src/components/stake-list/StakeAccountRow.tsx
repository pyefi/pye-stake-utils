"use client";

import { cn } from "@/lib/utils";
import { StateBadge } from "@/components/ui/badge";
import type { StakeAccount } from "@/lib/types";

const LAMPORTS_PER_SOL = 1_000_000_000;

const monoStyle = {
  fontFeatureSettings:
    "'case' 1,'cv01' 1,'cv02' 1,'cv03' 1,'cv04' 1,'zero' 1,'lnum' 1,'tnum' 1",
} as const;

interface Props {
  account: StakeAccount;
  selected: boolean;
  onSelect: (pubkey: string) => void;
}

export default function StakeAccountRow({ account, selected, onSelect }: Props) {
  const sol = (account.lamports / LAMPORTS_PER_SOL).toLocaleString(undefined, {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });

  return (
    <button
      type="button"
      onClick={() => onSelect(account.pubkey)}
      className={cn(
        "w-full flex items-center gap-2 px-4 py-3 text-left border-t border-layers-elevation-highlight shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-shadow)]",
        selected
          ? "bg-layers-surface-raised-1"
          : "bg-layers-surface-default hover:bg-layers-surface-raised-1",
      )}
    >
      {/* Radio */}
      <div className="relative size-[18px] shrink-0">
        <div
          className={cn(
            "absolute inset-0 rounded-full",
            selected
              ? "border-t border-layers-elevation-highlight bg-layers-surface-raised-1 shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-shadow)]"
              : "border-t border-layers-elevation-shadow bg-layers-surface-lowered-2 shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-highlight)]",
          )}
        />
        {selected && (
          <div className="absolute inset-[16.67%] rounded-full bg-[#8c33ff] border-t border-brand-primary-purple shadow-[inset_0px_-1px_0px_0px_var(--brand-purple-11)]" />
        )}
      </div>

      {/* Validator icon */}
      {account.validatorIcon ? (
        <img
          src={account.validatorIcon}
          alt={account.validatorName}
          className="size-8 rounded-full shrink-0 shadow-[inset_0px_-0.8px_0px_0px_var(--layers-elevation-shadow)]"
        />
      ) : (
        <div className="size-8 rounded-full shrink-0 bg-layers-surface-lowered-2 border border-layers-elevation-shadow flex items-center justify-center">
          <span className="text-xs text-text-secondary">
            {account.validatorName.slice(0, 2)}
          </span>
        </div>
      )}

      {/* Name + badge */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className="text-sm text-text-primary leading-5 truncate">
          {account.validatorName}
        </span>
        <span className="text-xs text-text-secondary shrink-0" style={monoStyle}>
          {account.pubkey.slice(0, 4)}
        </span>
        <StateBadge state={account.state} />
      </div>

      {/* SOL amount */}
      <span className="text-xs text-text-secondary shrink-0 uppercase" style={monoStyle}>
        {sol}
      </span>
    </button>
  );
}
