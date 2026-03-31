# stakeutils.com Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the stakeutils.com Next.js frontend — a two-column stake account management tool where users can view their Solana stake accounts, change account state (activate/deactivate), split accounts, and transfer authorities.

**Architecture:** Single-page app with a two-column layout: left panel shows a paginated list of the user's stake accounts with radio selection; right panel shows a tabbed action area (State Change | Split | Transfer) that reacts to the selected account. The existing `pye-stake-utils` SDK library (in the repo root) handles all on-chain interactions. The frontend lives in `apps/web/` as an npm workspace sibling.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS v4, Zustand 5 (vanilla + React), @solana/wallet-adapter-react, @solana/web3.js 1.x, clsx, tailwind-merge, class-variance-authority, motion, lucide-react, Vitest

---

## File Map

**New files to create:**

```
apps/web/
├── package.json
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── .env.local.example
├── public/
│   └── fonts/                  ← drop garamond-narrow.otf here
├── src/
│   ├── app/
│   │   ├── layout.tsx           root layout + all providers
│   │   ├── page.tsx             main page (two-column layout)
│   │   └── globals.css          design tokens + Tailwind v4
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.tsx       CVA button variants
│   │   │   └── badge.tsx        state badge (active/inactive/etc)
│   │   ├── ThemeProvider.tsx    light/dark context + localStorage
│   │   ├── Header.tsx           logo, dark mode switch, wallet button
│   │   ├── WalletButton.tsx     connects to wallet adapter + syncs store
│   │   ├── StakeSyncer.tsx      fetches accounts when wallet connects
│   │   ├── stake-list/
│   │   │   ├── StakeAccountList.tsx   left panel: list + pagination
│   │   │   └── StakeAccountRow.tsx    single row with radio + account info
│   │   └── action-panel/
│   │       ├── ActionPanel.tsx        right panel: tab group shell
│   │       ├── StateChangeTab.tsx     activate / deactivate / connect CTA
│   │       ├── SplitTab.tsx           SOL input + resulting accounts preview
│   │       └── TransferTab.tsx        authority transfer address input
│   ├── store/
│   │   ├── wallet-store.ts      wallet state (status, publicKey, balance)
│   │   ├── wallet-provider.tsx  ConnectionProvider + WalletProvider + Zustand ctx
│   │   ├── stake-provider.tsx   wraps SDK createStakeStore in React context
│   │   └── ui-store.ts          selected account pubkey, active tab, split/transfer state
│   └── lib/
│       ├── utils.ts             cn() helper (clsx + tailwind-merge)
│       ├── format.ts            shortenAddress, formatSol, lamportsToSol
│       └── execute-actions.ts   sign-and-send wrappers for each tx type
```

**Modified files:**

```
package.json                     add "workspaces": ["apps/*"]
```

---

## Task 1: npm workspace setup

**Files:**
- Modify: `package.json` (root)
- Create: `apps/web/package.json`

- [ ] **Step 1: Add workspaces to root package.json**

Open `package.json` (root). Add `"workspaces": ["apps/*"]` after the `"description"` field:

```json
{
  "name": "pye-stake-utils",
  "version": "0.1.0",
  "description": "Swiss Army knife for Solana stake account operations",
  "workspaces": ["apps/*"],
  "type": "module",
  "main": "src/index.ts",
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@solana/spl-token": "^0.4.14",
    "@solana/web3.js": "^1.98.4",
    "zustand": "^5.0.11"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "@types/node": "^22.0.0"
  }
}
```

- [ ] **Step 2: Create apps/web/package.json**

```json
{
  "name": "stake-utils-web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "pye-stake-utils": "*",
    "@solana/kit": "^6.0.1",
    "@solana/spl-token": "^0.4.14",
    "@solana/wallet-adapter-react": "^0.15.39",
    "@solana/wallet-adapter-react-ui": "^0.9.39",
    "@solana/wallet-adapter-wallets": "^0.19.37",
    "@solana/web3.js": "^1.98.4",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "immer": "^11.1.3",
    "lucide-react": "^0.563.0",
    "motion": "^12.34.3",
    "next": "15.3.0",
    "radix-ui": "^1.4.3",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "tailwind-merge": "^3.4.0",
    "zustand": "^5.0.11"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@vitejs/plugin-react": "^4.3.4",
    "eslint": "^9",
    "eslint-config-next": "15.3.0",
    "tailwindcss": "^4",
    "tw-animate-css": "^1.4.0",
    "typescript": "^5",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 3: Create apps/web/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create apps/web/postcss.config.mjs**

```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;
```

- [ ] **Step 5: Create apps/web/next.config.ts**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["pye-stake-utils"],
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
    };
    return config;
  },
};

export default nextConfig;
```

- [ ] **Step 6: Create apps/web/.env.local.example**

```
NEXT_PUBLIC_RPC_URL=https://api.mainnet-beta.solana.com
```

- [ ] **Step 7: Install dependencies from repo root**

Run from the `stake-utils/` root (where package.json with workspaces lives):

```bash
npm install
```

Expected: `node_modules/` is created (or updated) at root; `apps/web/node_modules/` is created; `pye-stake-utils` is symlinked as a workspace package.

- [ ] **Step 8: Verify SDK resolves**

```bash
cd apps/web && node -e "const pkg = require('../../package.json'); console.log(pkg.name)"
```

Expected: `pye-stake-utils`

- [ ] **Step 9: Commit**

```bash
git add package.json apps/web/package.json apps/web/tsconfig.json apps/web/postcss.config.mjs apps/web/next.config.ts apps/web/.env.local.example
git commit -m "chore: add npm workspace and scaffold apps/web Next.js app"
```

---

## Task 2: Design system — globals.css and fonts

**Files:**
- Create: `apps/web/src/app/globals.css`
- Create: `apps/web/public/fonts/` (placeholder for garamond-narrow.otf)

- [ ] **Step 1: Create apps/web/src/app/globals.css**

This is the single source of truth for all design tokens. Uses the exact same palette as pye-frontend-v2.

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

:root {
  /* Layers */
  --layers-base-primary: #eceae8;
  --layers-surface-default: #f1efed;
  --layers-surface-lowered-1: #eceae8;
  --layers-surface-lowered-2: #e6e3e0;
  --layers-elevation-shadow: #e0ddd9;
  --layers-elevation-highlight: #ffffff;
  --layers-surface-raised-1: #f8f7f6;

  /* Text */
  --text-primary: #24201c;
  --text-secondary: #6c6660;
  --text-02: #b8bdc7;
  --text-disabled: #97939f;

  /* Brand */
  --brand-primary-purple: #9a4dff;
  --brand-purple-7: #caadff;
  --brand-purple-8: #b78eff;
  --brand-purple-10: #8c42eb;
  --brand-purple-11: #6c24c2;
  --brand-action-amber: #ffb54d;
  --brand-action-green: #0d9c5e;
  --brand-action-red: #e5484d;
  --brand-gray-11: #6c6660;
  --brand-gray-12: #24201c;
  --brand-secondary-pink: #f799e6;
  --brand-secondary-turquoise: #08cfb1;

  /* shadcn tokens */
  --radius: 0.625rem;
  --background: #f1efed;
  --foreground: #24201c;
  --card: #f1efed;
  --card-foreground: #24201c;
  --popover: #f1efed;
  --popover-foreground: #24201c;
  --primary: #9a4dff;
  --primary-foreground: #ffffff;
  --secondary: #e6e3e0;
  --secondary-foreground: #24201c;
  --muted: #e6e3e0;
  --muted-foreground: #6c6660;
  --accent: #e6e3e0;
  --accent-foreground: #24201c;
  --destructive: #ef4444;
  --border: #e0ddd9;
  --input: #e0ddd9;
  --ring: #9a4dff;
}

.dark {
  --layers-base-primary: #110f14;
  --layers-surface-default: #1f1c26;
  --layers-surface-lowered-1: #110f14;
  --layers-surface-lowered-2: #0a090c;
  --layers-elevation-shadow: #0a090c;
  --layers-elevation-highlight: #3c364a;
  --layers-surface-raised-1: #2b2735;
  --text-primary: #ffffff;
  --text-secondary: #d7d4dd;
  --text-02: #d7d4dd;
  --brand-action-green: #06d67c;
  --brand-gray-11: #bcb8c7;
  --brand-gray-12: #ffffff;
  --background: #1f1c26;
  --foreground: #ffffff;
  --card: #1f1c26;
  --card-foreground: #ffffff;
  --popover: #1f1c26;
  --popover-foreground: #ffffff;
  --primary-foreground: #ffffff;
  --secondary: #2b2735;
  --secondary-foreground: #ffffff;
  --muted: #2b2735;
  --muted-foreground: #d7d4dd;
  --accent: #2b2735;
  --accent-foreground: #ffffff;
  --destructive: #e5484d;
  --border: #3c364a;
  --input: #3c364a;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  --font-garamond: var(--font-garamond);

  /* Layers */
  --color-layers-base-primary: var(--layers-base-primary);
  --color-layers-surface-default: var(--layers-surface-default);
  --color-layers-surface-lowered-1: var(--layers-surface-lowered-1);
  --color-layers-surface-lowered-2: var(--layers-surface-lowered-2);
  --color-layers-elevation-shadow: var(--layers-elevation-shadow);
  --color-layers-elevation-highlight: var(--layers-elevation-highlight);
  --color-layers-surface-raised-1: var(--layers-surface-raised-1);

  /* Text */
  --color-text-primary: var(--text-primary);
  --color-text-secondary: var(--text-secondary);
  --color-text-02: var(--text-02);
  --color-text-disabled: var(--text-disabled);

  /* Brand */
  --color-brand-primary-purple: var(--brand-primary-purple);
  --color-brand-purple-7: var(--brand-purple-7);
  --color-brand-purple-8: var(--brand-purple-8);
  --color-brand-purple-10: var(--brand-purple-10);
  --color-brand-purple-11: var(--brand-purple-11);
  --color-brand-action-amber: var(--brand-action-amber);
  --color-brand-action-green: var(--brand-action-green);
  --color-brand-action-red: var(--brand-action-red);
  --color-brand-gray-11: var(--brand-gray-11);
  --color-brand-gray-12: var(--brand-gray-12);
  --color-brand-secondary-pink: var(--brand-secondary-pink);
  --color-brand-secondary-turquoise: var(--brand-secondary-turquoise);

  /* shadcn */
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --radius-2xl: calc(var(--radius) + 8px);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}

.eyebrow-xs {
  font-size: 0.75rem !important;
  font-weight: 400 !important;
  line-height: 18px !important;
  letter-spacing: 0 !important;
  text-transform: uppercase !important;
  font-feature-settings: 'case' 1, 'zero' 1, 'cv01' 1, 'cv02' 1, 'cv03' 1, 'cv04' 1, 'lnum' 1, 'tnum' 1 !important;
}

.mono-nums {
  font-feature-settings: 'cv01' 1, 'cv02' 1, 'cv03' 1, 'cv04' 1, 'zero' 1, 'lnum' 1, 'tnum' 1;
}
```

- [ ] **Step 2: Note the font file requirement**

The heading font (ITC Garamond Std Light Narrow) is a commercial font. Place the `.otf` file at:
```
apps/web/public/fonts/garamond-narrow.otf
```
This is referenced in `layout.tsx` via `next/font/local`. The app renders without it (falls back to serif) but headings won't match the Figma spec.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/globals.css
git commit -m "feat: add design system CSS variables and tokens"
```

---

## Task 3: Core utilities

**Files:**
- Create: `apps/web/src/lib/utils.ts`
- Create: `apps/web/src/lib/format.ts`

- [ ] **Step 1: Write test for format utilities**

Create `apps/web/src/lib/format.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { shortenAddress, lamportsToSol, formatSol } from "./format";

describe("shortenAddress", () => {
  it("shortens a 44-char address to 4...4 format", () => {
    const addr = "ABCDefghIJKLmnopQRSTuvwxYZab12345678ABCD1234";
    expect(shortenAddress(addr)).toBe("ABCD...1234");
  });
});

describe("lamportsToSol", () => {
  it("converts 1_000_000_000 lamports to 1 SOL", () => {
    expect(lamportsToSol(1_000_000_000)).toBe(1);
  });
  it("returns 0 for null", () => {
    expect(lamportsToSol(null)).toBe(0);
  });
});

describe("formatSol", () => {
  it("formats null as em-dash", () => {
    expect(formatSol(null)).toBe("—");
  });
  it("formats 1_500_000_000 as '1.5000'", () => {
    expect(formatSol(1_500_000_000)).toMatch(/1\.5/);
  });
});
```

- [ ] **Step 2: Run test — expect failure**

```bash
cd apps/web && npx vitest run src/lib/format.test.ts
```

Expected: FAIL — `Cannot find module './format'`

- [ ] **Step 3: Create apps/web/src/lib/utils.ts**

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 4: Create apps/web/src/lib/format.ts**

```ts
const LAMPORTS_PER_SOL = 1_000_000_000;

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function lamportsToSol(lamports: number | null): number {
  if (lamports === null) return 0;
  return lamports / LAMPORTS_PER_SOL;
}

export function formatSol(lamports: number | null, decimals = 4): string {
  if (lamports === null) return "—";
  const sol = lamports / LAMPORTS_PER_SOL;
  return sol.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  });
}

export function solToLamports(sol: number): number {
  return Math.round(sol * LAMPORTS_PER_SOL);
}
```

- [ ] **Step 5: Run tests — expect pass**

```bash
cd apps/web && npx vitest run src/lib/format.test.ts
```

Expected: all 4 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/utils.ts apps/web/src/lib/format.ts apps/web/src/lib/format.test.ts
git commit -m "feat: add core utility functions with tests"
```

---

## Task 4: UI store

**Files:**
- Create: `apps/web/src/store/ui-store.ts`

The UI store holds all frontend-only state: which account is selected, which tab is active, the split amount input, the transfer address input, and transaction status.

- [ ] **Step 1: Write failing tests**

Create `apps/web/src/store/ui-store.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { createUIStore } from "./ui-store";

describe("UIStore", () => {
  let store: ReturnType<typeof createUIStore>;

  beforeEach(() => {
    store = createUIStore();
  });

  it("starts with no selected account and state-change tab active", () => {
    const s = store.getState();
    expect(s.selectedAccountPubkey).toBeNull();
    expect(s.activeTab).toBe("state-change");
  });

  it("selectAccount sets the pubkey", () => {
    store.getState().selectAccount("abc123");
    expect(store.getState().selectedAccountPubkey).toBe("abc123");
  });

  it("setActiveTab switches tabs", () => {
    store.getState().setActiveTab("split");
    expect(store.getState().activeTab).toBe("split");
  });

  it("setSplitSol updates splitSol", () => {
    store.getState().setSplitSol(5);
    expect(store.getState().splitSol).toBe(5);
  });

  it("setTransferAddress updates transferAddress", () => {
    store.getState().setTransferAddress("newAddr");
    expect(store.getState().transferAddress).toBe("newAddr");
  });

  it("setTxStatus sets status and clears signature", () => {
    store.getState().setTxStatus("pending");
    expect(store.getState().txStatus).toBe("pending");
    expect(store.getState().txSignature).toBeNull();
  });

  it("setTxSuccess sets status to success and stores signature", () => {
    store.getState().setTxSuccess("sig123");
    expect(store.getState().txStatus).toBe("success");
    expect(store.getState().txSignature).toBe("sig123");
  });

  it("resetTx clears tx state", () => {
    store.getState().setTxSuccess("sig123");
    store.getState().resetTx();
    expect(store.getState().txStatus).toBeNull();
    expect(store.getState().txSignature).toBeNull();
  });
});
```

- [ ] **Step 2: Run test — expect failure**

```bash
cd apps/web && npx vitest run src/store/ui-store.test.ts
```

Expected: FAIL — `Cannot find module './ui-store'`

- [ ] **Step 3: Create apps/web/src/store/ui-store.ts**

```ts
import { createStore } from "zustand/vanilla";

export type Tab = "state-change" | "split" | "transfer";
export type TxStatus = "pending" | "success" | "error" | null;

export interface UIState {
  selectedAccountPubkey: string | null;
  activeTab: Tab;
  splitSol: number;
  transferAddress: string;
  txStatus: TxStatus;
  txSignature: string | null;
  txError: string | null;
}

export interface UIActions {
  selectAccount: (pubkey: string | null) => void;
  setActiveTab: (tab: Tab) => void;
  setSplitSol: (sol: number) => void;
  setTransferAddress: (address: string) => void;
  setTxStatus: (status: TxStatus) => void;
  setTxSuccess: (signature: string) => void;
  setTxError: (error: string) => void;
  resetTx: () => void;
}

export type UIStore = UIState & UIActions;

const initialState: UIState = {
  selectedAccountPubkey: null,
  activeTab: "state-change",
  splitSol: 0,
  transferAddress: "",
  txStatus: null,
  txSignature: null,
  txError: null,
};

export function createUIStore() {
  return createStore<UIStore>()((set) => ({
    ...initialState,

    selectAccount(pubkey) {
      set({ selectedAccountPubkey: pubkey });
    },

    setActiveTab(tab) {
      set({ activeTab: tab });
    },

    setSplitSol(sol) {
      set({ splitSol: sol });
    },

    setTransferAddress(address) {
      set({ transferAddress: address });
    },

    setTxStatus(status) {
      set({ txStatus: status, txSignature: null, txError: null });
    },

    setTxSuccess(signature) {
      set({ txStatus: "success", txSignature: signature, txError: null });
    },

    setTxError(error) {
      set({ txStatus: "error", txSignature: null, txError: error });
    },

    resetTx() {
      set({ txStatus: null, txSignature: null, txError: null });
    },
  }));
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
cd apps/web && npx vitest run src/store/ui-store.test.ts
```

Expected: all 8 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/store/ui-store.ts apps/web/src/store/ui-store.test.ts
git commit -m "feat: add UI store with selected account, tab, and tx state"
```

---

## Task 5: Wallet store + provider

**Files:**
- Create: `apps/web/src/store/wallet-store.ts`
- Create: `apps/web/src/store/wallet-provider.tsx`

- [ ] **Step 1: Create apps/web/src/store/wallet-store.ts**

```ts
import { createStore } from "zustand/vanilla";
import { immer } from "zustand/middleware/immer";

export type WalletStatus = "disconnected" | "connecting" | "connected";

export interface WalletState {
  status: WalletStatus;
  publicKey: string | null;
  displayAddress: string | null;
  balanceLamports: number | null;
  walletInitialized: boolean;
}

export interface WalletActions {
  setWalletStatus: (status: WalletStatus) => void;
  setPublicKey: (pubkey: string | null) => void;
  setDisplayAddress: (addr: string | null) => void;
  setBalanceLamports: (lamports: number | null) => void;
  setWalletInitialized: (v: boolean) => void;
  resetWallet: () => void;
}

export type WalletStore = WalletState & WalletActions;

const initialState: WalletState = {
  status: "disconnected",
  publicKey: null,
  displayAddress: null,
  balanceLamports: null,
  walletInitialized: false,
};

export function createWalletStore() {
  return createStore<WalletStore>()(
    immer((set) => ({
      ...initialState,

      setWalletStatus: (status) => set((s) => { s.status = status; }),
      setPublicKey: (pubkey) => set((s) => { s.publicKey = pubkey; }),
      setDisplayAddress: (addr) => set((s) => { s.displayAddress = addr; }),
      setBalanceLamports: (lamports) => set((s) => { s.balanceLamports = lamports; }),
      setWalletInitialized: (v) => set((s) => { s.walletInitialized = v; }),
      resetWallet: () => set((s) => {
        s.status = "disconnected";
        s.publicKey = null;
        s.displayAddress = null;
        s.balanceLamports = null;
      }),
    })),
  );
}
```

- [ ] **Step 2: Create apps/web/src/store/wallet-provider.tsx**

```tsx
"use client";

import {
  createContext,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useStore } from "zustand";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { createWalletStore, type WalletStore } from "./wallet-store";
import "@solana/wallet-adapter-react-ui/styles.css";

const RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.mainnet-beta.solana.com";

type WalletStoreApi = ReturnType<typeof createWalletStore>;
const WalletStoreContext = createContext<WalletStoreApi | null>(null);

export function WalletStoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<WalletStoreApi>(undefined);
  if (!storeRef.current) {
    storeRef.current = createWalletStore();
  }

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    [],
  );

  return (
    <ConnectionProvider endpoint={RPC_ENDPOINT}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletStoreContext.Provider value={storeRef.current}>
            {children}
          </WalletStoreContext.Provider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export function useWalletStore<T>(selector: (s: WalletStore) => T): T {
  const store = useContext(WalletStoreContext);
  if (!store) throw new Error("useWalletStore must be inside WalletStoreProvider");
  return useStore(store, selector);
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/store/wallet-store.ts apps/web/src/store/wallet-provider.tsx
git commit -m "feat: add wallet store and Solana wallet adapter provider"
```

---

## Task 6: Stake accounts provider

**Files:**
- Create: `apps/web/src/store/stake-provider.tsx`

This wraps the SDK's `createStakeStore` in a React context, matching the vanilla-store-in-context pattern used throughout.

- [ ] **Step 1: Create apps/web/src/store/stake-provider.tsx**

```tsx
"use client";

import {
  createContext,
  useContext,
  useRef,
  type ReactNode,
} from "react";
import { useStore } from "zustand";
import { createStakeStore } from "pye-stake-utils";
import type { StakeStore } from "pye-stake-utils";

type StakeStoreApi = ReturnType<typeof createStakeStore>;
const StakeStoreContext = createContext<StakeStoreApi | null>(null);

export function StakeStoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<StakeStoreApi>(undefined);
  if (!storeRef.current) {
    storeRef.current = createStakeStore();
  }

  return (
    <StakeStoreContext.Provider value={storeRef.current}>
      {children}
    </StakeStoreContext.Provider>
  );
}

export function useStakeStore<T>(selector: (s: StakeStore) => T): T {
  const store = useContext(StakeStoreContext);
  if (!store) throw new Error("useStakeStore must be inside StakeStoreProvider");
  return useStore(store, selector);
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/store/stake-provider.tsx
git commit -m "feat: add stake accounts store provider wrapping SDK"
```

---

## Task 7: UI store provider

**Files:**
- Create: `apps/web/src/store/ui-provider.tsx`

- [ ] **Step 1: Create apps/web/src/store/ui-provider.tsx**

```tsx
"use client";

import {
  createContext,
  useContext,
  useRef,
  type ReactNode,
} from "react";
import { useStore } from "zustand";
import { createUIStore, type UIStore } from "./ui-store";

type UIStoreApi = ReturnType<typeof createUIStore>;
const UIStoreContext = createContext<UIStoreApi | null>(null);

export function UIStoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<UIStoreApi>(undefined);
  if (!storeRef.current) {
    storeRef.current = createUIStore();
  }

  return (
    <UIStoreContext.Provider value={storeRef.current}>
      {children}
    </UIStoreContext.Provider>
  );
}

export function useUIStore<T>(selector: (s: UIStore) => T): T {
  const store = useContext(UIStoreContext);
  if (!store) throw new Error("useUIStore must be inside UIStoreProvider");
  return useStore(store, selector);
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/store/ui-provider.tsx
git commit -m "feat: add UI store provider"
```

---

## Task 8: ThemeProvider + root layout

**Files:**
- Create: `apps/web/src/components/ThemeProvider.tsx`
- Create: `apps/web/src/app/layout.tsx`

- [ ] **Step 1: Create apps/web/src/components/ThemeProvider.tsx**

```tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
}>({ theme: "light", toggleTheme: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored) {
      setTheme(stored);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{ theme, toggleTheme: () => setTheme((p) => p === "light" ? "dark" : "light") }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
```

- [ ] **Step 2: Create apps/web/src/app/layout.tsx**

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/ThemeProvider";
import { WalletStoreProvider } from "@/store/wallet-provider";
import { StakeStoreProvider } from "@/store/stake-provider";
import { UIStoreProvider } from "@/store/ui-provider";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// Place garamond-narrow.otf at public/fonts/garamond-narrow.otf
const garamond = localFont({
  src: "../../public/fonts/garamond-narrow.otf",
  variable: "--font-garamond",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Stake Utils",
  description: "Solana stake account management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} ${garamond.variable} antialiased`}>
        <ThemeProvider>
          <WalletStoreProvider>
            <StakeStoreProvider>
              <UIStoreProvider>
                {children}
              </UIStoreProvider>
            </StakeStoreProvider>
          </WalletStoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/ThemeProvider.tsx apps/web/src/app/layout.tsx
git commit -m "feat: add ThemeProvider and root layout with all providers"
```

---

## Task 9: Button and Badge UI components

**Files:**
- Create: `apps/web/src/components/ui/button.tsx`
- Create: `apps/web/src/components/ui/badge.tsx`

- [ ] **Step 1: Create apps/web/src/components/ui/button.tsx**

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[4px] text-sm font-normal transition-all disabled:pointer-events-none disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary-purple)]",
  {
    variants: {
      variant: {
        default:
          "bg-brand-primary-purple border-t border-brand-purple-8 text-white shadow-[inset_0px_-1px_0px_0px_var(--brand-purple-10)] hover:bg-[#CAADFF] disabled:bg-layers-surface-lowered-1 disabled:border-layers-elevation-shadow disabled:text-text-secondary disabled:opacity-50 disabled:shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-highlight)]",
        destructive:
          "bg-brand-action-red border-t border-[#ef4444] text-white shadow-[inset_0px_-1px_0px_0px_rgba(127,29,29,0.5)] hover:brightness-110 disabled:bg-layers-surface-lowered-1 disabled:border-layers-elevation-shadow disabled:text-text-secondary disabled:opacity-50 disabled:shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-highlight)]",
        outline:
          "bg-layers-surface-raised-1 border-t border-layers-elevation-highlight text-text-secondary shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-shadow)] hover:text-text-primary hover:bg-layers-elevation-highlight disabled:bg-layers-surface-lowered-1 disabled:border-layers-elevation-shadow disabled:opacity-50 disabled:shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-highlight)]",
        ghost: "text-text-secondary hover:text-text-primary disabled:opacity-50",
      },
      size: {
        default: "h-9 px-4 py-1.5",
        sm: "h-8 gap-1.5 px-3 py-1",
        lg: "h-10 px-6 py-2",
        icon: "size-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
```

- [ ] **Step 2: Create apps/web/src/components/ui/badge.tsx**

Renders the account state chip: Active (green), Activating (amber), Deactivating (amber), Inactive (surface).

```tsx
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
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/ui/button.tsx apps/web/src/components/ui/badge.tsx
git commit -m "feat: add Button and StateBadge UI components"
```

---

## Task 10: Header

**Files:**
- Create: `apps/web/src/components/Header.tsx`
- Create: `apps/web/src/components/WalletButton.tsx`

- [ ] **Step 1: Create apps/web/src/components/WalletButton.tsx**

```tsx
"use client";

import { useEffect, useRef } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useWalletStore } from "@/store/wallet-provider";
import { shortenAddress } from "@/lib/format";

export default function WalletButton() {
  const { publicKey, connected, connecting, disconnect } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();

  const setWalletStatus = useWalletStore((s) => s.setWalletStatus);
  const setPublicKey = useWalletStore((s) => s.setPublicKey);
  const setDisplayAddress = useWalletStore((s) => s.setDisplayAddress);
  const setBalanceLamports = useWalletStore((s) => s.setBalanceLamports);
  const resetWallet = useWalletStore((s) => s.resetWallet);

  const fetchedKeyRef = useRef<string | null>(null);

  const fetchBalance = async () => {
    if (!publicKey || !connection) return;
    try {
      const balance = await connection.getBalance(publicKey, "confirmed");
      setBalanceLamports(balance);
    } catch {
      setBalanceLamports(null);
    }
  };

  useEffect(() => {
    if (connecting) {
      setWalletStatus("connecting");
    } else if (connected && publicKey) {
      const base58 = publicKey.toBase58();
      setWalletStatus("connected");
      setPublicKey(base58);
      setDisplayAddress(shortenAddress(base58));
      if (fetchedKeyRef.current !== base58) {
        fetchedKeyRef.current = base58;
        fetchBalance();
      }
    } else {
      resetWallet();
      fetchedKeyRef.current = null;
    }
  }, [connected, connecting, publicKey]);

  useEffect(() => {
    if (!connected || !publicKey || !connection) return;
    const id = connection.onAccountChange(
      publicKey,
      (info) => setBalanceLamports(info.lamports),
      "confirmed",
    );
    return () => { connection.removeAccountChangeListener(id); };
  }, [connected, publicKey?.toBase58(), connection]);

  const monoStyle = {
    fontFeatureSettings: "'cv01' 1,'cv02' 1,'cv03' 1,'cv04' 1,'zero' 1,'lnum' 1,'tnum' 1",
  } as const;

  return (
    <button
      onClick={() => connected ? disconnect() : setVisible(true)}
      disabled={connecting}
      className="relative flex items-center gap-2 h-9 bg-layers-surface-default border-t border-layers-elevation-highlight rounded px-3 cursor-pointer disabled:cursor-wait shrink-0"
    >
      {!connected && !connecting && (
        <span className="text-sm text-brand-primary-purple" style={monoStyle}>
          Connect Wallet
        </span>
      )}
      {connecting && (
        <span className="text-sm text-text-secondary" style={monoStyle}>
          Connecting...
        </span>
      )}
      {connected && publicKey && (
        <span className="text-sm text-text-primary" style={monoStyle}>
          {shortenAddress(publicKey.toBase58())}
        </span>
      )}
      <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-shadow)]" />
    </button>
  );
}
```

- [ ] **Step 2: Create apps/web/src/components/Header.tsx**

```tsx
"use client";

import { motion } from "motion/react";
import { useTheme } from "./ThemeProvider";
import { useWalletStore } from "@/store/wallet-provider";
import { formatSol } from "@/lib/format";
import WalletButton from "./WalletButton";

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-primary">
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
      <div className="absolute left-1 size-7 flex items-center justify-center"><MoonIcon /></div>
      <div className="absolute right-1 size-7 flex items-center justify-center"><SunIcon /></div>
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
        <div className={`absolute inset-0 pointer-events-none rounded-[inherit] ${
          isDark ? "shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-shadow)]" : "shadow-[inset_0px_-1px_0px_0px_var(--brand-purple-11)]"
        }`} />
      </motion.div>
      <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-highlight)]" />
    </button>
  );
}

function SolBalance() {
  const status = useWalletStore((s) => s.status);
  const balanceLamports = useWalletStore((s) => s.balanceLamports);
  const monoStyle = { fontFeatureSettings: "'cv01' 1,'cv02' 1,'cv03' 1,'cv04' 1,'zero' 1,'lnum' 1,'tnum' 1" } as const;

  return (
    <div className="relative hidden md:flex items-center gap-2 h-9 bg-layers-surface-default border-t border-layers-elevation-highlight rounded px-2 shrink-0">
      <div className="relative size-5 rounded-full border-t border-layers-elevation-highlight overflow-hidden shrink-0">
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-[#9945FF] to-[#14F195]" />
      </div>
      <div className="flex items-center gap-1">
        <span className="text-sm text-text-primary" style={monoStyle}>SOL</span>
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
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/Header.tsx apps/web/src/components/WalletButton.tsx
git commit -m "feat: add Header with wallet button and dark mode switch"
```

---

## Task 11: StakeSyncer

**Files:**
- Create: `apps/web/src/components/StakeSyncer.tsx`

This component listens to wallet state and triggers stake account fetching when a wallet connects or disconnects.

- [ ] **Step 1: Create apps/web/src/components/StakeSyncer.tsx**

```tsx
"use client";

import { useEffect } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useWalletStore } from "@/store/wallet-provider";
import { useStakeStore } from "@/store/stake-provider";

export default function StakeSyncer() {
  const { connection } = useConnection();
  const walletStatus = useWalletStore((s) => s.status);
  const publicKey = useWalletStore((s) => s.publicKey);
  const refresh = useStakeStore((s) => s.refresh);
  const reset = useStakeStore((s) => s.reset);

  useEffect(() => {
    if (walletStatus === "connected" && publicKey) {
      refresh(connection, new PublicKey(publicKey));
    } else if (walletStatus === "disconnected") {
      reset();
    }
  }, [walletStatus, publicKey]);

  return null;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/StakeSyncer.tsx
git commit -m "feat: add StakeSyncer to fetch accounts on wallet connect"
```

---

## Task 12: Stake Account List (left panel)

**Files:**
- Create: `apps/web/src/components/stake-list/StakeAccountRow.tsx`
- Create: `apps/web/src/components/stake-list/StakeAccountList.tsx`

This is the left column of the two-column layout. Shows a paginated list of the user's stake accounts with radio selection.

- [ ] **Step 1: Create apps/web/src/components/stake-list/StakeAccountRow.tsx**

```tsx
"use client";

import { cn } from "@/lib/utils";
import { shortenAddress, lamportsToSol } from "@/lib/format";
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
    fontFeatureSettings: "'cv01' 1,'cv02' 1,'cv03' 1,'cv04' 1,'zero' 1,'lnum' 1,'tnum' 1",
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
          <span className="text-xs text-text-secondary">{account.validatorName.slice(0, 2)}</span>
        </div>
      )}

      {/* Name + pubkey */}
      <div className="flex-1 min-w-0">
        <div className="text-sm text-text-primary truncate">{account.validatorName}</div>
        <div className="text-xs text-text-secondary font-mono truncate" style={monoStyle}>
          {shortenAddress(account.pubkey)}
        </div>
      </div>

      {/* SOL + state */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="text-sm text-text-primary" style={monoStyle}>{sol} SOL</span>
        <StateBadge state={account.state} />
      </div>
    </button>
  );
}
```

- [ ] **Step 2: Create apps/web/src/components/stake-list/StakeAccountList.tsx**

```tsx
"use client";

import { useState } from "react";
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
    <div className="flex flex-col h-full bg-layers-surface-default rounded-[10px] overflow-hidden shadow-[0px_4px_8px_0px_rgba(0,0,0,0.07)] border-t border-layers-elevation-highlight">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-layers-elevation-shadow">
        <span className="text-sm text-text-primary">Stake Account Selection</span>
        {stakeAccounts.length > 0 && (
          <span className="text-xs text-text-secondary eyebrow-xs">
            Viewing {start + 1}–{Math.min(end, stakeAccounts.length)} of {stakeAccounts.length}
          </span>
        )}
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
        {walletStatus !== "disconnected" && !loading && stakeAccounts.length === 0 && (
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-layers-elevation-shadow">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="text-xs text-text-secondary disabled:opacity-40 hover:text-text-primary"
          >
            ← Prev
          </button>
          <span className="text-xs text-text-secondary">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="text-xs text-text-secondary disabled:opacity-40 hover:text-text-primary"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/stake-list/
git commit -m "feat: add stake account list with radio selection and pagination"
```

---

## Task 13: Action Panel — tab shell

**Files:**
- Create: `apps/web/src/components/action-panel/ActionPanel.tsx`

The right panel. Renders a tab group (State Change | Split | Transfer) and shows the appropriate tab content based on `activeTab` in the UI store.

- [ ] **Step 1: Create apps/web/src/components/action-panel/ActionPanel.tsx**

```tsx
"use client";

import { useRef } from "react";
import { motion } from "motion/react";
import { useUIStore } from "@/store/ui-provider";
import type { Tab } from "@/store/ui-store";
import StateChangeTab from "./StateChangeTab";
import SplitTab from "./SplitTab";
import TransferTab from "./TransferTab";

const tabs: { id: Tab; label: string }[] = [
  { id: "state-change", label: "State Change" },
  { id: "split", label: "Split" },
  { id: "transfer", label: "Transfer" },
];

export default function ActionPanel() {
  const activeTab = useUIStore((s) => s.activeTab);
  const setActiveTab = useUIStore((s) => s.setActiveTab);

  return (
    <div className="flex flex-col h-full bg-layers-surface-default rounded-[10px] overflow-hidden shadow-[0px_4px_8px_0px_rgba(0,0,0,0.07)] border-t border-layers-elevation-highlight">
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-4 pt-3 pb-0 border-b border-layers-elevation-shadow">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-3 py-2 text-sm transition-colors rounded-t ${
                active ? "text-text-primary" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {tab.label}
              {active && (
                <motion.div
                  layoutId="tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand-primary-purple rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "state-change" && <StateChangeTab />}
        {activeTab === "split" && <SplitTab />}
        {activeTab === "transfer" && <TransferTab />}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/action-panel/ActionPanel.tsx
git commit -m "feat: add action panel with animated tab switcher"
```

---

## Task 14: State Change tab

**Files:**
- Create: `apps/web/src/components/action-panel/StateChangeTab.tsx`

Three distinct states:
1. **No wallet connected** → purple "Connect wallet" button
2. **Account selected + Active** → red "Deactivate Stake" button + epoch alert
3. **Account selected + Inactive/Activating** → purple "Activate Stake" button + validator selector

- [ ] **Step 1: Create apps/web/src/components/action-panel/StateChangeTab.tsx**

```tsx
"use client";

import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { PublicKey, sendAndConfirmTransaction } from "@solana/web3.js";
import {
  buildDeactivateStakeTransaction,
  buildDelegateStakeTransaction,
} from "pye-stake-utils";
import { useWalletStore } from "@/store/wallet-provider";
import { useStakeStore } from "@/store/stake-provider";
import { useUIStore } from "@/store/ui-provider";
import { Button } from "@/components/ui/button";
import { StateBadge } from "@/components/ui/badge";
import { shortenAddress, lamportsToSol } from "@/lib/format";

const EPOCH_ALERT =
  "State transitions happen at the next epoch boundary. The account cannot be split or transferred while a state change is pending.";

const LAMPORTS_PER_SOL = 1_000_000_000;

export default function StateChangeTab() {
  const { sendTransaction } = useWallet();
  const { setVisible } = useWalletModal();
  const { connection } = useConnection();

  const walletStatus = useWalletStore((s) => s.status);
  const publicKey = useWalletStore((s) => s.publicKey);
  const stakeAccounts = useStakeStore((s) => s.stakeAccounts);
  const refresh = useStakeStore((s) => s.refresh);

  const selectedPubkey = useUIStore((s) => s.selectedAccountPubkey);
  const txStatus = useUIStore((s) => s.txStatus);
  const txSignature = useUIStore((s) => s.txSignature);
  const txError = useUIStore((s) => s.txError);
  const setTxStatus = useUIStore((s) => s.setTxStatus);
  const setTxSuccess = useUIStore((s) => s.setTxSuccess);
  const setTxError = useUIStore((s) => s.setTxError);
  const resetTx = useUIStore((s) => s.resetTx);

  const [voteAccount, setVoteAccount] = useState("");

  const selectedAccount = stakeAccounts.find((a) => a.pubkey === selectedPubkey) ?? null;

  const handleDeactivate = async () => {
    if (!selectedAccount || !publicKey) return;
    setTxStatus("pending");
    try {
      const tx = await buildDeactivateStakeTransaction({
        connection,
        stakeAccountPubkey: new PublicKey(selectedAccount.pubkey),
        authorizedPubkey: new PublicKey(publicKey),
      });
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, "confirmed");
      setTxSuccess(sig);
      refresh(connection, new PublicKey(publicKey));
    } catch (err) {
      setTxError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleActivate = async () => {
    if (!selectedAccount || !publicKey || !voteAccount) return;
    setTxStatus("pending");
    try {
      const tx = await buildDelegateStakeTransaction({
        connection,
        stakeAccountPubkey: new PublicKey(selectedAccount.pubkey),
        authorizedPubkey: new PublicKey(publicKey),
        votePubkey: new PublicKey(voteAccount),
      });
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, "confirmed");
      setTxSuccess(sig);
      refresh(connection, new PublicKey(publicKey));
    } catch (err) {
      setTxError(err instanceof Error ? err.message : String(err));
    }
  };

  const monoStyle = {
    fontFeatureSettings: "'cv01' 1,'cv02' 1,'cv03' 1,'cv04' 1,'zero' 1,'lnum' 1,'tnum' 1",
  } as const;

  // — No wallet —
  if (walletStatus !== "connected") {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-secondary">
          Connect your wallet to manage stake account state.
        </p>
        <Button onClick={() => setVisible(true)} className="w-full">
          Connect wallet
        </Button>
      </div>
    );
  }

  // — No account selected —
  if (!selectedAccount) {
    return (
      <p className="text-sm text-text-secondary">
        Select a stake account from the list to get started.
      </p>
    );
  }

  const sol = (selectedAccount.lamports / LAMPORTS_PER_SOL).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });

  const isActive = selectedAccount.state === "active" || selectedAccount.state === "activating";
  const isDeactivating = selectedAccount.state === "deactivating";

  return (
    <div className="flex flex-col gap-4">
      {/* Selected account summary */}
      <div className="flex items-center gap-3 p-3 rounded-[6px] bg-layers-surface-raised-1 border-t border-layers-elevation-highlight shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-shadow)]">
        {selectedAccount.validatorIcon ? (
          <img
            src={selectedAccount.validatorIcon}
            alt={selectedAccount.validatorName}
            className="size-8 rounded-full border border-layers-elevation-shadow shrink-0"
          />
        ) : (
          <div className="size-8 rounded-full bg-layers-surface-lowered-2 border border-layers-elevation-shadow flex items-center justify-center shrink-0">
            <span className="text-xs text-text-secondary">{selectedAccount.validatorName.slice(0, 2)}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-sm text-text-primary">{selectedAccount.validatorName}</div>
          <div className="text-xs text-text-secondary" style={monoStyle}>
            {shortenAddress(selectedAccount.pubkey)}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-sm text-text-primary" style={monoStyle}>{sol} SOL</span>
          <StateBadge state={selectedAccount.state} />
        </div>
      </div>

      {/* Context description */}
      {isDeactivating ? (
        <p className="text-sm text-text-secondary">
          This account is <span className="font-semibold text-text-primary">deactivating</span>.
          A state change is already pending — wait until it becomes inactive before taking further action.
        </p>
      ) : selectedAccount.state === "activating" ? (
        <p className="text-sm text-text-secondary">
          This account is <span className="font-semibold text-text-primary">activating</span>.
          Rewards will begin once activation is complete (next epoch boundary).
        </p>
      ) : selectedAccount.state === "active" ? (
        <p className="text-sm text-text-secondary">
          This account is <span className="font-semibold text-text-primary">active</span> and
          currently earning rewards. Deactivating begins a cooldown before funds become withdrawable.
        </p>
      ) : (
        <>
          <p className="text-sm text-text-secondary">
            This account is <span className="font-semibold text-text-primary">inactive</span>.
            Activating it will stake the SOL with the validator. Rewards begin after activation completes.
          </p>
          {/* Validator vote account input for activation */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-secondary eyebrow-xs">Validator Vote Account</label>
            <input
              type="text"
              value={voteAccount}
              onChange={(e) => setVoteAccount(e.target.value)}
              placeholder="Enter validator vote account address"
              className="h-11 px-3 rounded-[6px] bg-layers-surface-lowered-1 border-t border-layers-elevation-highlight text-sm text-text-primary placeholder:text-text-secondary shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-shadow)] outline-none focus:ring-1 focus:ring-brand-primary-purple"
              style={monoStyle}
            />
          </div>
        </>
      )}

      {/* Epoch alert */}
      {!isDeactivating && (
        <div className="flex gap-2 p-3 rounded-[6px] bg-layers-surface-raised-1 border border-layers-elevation-shadow text-xs text-text-secondary">
          <span className="shrink-0">⚠</span>
          <span>{EPOCH_ALERT}</span>
        </div>
      )}

      {/* Tx feedback */}
      {txStatus === "success" && txSignature && (
        <div className="p-3 rounded-[6px] bg-[rgba(13,156,94,0.1)] border border-[rgba(13,156,94,0.3)] text-xs text-brand-action-green flex flex-col gap-1">
          <span className="font-semibold">Transaction confirmed</span>
          <a
            href={`https://solscan.io/tx/${txSignature}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline break-all"
          >
            {txSignature.slice(0, 20)}...
          </a>
          <button onClick={resetTx} className="mt-1 text-left underline text-xs">
            Dismiss
          </button>
        </div>
      )}
      {txStatus === "error" && txError && (
        <div className="p-3 rounded-[6px] bg-[rgba(229,72,77,0.1)] border border-[rgba(229,72,77,0.3)] text-xs text-brand-action-red">
          <span className="font-semibold">Error: </span>{txError}
          <button onClick={resetTx} className="ml-2 underline text-xs">Dismiss</button>
        </div>
      )}

      {/* CTA */}
      {!isDeactivating && (
        <>
          {selectedAccount.state === "active" ? (
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleDeactivate}
              disabled={txStatus === "pending"}
            >
              {txStatus === "pending" ? "Deactivating..." : "Deactivate Stake"}
            </Button>
          ) : selectedAccount.state === "inactive" ? (
            <Button
              className="w-full"
              onClick={handleActivate}
              disabled={txStatus === "pending" || !voteAccount.trim()}
            >
              {txStatus === "pending" ? "Activating..." : "Activate Stake"}
            </Button>
          ) : null}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/action-panel/StateChangeTab.tsx
git commit -m "feat: add StateChangeTab with activate/deactivate/connect states"
```

---

## Task 15: Split tab

**Files:**
- Create: `apps/web/src/components/action-panel/SplitTab.tsx`

The user enters an SOL amount; the panel previews the two resulting accounts (original reduced, new account with that amount). "Confirm Split" is disabled when the input is 0 or exceeds the account balance.

- [ ] **Step 1: Write test for split validation logic**

Create `apps/web/src/lib/split-validation.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { validateSplitAmount } from "./split-validation";

describe("validateSplitAmount", () => {
  const RENT_EXEMPT_SOL = 0.00228; // typical rent-exempt minimum

  it("returns error when amount is 0", () => {
    expect(validateSplitAmount(0, 10)).toBe("Enter an amount");
  });

  it("returns error when amount equals total (nothing left)", () => {
    expect(validateSplitAmount(10, 10)).toMatch(/remaining/i);
  });

  it("returns error when amount would leave less than rent-exempt minimum", () => {
    expect(validateSplitAmount(9.9999, 10)).toMatch(/minimum/i);
  });

  it("returns null for a valid split", () => {
    expect(validateSplitAmount(5, 10)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test — expect failure**

```bash
cd apps/web && npx vitest run src/lib/split-validation.test.ts
```

Expected: FAIL — `Cannot find module './split-validation'`

- [ ] **Step 3: Create apps/web/src/lib/split-validation.ts**

```ts
const RENT_EXEMPT_MINIMUM_SOL = 0.00228; // StakeProgram minimum

/**
 * Returns an error string if the split amount is invalid, or null if valid.
 * @param splitSol - The amount to split off (SOL)
 * @param totalSol - The full balance of the source account (SOL)
 */
export function validateSplitAmount(splitSol: number, totalSol: number): string | null {
  if (splitSol <= 0) return "Enter an amount";
  const remaining = totalSol - splitSol;
  if (remaining <= 0) return "Not enough remaining balance";
  if (remaining < RENT_EXEMPT_MINIMUM_SOL) {
    return `Original account must keep at least ${RENT_EXEMPT_MINIMUM_SOL} SOL (rent-exempt minimum)`;
  }
  if (splitSol < RENT_EXEMPT_MINIMUM_SOL) {
    return `New account must have at least ${RENT_EXEMPT_MINIMUM_SOL} SOL (rent-exempt minimum)`;
  }
  return null;
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
cd apps/web && npx vitest run src/lib/split-validation.test.ts
```

Expected: all 4 tests PASS.

- [ ] **Step 5: Create apps/web/src/components/action-panel/SplitTab.tsx**

```tsx
"use client";

import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { buildSplitStakeTransaction } from "pye-stake-utils";
import { useWalletStore } from "@/store/wallet-provider";
import { useStakeStore } from "@/store/stake-provider";
import { useUIStore } from "@/store/ui-provider";
import { Button } from "@/components/ui/button";
import { StateBadge } from "@/components/ui/badge";
import { validateSplitAmount } from "@/lib/split-validation";
import { solToLamports } from "@/lib/format";

const LAMPORTS_PER_SOL = 1_000_000_000;

export default function SplitTab() {
  const { sendTransaction } = useWallet();
  const { connection } = useConnection();

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

  const selectedAccount = stakeAccounts.find((a) => a.pubkey === selectedPubkey) ?? null;

  const monoStyle = {
    fontFeatureSettings: "'cv01' 1,'cv02' 1,'cv03' 1,'cv04' 1,'zero' 1,'lnum' 1,'tnum' 1",
  } as const;

  if (walletStatus !== "connected") {
    return (
      <p className="text-sm text-text-secondary">Connect your wallet to split a stake account.</p>
    );
  }

  if (!selectedAccount) {
    return (
      <p className="text-sm text-text-secondary">Select a stake account from the list.</p>
    );
  }

  const totalSol = selectedAccount.lamports / LAMPORTS_PER_SOL;
  const originalSol = Math.max(0, totalSol - splitSol);
  const validationError = validateSplitAmount(splitSol, totalSol);

  const handleSplit = async () => {
    if (!publicKey || validationError) return;
    setTxStatus("pending");
    try {
      const { transaction, newStakeKeypair } = await buildSplitStakeTransaction({
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
      refresh(connection, new PublicKey(publicKey));
    } catch (err) {
      setTxError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* SOL input */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-text-secondary eyebrow-xs">
          How much SOL goes into the new account?
        </label>
        <div className="relative flex items-center h-11 px-3 rounded-[6px] bg-layers-surface-lowered-1 border-t border-layers-elevation-highlight shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-shadow)]">
          <input
            type="number"
            min="0"
            step="0.001"
            value={splitSol === 0 ? "" : splitSol}
            onChange={(e) => setSplitSol(parseFloat(e.target.value) || 0)}
            placeholder="0"
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-secondary outline-none"
            style={monoStyle}
          />
          <span className="text-sm text-text-secondary shrink-0" style={monoStyle}>SOL</span>
        </div>
        {validationError && splitSol > 0 && (
          <p className="text-xs text-brand-action-red">{validationError}</p>
        )}
      </div>

      {/* Resulting accounts preview */}
      <div className="flex flex-col gap-2">
        <span className="text-xs text-text-secondary eyebrow-xs">Resulting Accounts</span>

        {/* Original account */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-[6px] bg-layers-surface-raised-1 border-t border-layers-elevation-highlight shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-shadow)]">
          {selectedAccount.validatorIcon ? (
            <img src={selectedAccount.validatorIcon} alt={selectedAccount.validatorName} className="size-7 rounded-full border border-layers-elevation-shadow shrink-0" />
          ) : (
            <div className="size-7 rounded-full bg-layers-surface-lowered-2 border border-layers-elevation-shadow flex items-center justify-center shrink-0">
              <span className="text-[10px] text-text-secondary">{selectedAccount.validatorName.slice(0, 2)}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm text-text-primary truncate">{selectedAccount.validatorName}</div>
            <div className="text-xs text-text-secondary">Original account</div>
          </div>
          <div className="flex flex-col items-end gap-0.5 shrink-0">
            <span className="text-sm text-text-primary" style={monoStyle}>
              {originalSol.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })} SOL
            </span>
          </div>
        </div>

        {/* New account */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-[6px] bg-layers-surface-raised-1 border-t border-layers-elevation-highlight shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-shadow)]">
          {selectedAccount.validatorIcon ? (
            <img src={selectedAccount.validatorIcon} alt={selectedAccount.validatorName} className="size-7 rounded-full border border-layers-elevation-shadow shrink-0" />
          ) : (
            <div className="size-7 rounded-full bg-layers-surface-lowered-2 border border-layers-elevation-shadow flex items-center justify-center shrink-0">
              <span className="text-[10px] text-text-secondary">{selectedAccount.validatorName.slice(0, 2)}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm text-text-primary truncate">{selectedAccount.validatorName}</div>
            <div className="text-xs text-brand-action-green">New account</div>
          </div>
          <div className="flex flex-col items-end gap-0.5 shrink-0">
            <span className="text-sm text-text-primary" style={monoStyle}>
              {splitSol.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })} SOL
            </span>
          </div>
        </div>
      </div>

      {/* Alert */}
      <div className="flex gap-2 p-3 rounded-[6px] bg-layers-surface-raised-1 border border-layers-elevation-shadow text-xs text-text-secondary">
        <span className="shrink-0">ℹ</span>
        <span>Both accounts inherit the same validator and activation status. A new stake account address is generated for the split portion.</span>
      </div>

      {/* Tx feedback */}
      {txStatus === "success" && txSignature && (
        <div className="p-3 rounded-[6px] bg-[rgba(13,156,94,0.1)] border border-[rgba(13,156,94,0.3)] text-xs text-brand-action-green flex flex-col gap-1">
          <span className="font-semibold">Split confirmed</span>
          <a href={`https://solscan.io/tx/${txSignature}`} target="_blank" rel="noopener noreferrer" className="underline break-all">
            {txSignature.slice(0, 20)}...
          </a>
          <button onClick={resetTx} className="mt-1 underline text-left">Dismiss</button>
        </div>
      )}
      {txStatus === "error" && txError && (
        <div className="p-3 rounded-[6px] bg-[rgba(229,72,77,0.1)] border border-[rgba(229,72,77,0.3)] text-xs text-brand-action-red">
          <span className="font-semibold">Error: </span>{txError}
          <button onClick={resetTx} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {/* CTA */}
      <Button
        className="w-full"
        onClick={handleSplit}
        disabled={!!validationError || splitSol === 0 || txStatus === "pending"}
      >
        {txStatus === "pending" ? "Splitting..." : "Confirm Split"}
      </Button>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/split-validation.ts apps/web/src/lib/split-validation.test.ts apps/web/src/components/action-panel/SplitTab.tsx
git commit -m "feat: add SplitTab with input, preview, and validation"
```

---

## Task 16: Transfer tab

**Files:**
- Create: `apps/web/src/components/action-panel/TransferTab.tsx`

Allows the user to transfer either the staker authority or the withdraw authority to a new address.

- [ ] **Step 1: Create apps/web/src/components/action-panel/TransferTab.tsx**

```tsx
"use client";

import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  buildTransferStakeAuthorityTransaction,
  buildTransferWithdrawAuthorityTransaction,
} from "pye-stake-utils";
import { useWalletStore } from "@/store/wallet-provider";
import { useStakeStore } from "@/store/stake-provider";
import { useUIStore } from "@/store/ui-provider";
import { Button } from "@/components/ui/button";

type AuthorityType = "stake" | "withdraw";

const AUTHORITY_LABELS: Record<AuthorityType, string> = {
  stake: "Staker Authority",
  withdraw: "Withdraw Authority",
};

const AUTHORITY_DESCRIPTIONS: Record<AuthorityType, string> = {
  stake: "The staker authority can delegate and deactivate this account.",
  withdraw: "The withdraw authority can withdraw lamports from this account when it is inactive.",
};

function isValidPublicKey(key: string): boolean {
  try {
    new PublicKey(key);
    return true;
  } catch {
    return false;
  }
}

export default function TransferTab() {
  const { sendTransaction } = useWallet();
  const { connection } = useConnection();

  const walletStatus = useWalletStore((s) => s.status);
  const publicKey = useWalletStore((s) => s.publicKey);

  const stakeAccounts = useStakeStore((s) => s.stakeAccounts);
  const refresh = useStakeStore((s) => s.refresh);

  const selectedPubkey = useUIStore((s) => s.selectedAccountPubkey);
  const txStatus = useUIStore((s) => s.txStatus);
  const txSignature = useUIStore((s) => s.txSignature);
  const txError = useUIStore((s) => s.txError);
  const setTxStatus = useUIStore((s) => s.setTxStatus);
  const setTxSuccess = useUIStore((s) => s.setTxSuccess);
  const setTxError = useUIStore((s) => s.setTxError);
  const resetTx = useUIStore((s) => s.resetTx);

  const [authorityType, setAuthorityType] = useState<AuthorityType>("stake");
  const [newAuthority, setNewAuthority] = useState("");

  const selectedAccount = stakeAccounts.find((a) => a.pubkey === selectedPubkey) ?? null;

  const addressValid = isValidPublicKey(newAuthority);

  const handleTransfer = async () => {
    if (!selectedAccount || !publicKey || !addressValid) return;
    setTxStatus("pending");
    try {
      const params = {
        connection,
        stakeAccountPubkey: new PublicKey(selectedAccount.pubkey),
        currentAuthorityPubkey: new PublicKey(publicKey),
        newAuthorityPubkey: new PublicKey(newAuthority),
      };
      const tx =
        authorityType === "stake"
          ? await buildTransferStakeAuthorityTransaction(params)
          : await buildTransferWithdrawAuthorityTransaction(params);
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, "confirmed");
      setTxSuccess(sig);
      setNewAuthority("");
      refresh(connection, new PublicKey(publicKey));
    } catch (err) {
      setTxError(err instanceof Error ? err.message : String(err));
    }
  };

  const monoStyle = {
    fontFeatureSettings: "'cv01' 1,'cv02' 1,'cv03' 1,'cv04' 1,'zero' 1,'lnum' 1,'tnum' 1",
  } as const;

  if (walletStatus !== "connected") {
    return <p className="text-sm text-text-secondary">Connect your wallet to transfer authority.</p>;
  }

  if (!selectedAccount) {
    return <p className="text-sm text-text-secondary">Select a stake account from the list.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Authority type selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-text-secondary eyebrow-xs">Authority Type</label>
        <div className="flex gap-2">
          {(["stake", "withdraw"] as AuthorityType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setAuthorityType(type)}
              className={`flex-1 h-9 rounded-[4px] text-sm transition-colors border-t ${
                authorityType === type
                  ? "bg-layers-surface-lowered-2 border-layers-elevation-shadow text-text-primary shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-highlight)]"
                  : "bg-layers-surface-raised-1 border-layers-elevation-highlight text-text-secondary shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-shadow)] hover:text-text-primary"
              }`}
            >
              {AUTHORITY_LABELS[type]}
            </button>
          ))}
        </div>
        <p className="text-xs text-text-secondary">{AUTHORITY_DESCRIPTIONS[authorityType]}</p>
      </div>

      {/* New authority address input */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-text-secondary eyebrow-xs">New Authority Address</label>
        <input
          type="text"
          value={newAuthority}
          onChange={(e) => setNewAuthority(e.target.value)}
          placeholder="Enter Solana address"
          className="h-11 px-3 rounded-[6px] bg-layers-surface-lowered-1 border-t border-layers-elevation-highlight text-sm text-text-primary placeholder:text-text-secondary shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-shadow)] outline-none focus:ring-1 focus:ring-brand-primary-purple"
          style={monoStyle}
        />
        {newAuthority && !addressValid && (
          <p className="text-xs text-brand-action-red">Invalid Solana address</p>
        )}
      </div>

      {/* Warning */}
      <div className="flex gap-2 p-3 rounded-[6px] bg-[rgba(229,72,77,0.08)] border border-[rgba(229,72,77,0.25)] text-xs text-text-secondary">
        <span className="shrink-0">⚠</span>
        <span>
          This action is irreversible. Make sure the new authority address is correct before confirming.
        </span>
      </div>

      {/* Tx feedback */}
      {txStatus === "success" && txSignature && (
        <div className="p-3 rounded-[6px] bg-[rgba(13,156,94,0.1)] border border-[rgba(13,156,94,0.3)] text-xs text-brand-action-green flex flex-col gap-1">
          <span className="font-semibold">Transfer confirmed</span>
          <a href={`https://solscan.io/tx/${txSignature}`} target="_blank" rel="noopener noreferrer" className="underline break-all">
            {txSignature.slice(0, 20)}...
          </a>
          <button onClick={resetTx} className="mt-1 underline text-left">Dismiss</button>
        </div>
      )}
      {txStatus === "error" && txError && (
        <div className="p-3 rounded-[6px] bg-[rgba(229,72,77,0.1)] border border-[rgba(229,72,77,0.3)] text-xs text-brand-action-red">
          <span className="font-semibold">Error: </span>{txError}
          <button onClick={resetTx} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {/* CTA */}
      <Button
        className="w-full"
        onClick={handleTransfer}
        disabled={!addressValid || !newAuthority || txStatus === "pending"}
      >
        {txStatus === "pending" ? "Transferring..." : `Transfer ${AUTHORITY_LABELS[authorityType]}`}
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/action-panel/TransferTab.tsx
git commit -m "feat: add TransferTab for stake and withdraw authority transfers"
```

---

## Task 17: Main page composition

**Files:**
- Create: `apps/web/src/app/page.tsx`

- [ ] **Step 1: Create apps/web/src/app/page.tsx**

```tsx
import Header from "@/components/Header";
import StakeSyncer from "@/components/StakeSyncer";
import StakeAccountList from "@/components/stake-list/StakeAccountList";
import ActionPanel from "@/components/action-panel/ActionPanel";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-layers-base-primary">
      <StakeSyncer />
      <Header />
      <main className="flex-1 flex flex-col px-4 py-6">
        {/* Page title */}
        <h1
          className="text-[32px] text-text-primary mb-6"
          style={{ fontFamily: "var(--font-garamond), serif", fontWeight: 300 }}
        >
          Manage Stake
        </h1>

        {/* Two-column layout */}
        <div className="flex gap-4 flex-1 min-h-0">
          {/* Left — account list */}
          <div className="w-[420px] shrink-0 min-h-[500px]">
            <StakeAccountList />
          </div>

          {/* Right — action panel */}
          <div className="flex-1 min-h-[500px]">
            <ActionPanel />
          </div>
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Start the dev server and verify it loads**

```bash
cd apps/web && cp .env.local.example .env.local
npm run dev
```

Open `http://localhost:3000`. Expected:
- Page loads with header and two-column layout
- "Connect Wallet" button visible in header and in State Change tab
- No console errors (warnings about wallet adapter SSR are acceptable)

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/page.tsx apps/web/.env.local.example
git commit -m "feat: compose main page with two-column layout"
```

---

## Task 18: Run all tests

- [ ] **Step 1: Run the full test suite**

```bash
cd apps/web && npx vitest run
```

Expected output — all tests pass:
```
✓ src/lib/format.test.ts (4 tests)
✓ src/lib/split-validation.test.ts (4 tests)
✓ src/store/ui-store.test.ts (8 tests)

Test Files  3 passed (3)
Tests       16 passed (16)
```

- [ ] **Step 2: Run type-check**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete stakeutils.com frontend scaffold with all tests passing"
```

---

## Self-Review

### Spec coverage check

| Figma requirement | Task covering it |
|---|---|
| Two-column layout (list + action panel) | Task 17 |
| Stake account list with radio selection | Task 12 |
| Pagination (1–8 of N) | Task 12 |
| Validator icon, name, SOL, state badge in row | Task 12 |
| State Change / Split / Transfer tab group | Task 13 |
| Animated tab underline | Task 13 |
| "Connect wallet" state (no wallet) | Task 14 |
| Active account → red "Deactivate Stake" button | Task 14 |
| Inactive account → purple "Activate Stake" + vote account input | Task 14 |
| Epoch boundary alert box | Task 14 |
| SOL input for split | Task 15 |
| Resulting accounts preview (original + new) | Task 15 |
| Disabled "Confirm Split" button when 0 SOL | Task 15 |
| Split validation (rent-exempt minimum) | Task 15 |
| Transfer authority tab with address input | Task 16 |
| Transaction success/error feedback | Tasks 14–16 |
| Header with wallet button + dark mode toggle | Task 10 |
| Same design tokens as pye-frontend-v2 | Task 2 |
| Garamond heading font | Tasks 2, 8, 17 |

### Placeholder scan

No TBD or placeholder content found. All steps contain actual code.

### Type consistency

- `StakeAccount`, `StakeAccountState`, `createStakeStore`, `StakeStore` — all imported from `pye-stake-utils`, consistent throughout Tasks 6, 9, 12, 14, 15, 16.
- `UIStore`, `Tab`, `TxStatus` — defined in Task 4, used via `useUIStore` hook from Task 7, consistent throughout Tasks 13–16.
- `WalletStore` — defined in Task 5, used via `useWalletStore` from Task 5, consistent throughout Tasks 10–16.
- `buildDeactivateStakeTransaction`, `buildDelegateStakeTransaction`, `buildSplitStakeTransaction`, `buildTransferStakeAuthorityTransaction`, `buildTransferWithdrawAuthorityTransaction` — all exported from root SDK `src/index.ts`, used in Tasks 14–16 with matching parameter shapes from `split-stake.ts`.
