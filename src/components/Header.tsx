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

function PyeLogo() {
  return (
    <>
      <svg
        aria-label="PYE Logo"
        width="67"
        height="32"
        viewBox="0 0 67 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-auto dark:hidden"
      >
        <g clipPath="url(#pye-clip-light)">
          <path d="M66.716 4.3974V9.66656H48.6597V12.9222H65.8102V17.8557H48.6597V21.4135H66.8504V26.7836H41.9473V4.3974H66.716Z" fill="#24201C" />
          <path d="M48.5226 3.30509C44.2501 1.19061 39.4396 0 34.3502 0C29.2609 0 24.6716 1.13579 20.4734 3.16002C20.2094 3.28771 20.0396 3.5531 20.0396 3.84658V32L48.6268 3.4067C48.6028 3.36392 48.5673 3.32849 48.5226 3.30509Z" fill="url(#pye-radial-light)" />
          <path d="M48.6268 3.40674L20.0396 32H28.9073C29.3391 32 29.7536 31.8282 30.0591 31.5227L48.6623 12.9162L48.6609 3.53175C48.6609 3.48696 48.6482 3.44417 48.6268 3.40674Z" fill="url(#pye-linear-light)" />
          <path d="M0 4.51843H17.8885C18.537 4.51843 19.0745 4.5298 19.4996 4.55186C19.9241 4.57459 20.2717 4.59665 20.5398 4.61871C20.8086 4.64144 21.0987 4.67486 21.4122 4.71965C22.4638 4.87675 23.3422 5.12209 24.0468 5.45768C24.7514 5.79327 25.3109 6.2746 25.7247 6.90099C26.1385 7.52737 26.4293 8.32758 26.5971 9.30092C26.7649 10.2743 26.8485 11.4769 26.8485 12.9088C26.8485 14.1623 26.787 15.2306 26.664 16.1137C26.541 16.9981 26.3391 17.7475 26.0597 18.3625C25.7796 18.9782 25.4105 19.4756 24.952 19.8559C24.4934 20.2363 23.9285 20.5499 23.2573 20.7959C22.8762 20.9302 22.4792 21.0365 22.066 21.1147C21.6515 21.1936 21.1542 21.2545 20.5726 21.2992C19.9903 21.344 19.2857 21.3781 18.4581 21.4002C17.6298 21.4229 16.6124 21.4336 15.4037 21.4336H6.81274V26.904H0V4.51843ZM15.3382 15.8289C16.121 15.8289 16.736 15.8235 17.1839 15.8122C17.6312 15.8015 17.9835 15.7841 18.2408 15.762C18.4975 15.74 18.6881 15.7065 18.8111 15.6611C18.9341 15.6163 19.0631 15.5494 19.1968 15.4599C19.5097 15.2586 19.7283 14.9792 19.8513 14.6209C19.9743 14.2632 20.0358 13.6923 20.0358 12.9095C20.0358 12.1267 19.9515 11.5117 19.7837 11.1306C19.6159 10.7502 19.3084 10.4822 18.8605 10.3251C18.7482 10.2803 18.6426 10.2469 18.5417 10.2241C18.4407 10.2021 18.2783 10.1854 18.055 10.174C17.831 10.1626 17.5068 10.1519 17.0816 10.1406C16.6565 10.1299 16.0749 10.1238 15.3362 10.1238H6.81274V15.8295H15.3375L15.3382 15.8289Z" fill="#24201C" />
        </g>
        <defs>
          <radialGradient id="pye-radial-light" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(34.2446 32.0796) scale(31.8917 31.8917)">
            <stop stopColor="#D59EFF" /><stop offset="0.14" stopColor="#C881FF" /><stop offset="0.44" stopColor="#AF48FF" /><stop offset="0.66" stopColor="#9F24FF" /><stop offset="0.78" stopColor="#9A17FF" /><stop offset="0.85" stopColor="#9817FC" /><stop offset="0.89" stopColor="#9519F4" /><stop offset="0.92" stopColor="#8E1BE7" /><stop offset="0.95" stopColor="#851FD3" /><stop offset="0.97" stopColor="#7924BA" /><stop offset="0.99" stopColor="#6B2A9C" /><stop offset="1" stopColor="#662D91" />
          </radialGradient>
          <linearGradient id="pye-linear-light" x1="34.3509" y1="32" x2="34.3509" y2="3.4756" gradientUnits="userSpaceOnUse">
            <stop stopColor="#331647" /><stop offset="0.09" stopColor="#441D60" /><stop offset="0.33" stopColor="#6B2F98" /><stop offset="0.54" stopColor="#8A3CC4" /><stop offset="0.73" stopColor="#A046E4" /><stop offset="0.89" stopColor="#AE4CF8" /><stop offset="1" stopColor="#B34FFF" />
          </linearGradient>
          <clipPath id="pye-clip-light"><rect width="66.8505" height="32" fill="white" /></clipPath>
        </defs>
      </svg>
      <svg
        aria-label="PYE Logo"
        width="67"
        height="32"
        viewBox="0 0 67 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="hidden h-6 w-auto dark:block"
      >
        <g clipPath="url(#pye-clip-dark)">
          <path d="M66.716 4.3974V9.66656H48.6597V12.9222H65.8102V17.8557H48.6597V21.4135H66.8504V26.7836H41.9473V4.3974H66.716Z" fill="white" />
          <path d="M48.5226 3.30509C44.2501 1.19061 39.4396 0 34.3502 0C29.2609 0 24.6716 1.13579 20.4734 3.16002C20.2094 3.28771 20.0396 3.5531 20.0396 3.84658V32L48.6268 3.4067C48.6028 3.36392 48.5673 3.32849 48.5226 3.30509Z" fill="url(#pye-radial-dark)" />
          <path d="M48.6268 3.40674L20.0396 32H28.9073C29.3391 32 29.7536 31.8282 30.0591 31.5227L48.6623 12.9162L48.6609 3.53175C48.6609 3.48696 48.6482 3.44417 48.6268 3.40674Z" fill="url(#pye-linear-dark)" />
          <path d="M0 4.51843H17.8885C18.537 4.51843 19.0745 4.5298 19.4996 4.55186C19.9241 4.57459 20.2717 4.59665 20.5398 4.61871C20.8086 4.64144 21.0987 4.67486 21.4122 4.71965C22.4638 4.87675 23.3422 5.12209 24.0468 5.45768C24.7514 5.79327 25.3109 6.2746 25.7247 6.90099C26.1385 7.52737 26.4293 8.32758 26.5971 9.30092C26.7649 10.2743 26.8485 11.4769 26.8485 12.9088C26.8485 14.1623 26.787 15.2306 26.664 16.1137C26.541 16.9981 26.3391 17.7475 26.0597 18.3625C25.7796 18.9782 25.4105 19.4756 24.952 19.8559C24.4934 20.2363 23.9285 20.5499 23.2573 20.7959C22.8762 20.9302 22.4792 21.0365 22.066 21.1147C21.6515 21.1936 21.1542 21.2545 20.5726 21.2992C19.9903 21.344 19.2857 21.3781 18.4581 21.4002C17.6298 21.4229 16.6124 21.4336 15.4037 21.4336H6.81274V26.904H0V4.51843ZM15.3382 15.8289C16.121 15.8289 16.736 15.8235 17.1839 15.8122C17.6312 15.8015 17.9835 15.7841 18.2408 15.762C18.4975 15.74 18.6881 15.7065 18.8111 15.6611C18.9341 15.6163 19.0631 15.5494 19.1968 15.4599C19.5097 15.2586 19.7283 14.9792 19.8513 14.6209C19.9743 14.2632 20.0358 13.6923 20.0358 12.9095C20.0358 12.1267 19.9515 11.5117 19.7837 11.1306C19.6159 10.7502 19.3084 10.4822 18.8605 10.3251C18.7482 10.2803 18.6426 10.2469 18.5417 10.2241C18.4407 10.2021 18.2783 10.1854 18.055 10.174C17.831 10.1626 17.5068 10.1519 17.0816 10.1406C16.6565 10.1299 16.0749 10.1238 15.3362 10.1238H6.81274V15.8295H15.3375L15.3382 15.8289Z" fill="white" />
        </g>
        <defs>
          <radialGradient id="pye-radial-dark" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(34.2446 32.0796) scale(31.8917 31.8917)">
            <stop stopColor="#D59EFF" /><stop offset="0.14" stopColor="#C881FF" /><stop offset="0.44" stopColor="#AF48FF" /><stop offset="0.66" stopColor="#9F24FF" /><stop offset="0.78" stopColor="#9A17FF" /><stop offset="0.85" stopColor="#9817FC" /><stop offset="0.89" stopColor="#9519F4" /><stop offset="0.92" stopColor="#8E1BE7" /><stop offset="0.95" stopColor="#851FD3" /><stop offset="0.97" stopColor="#7924BA" /><stop offset="0.99" stopColor="#6B2A9C" /><stop offset="1" stopColor="#662D91" />
          </radialGradient>
          <linearGradient id="pye-linear-dark" x1="34.3509" y1="32" x2="34.3509" y2="3.4756" gradientUnits="userSpaceOnUse">
            <stop stopColor="#331647" /><stop offset="0.09" stopColor="#441D60" /><stop offset="0.33" stopColor="#6B2F98" /><stop offset="0.54" stopColor="#8A3CC4" /><stop offset="0.73" stopColor="#A046E4" /><stop offset="0.89" stopColor="#AE4CF8" /><stop offset="1" stopColor="#B34FFF" />
          </linearGradient>
          <clipPath id="pye-clip-dark"><rect width="66.8505" height="32" fill="white" /></clipPath>
        </defs>
      </svg>
    </>
  );
}

export default function Header() {
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-layers-base-primary w-full">
      <div className="flex items-center gap-3 shrink-0">
        <PyeLogo />
        <span className="text-sm text-text-primary">
          Staking Utilities
        </span>
      </div>
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        <SolBalance />
        <WalletButton />
        <DarkModeSwitch />
      </div>
    </header>
  );
}
