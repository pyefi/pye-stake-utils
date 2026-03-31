import { cn } from "@/lib/utils";
import type { StakeAccountState } from "pye-stake-utils";

const stateStyles: Record<StakeAccountState, string> = {
  active:
    "bg-[rgba(13,156,94,0.15)] text-brand-action-green border border-[rgba(13,156,94,0.3)]",
  activating:
    "bg-[rgba(255,181,77,0.15)] text-brand-action-amber border border-[rgba(255,181,77,0.3)]",
  deactivating:
    "bg-[rgba(255,181,77,0.15)] text-brand-action-amber border border-[rgba(255,181,77,0.3)]",
  inactive:
    "bg-layers-surface-raised-1 text-text-secondary border border-layers-elevation-shadow",
};

const stateLabels: Record<StakeAccountState, string> = {
  active: "Active",
  activating: "Activating",
  deactivating: "Deactivating",
  inactive: "Inactive",
};

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
        "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-normal",
        stateStyles[state],
        className,
      )}
    >
      {stateLabels[state]}
    </span>
  );
}
