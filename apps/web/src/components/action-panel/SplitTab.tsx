"use client";

import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import { buildSplitStakeTransaction } from "pye-stake-utils";
import { useWalletStore } from "@/store/wallet-provider";
import { useStakeStore } from "@/store/stake-provider";
import { useUIStore } from "@/store/ui-provider";
import { Button } from "@/components/ui/button";
import { validateSplitAmount } from "@/lib/split-validation";
import { solToLamports } from "@/lib/format";

const LAMPORTS_PER_SOL = 1_000_000_000;

export default function SplitTab() {
  const { sendTransaction } = useWallet();
  const { connection } = useConnection();

  const { setVisible } = useWalletModal();
  const publicKey = useWalletStore((s) => s.publicKey);
  const walletStatus = useWalletStore((s) => s.status);

  const stakeAccounts = useStakeStore((s) => s.stakeAccounts);
  const refresh = useStakeStore((s) => s.refresh);

  const selectedPubkey = useUIStore((s) => s.selectedAccountPubkey);
  const splitSol = useUIStore((s) => s.splitSol);
  const setSplitSol = useUIStore((s) => s.setSplitSol);
  const txStatus = useUIStore((s) => s.txStatus);
  const txSignature = useUIStore((s) => s.txSignature);
  const txError = useUIStore((s) => s.txError);
  const setTxStatus = useUIStore((s) => s.setTxStatus);
  const setTxSuccess = useUIStore((s) => s.setTxSuccess);
  const setTxError = useUIStore((s) => s.setTxError);
  const resetTx = useUIStore((s) => s.resetTx);

  const [inputStr, setInputStr] = useState("");

  const selectedAccount =
    stakeAccounts.find((a) => a.pubkey === selectedPubkey) ?? null;

  const monoStyle = {
    fontFeatureSettings:
      "'cv01' 1,'cv02' 1,'cv03' 1,'cv04' 1,'zero' 1,'lnum' 1,'tnum' 1",
  } as const;

  if (walletStatus !== "connected") {
    return (
      <div className="flex-1 flex flex-col">
        <div className="opacity-50 pointer-events-none flex-1 flex flex-col justify-between gap-4">
          {/* Mock: top section */}
          <div className="flex flex-col gap-4">
            {/* Mock: SOL input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-text-primary">
                How much SOL goes into the new account?
              </label>
              <div className="relative flex items-center h-11 px-3 rounded-[6px] bg-layers-surface-lowered-1 border-t border-layers-elevation-shadow shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-highlight)]">
                <span className="flex-1 text-sm text-text-primary" style={monoStyle}>25</span>
                <span className="text-sm text-text-secondary shrink-0" style={monoStyle}>SOL</span>
              </div>
            </div>

            {/* Mock: resulting accounts */}
            <div className="flex flex-col gap-2">
              <span className="text-xs text-text-secondary eyebrow-xs">Resulting Accounts</span>

              {/* Original account */}
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-[6px] bg-layers-surface-raised-1 border-t border-layers-elevation-highlight shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-shadow)]">
                <div className="size-7 rounded-full bg-layers-surface-lowered-2 border border-layers-elevation-shadow flex items-center justify-center shrink-0">
                  <span className="text-[10px] text-text-secondary">He</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-text-primary truncate">Helius</div>
                  <div className="text-xs text-text-secondary">Original account</div>
                </div>
                <span className="text-sm text-text-primary shrink-0" style={monoStyle}>117.5000 SOL</span>
              </div>

              {/* New account */}
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-[6px] bg-layers-surface-raised-1 border-t border-layers-elevation-highlight shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-shadow)]">
                <div className="size-7 rounded-full bg-layers-surface-lowered-2 border border-layers-elevation-shadow flex items-center justify-center shrink-0">
                  <span className="text-[10px] text-text-secondary">He</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-text-primary truncate">Helius</div>
                  <div className="text-xs text-brand-action-green">New account</div>
                </div>
                <span className="text-sm text-text-primary shrink-0" style={monoStyle}>25.0000 SOL</span>
              </div>
            </div>
          </div>

          {/* Mock: bottom section */}
          <div className="flex flex-col gap-3">
            <div className="p-3 rounded-[6px] bg-layers-surface-lowered-1 border-t border-layers-elevation-shadow shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-highlight)] text-xs text-text-secondary">
              Both accounts inherit the same validator and activation status. A new
              stake account address is generated for the split portion.
            </div>
            <Button size="lg" className="w-full" disabled>
              Confirm Split
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

  const totalSol = selectedAccount.lamports / LAMPORTS_PER_SOL;
  const originalSol = Math.max(0, totalSol - splitSol);
  const validationError = validateSplitAmount(splitSol, totalSol);

  const handleSplit = async () => {
    if (!publicKey || validationError) return;
    setTxStatus("pending");
    try {
      const { transaction, newStakeKeypair } =
        await buildSplitStakeTransaction({
          connection,
          stakeAccountPubkey: new PublicKey(selectedAccount.pubkey),
          authorizedPubkey: new PublicKey(publicKey),
          splitLamports: solToLamports(splitSol),
        });
      const sig = await sendTransaction(transaction, connection, {
        signers: [newStakeKeypair],
      });
      await connection.confirmTransaction(sig, "confirmed");
      setTxSuccess(sig);
      setSplitSol(0);
      setInputStr("");
      refresh(connection, new PublicKey(publicKey));
    } catch (err) {
      setTxError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between gap-4">
      <div className="flex flex-col gap-4">
      {/* SOL input */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-text-primary">
          How much SOL goes into the new account?
        </label>
        <div className="relative flex items-center h-11 px-3 rounded-[6px] bg-layers-surface-lowered-1 border-t border-layers-elevation-shadow shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-highlight)]">
          <input
            type="text"
            inputMode="decimal"
            value={inputStr}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === "" || /^\d*\.?\d*$/.test(raw)) {
                setInputStr(raw);
                const parsed = parseFloat(raw);
                setSplitSol(isNaN(parsed) ? 0 : parsed);
              }
            }}
            placeholder="0"
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-secondary outline-none"
            style={monoStyle}
          />
          <span
            className="text-sm text-text-secondary shrink-0"
            style={monoStyle}
          >
            SOL
          </span>
        </div>
        {validationError && splitSol > 0 && (
          <p className="text-xs text-brand-action-red">{validationError}</p>
        )}
      </div>

      {/* Resulting accounts preview */}
      <div className="flex flex-col gap-2">
        <span className="text-xs text-text-secondary eyebrow-xs">
          Resulting Accounts
        </span>


        {/* Original account */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-[6px] bg-layers-surface-raised-1 border-t border-layers-elevation-highlight shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-shadow)]">
          {selectedAccount.validatorIcon ? (
            <img
              src={selectedAccount.validatorIcon}
              alt={selectedAccount.validatorName}
              className="size-7 rounded-full border border-layers-elevation-shadow shrink-0"
            />
          ) : (
            <div className="size-7 rounded-full bg-layers-surface-lowered-2 border border-layers-elevation-shadow flex items-center justify-center shrink-0">
              <span className="text-[10px] text-text-secondary">
                {selectedAccount.validatorName.slice(0, 2)}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm text-text-primary truncate">
              {selectedAccount.validatorName}
            </div>
            <div className="text-xs text-text-secondary">Original account</div>
          </div>
          <span className="text-sm text-text-primary shrink-0" style={monoStyle}>
            {originalSol.toLocaleString(undefined, {
              minimumFractionDigits: 4,
              maximumFractionDigits: 4,
            })}{" "}
            SOL
          </span>
        </div>

        {/* New account */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-[6px] bg-layers-surface-raised-1 border-t border-layers-elevation-highlight shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-shadow)]">
          {selectedAccount.validatorIcon ? (
            <img
              src={selectedAccount.validatorIcon}
              alt={selectedAccount.validatorName}
              className="size-7 rounded-full border border-layers-elevation-shadow shrink-0"
            />
          ) : (
            <div className="size-7 rounded-full bg-layers-surface-lowered-2 border border-layers-elevation-shadow flex items-center justify-center shrink-0">
              <span className="text-[10px] text-text-secondary">
                {selectedAccount.validatorName.slice(0, 2)}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm text-text-primary truncate">
              {selectedAccount.validatorName}
            </div>
            <div className="text-xs text-brand-action-green">New account</div>
          </div>
          <span className="text-sm text-text-primary shrink-0" style={monoStyle}>
            {splitSol.toLocaleString(undefined, {
              minimumFractionDigits: 4,
              maximumFractionDigits: 4,
            })}{" "}
            SOL
          </span>
        </div>
      </div>

      </div>

      {/* Bottom section */}
      <div className="flex flex-col gap-3">
        {/* Info alert */}
        <div className="p-3 rounded-[6px] bg-layers-surface-lowered-1 border-t border-layers-elevation-shadow shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-highlight)] text-xs text-text-secondary">
          Both accounts inherit the same validator and activation status. A new
          stake account address is generated for the split portion.
        </div>

        {/* Tx feedback */}
        {txStatus === "success" && txSignature && (
          <div className="p-3 rounded-[6px] bg-[rgba(13,156,94,0.1)] border border-[rgba(13,156,94,0.3)] text-xs text-brand-action-green flex flex-col gap-1">
            <span className="font-semibold">Split confirmed</span>
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
          onClick={handleSplit}
          disabled={!!validationError || splitSol === 0 || txStatus === "pending"}
        >
          {txStatus === "pending" ? "Splitting..." : "Confirm Split"}
        </Button>
      </div>
    </div>
  );
}
