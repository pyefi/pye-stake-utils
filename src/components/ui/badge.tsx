import { cn } from "@/lib/utils";
import type { StakeAccountState, StakeAuthority } from "@/lib/types";

const stateStyles: Record<StakeAccountState, string> = {
  active:
    "bg-[rgba(13,156,94,0.2)] text-brand-action-green border-t border-[rgba(255,255,255,0.2)] shadow-[inset_0px_-1px_0px_0px_rgba(0,0,0,0.1)]",
  activating:
    "bg-[rgba(255,181,77,0.2)] text-[#b47a1a] dark:text-brand-action-amber border-t border-[rgba(255,255,255,0.2)] shadow-[inset_0px_-1px_0px_0px_rgba(0,0,0,0.1)]",
  deactivating:
    "bg-[rgba(255,181,77,0.2)] text-[#b47a1a] dark:text-brand-action-amber border-t border-[rgba(255,255,255,0.2)] shadow-[inset_0px_-1px_0px_0px_rgba(0,0,0,0.1)]",
  inactive:
    "bg-layers-surface-raised-1 text-text-secondary border-t border-layers-elevation-highlight shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-shadow)]",
};

const stateLabels: Record<StakeAccountState, string> = {
  active: "Active",
  activating: "Activating",
  deactivating: "Deactivating",
  inactive: "Inactive",
};

const authorityStyles: Record<StakeAuthority, string> = {
  staker:
    "bg-[rgba(140,51,255,0.15)] text-brand-primary-purple border-t border-[rgba(255,255,255,0.2)] shadow-[inset_0px_-1px_0px_0px_rgba(0,0,0,0.1)]",
  withdrawer:
    "bg-[rgba(99,179,237,0.15)] text-[#2b7cb8] dark:text-[#63b3ed] border-t border-[rgba(255,255,255,0.2)] shadow-[inset_0px_-1px_0px_0px_rgba(0,0,0,0.1)]",
};

const authorityLabels: Record<StakeAuthority, string> = {
  staker: "Staker",
  withdrawer: "Withdraw",
};

export function AuthorityBadge({
  authority,
  className,
}: {
  authority: StakeAuthority;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center h-[22px] px-1 py-0.5 rounded-[4px] text-xs font-normal",
        authorityStyles[authority],
        className,
      )}
    >
      {authorityLabels[authority]}
    </span>
  );
}

export function StateBadge({
  state,
  className,
}: {
  state: StakeAccountState;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center h-[22px] px-1 py-0.5 rounded-[4px] text-xs font-normal",
        stateStyles[state],
        className,
      )}
    >
      {stateLabels[state]}
    </span>
  );
}
