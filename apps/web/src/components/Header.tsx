"use client";

import { motion } from "motion/react";
import { useTheme } from "./ThemeProvider";
import { useWalletStore } from "@/store/wallet-provider";
import { formatSol } from "@/lib/format";
import WalletButton from "./WalletButton";

function SunIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-text-secondary"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-text-primary"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function DarkModeSwitch() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="relative flex items-center p-1 w-[72px] h-9 shrink-0 rounded-full bg-layers-elevation-shadow border-t border-layers-elevation-shadow"
    >
      <div className="absolute left-1 size-7 flex items-center justify-center">
        <MoonIcon />
      </div>
      <div className="absolute right-1 size-7 flex items-center justify-center">
        <SunIcon />
      </div>
      <motion.div
        layout
        layoutId="theme-thumb"
        className={`absolute size-7 rounded-full ${
          isDark
            ? "bg-layers-surface-raised-1 border-t border-layers-elevation-highlight shadow-[0px_1px_2px_0px_rgba(0,0,0,0.1)]"
            : "bg-brand-primary-purple border-t border-brand-purple-7 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.2)]"
        }`}
        style={{ left: isDark ? 40 : 4 }}
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
      >
        <div
          className={`absolute inset-0 pointer-events-none rounded-[inherit] ${
            isDark
              ? "shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-shadow)]"
              : "shadow-[inset_0px_-1px_0px_0px_var(--brand-purple-11)]"
          }`}
        />
      </motion.div>
      <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-highlight)]" />
    </button>
  );
}

function SolBalance() {
  const status = useWalletStore((s) => s.status);
  const balanceLamports = useWalletStore((s) => s.balanceLamports);
  const monoStyle = {
    fontFeatureSettings:
      "'cv01' 1,'cv02' 1,'cv03' 1,'cv04' 1,'zero' 1,'lnum' 1,'tnum' 1",
  } as const;

  return (
    <div className="relative hidden md:flex items-center gap-2 h-9 bg-layers-surface-default border-t border-layers-elevation-highlight rounded px-2 shrink-0">
      <div className="relative size-5 rounded-full border-t border-layers-elevation-highlight overflow-hidden shrink-0">
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-[#9945FF] to-[#14F195]" />
      </div>
      <div className="flex items-center gap-1">
        <span className="text-sm text-text-primary" style={monoStyle}>
          SOL
        </span>
        {status === "connected" && (
          <span className="text-sm text-text-secondary" style={monoStyle}>
            {formatSol(balanceLamports)}
          </span>
        )}
      </div>
      <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-shadow)]" />
    </div>
  );
}

export default function Header() {
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-layers-base-primary w-full">
      <div className="flex items-center gap-2 shrink-0">
        <span
          className="text-xl text-text-primary"
          style={{ fontFamily: "var(--font-garamond), serif" }}
        >
          Stake Utils
        </span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <SolBalance />
        <WalletButton />
        <DarkModeSwitch />
      </div>
    </header>
  );
}
