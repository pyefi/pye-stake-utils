"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useStakeStore } from "@/store/stake-provider";
import { useUIStore } from "@/store/ui-provider";
import { useWalletStore } from "@/store/wallet-provider";
import StakeAccountRow from "./StakeAccountRow";

const PAGE_SIZE = 8;

export default function StakeAccountList() {
  const stakeAccounts = useStakeStore((s) => s.stakeAccounts);
  const loading = useStakeStore((s) => s.loading);
  const selectedPubkey = useUIStore((s) => s.selectedAccountPubkey);
  const selectAccount = useUIStore((s) => s.selectAccount);
  const walletStatus = useWalletStore((s) => s.status);

  const [page, setPage] = useState(0);

  const start = page * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pageAccounts = stakeAccounts.slice(start, end);
  const totalPages = Math.ceil(stakeAccounts.length / PAGE_SIZE);

  return (
    <div className="flex flex-col h-full bg-layers-surface-default rounded-[6px] overflow-hidden shadow-[0px_4px_8px_0px_rgba(0,0,0,0.07)] border-t border-layers-elevation-highlight">
      {/* Panel header */}
      <div className="flex items-center px-4 h-[60px] shrink-0 border-b border-layers-elevation-shadow">
        <span className="text-xs text-text-secondary eyebrow-xs">Stake Account Selection</span>
      </div>

      {/* Column headers */}
      <div className="flex items-center justify-between px-4 h-[32px] shrink-0 bg-layers-surface-lowered-1 border-b border-layers-elevation-shadow">
        <span className="text-xs text-text-secondary eyebrow-xs">Validator</span>
        <span className="text-xs text-text-secondary eyebrow-xs">Size (SOL)</span>
      </div>

      {/* Account rows */}
      <div className="flex-1 overflow-y-auto">
        {walletStatus === "disconnected" && (
          <div className="flex items-center justify-center h-32 text-sm text-text-secondary">
            Connect your wallet to view stake accounts
          </div>
        )}
        {walletStatus !== "disconnected" && loading && (
          <div className="flex items-center justify-center h-32 text-sm text-text-secondary">
            Loading...
          </div>
        )}
        {walletStatus !== "disconnected" &&
          !loading &&
          stakeAccounts.length === 0 && (
            <div className="flex items-center justify-center h-32 text-sm text-text-secondary">
              No stake accounts found
            </div>
          )}
        {pageAccounts.map((account) => (
          <StakeAccountRow
            key={account.pubkey}
            account={account}
            selected={selectedPubkey === account.pubkey}
            onSelect={selectAccount}
          />
        ))}
      </div>

      {/* Pagination */}
      {stakeAccounts.length > 0 && (
        <div className="flex items-center h-[48px] shrink-0 border-t border-layers-elevation-shadow">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex items-center justify-center w-[48px] h-full text-text-secondary disabled:opacity-40 hover:text-text-primary"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="flex-1 text-center text-xs text-text-secondary eyebrow-xs">
            Viewing {start + 1}–{Math.min(end, stakeAccounts.length)} of {stakeAccounts.length}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="flex items-center justify-center w-[48px] h-full text-text-secondary disabled:opacity-40 hover:text-text-primary"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
