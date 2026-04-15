# Inline pye-stake-utils into apps/web Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move all types, constants, store, and operation functions from the `src/` package directly into `apps/web/src/`, eliminating the `pye-stake-utils` local dependency and the webpack `extensionAlias` workaround.

**Architecture:** Create a `lib/types/`, `lib/stake-ops/`, and `store/stake-store.ts` inside `apps/web/src/`, copy the source verbatim with adjusted internal imports, then update the six consumer files to point at the new local paths. Remove the package dependency last once all imports compile.

**Tech Stack:** Next.js 15 App Router, TypeScript, Zustand (vanilla), `@solana/web3.js`

---

## File Map

Files created:
- `apps/web/src/lib/types/stake.ts` — `StakeAccount`, `StakeAccountState`
- `apps/web/src/lib/types/validator.ts` — `Validator`, `ValidatorId`
- `apps/web/src/lib/types/index.ts` — re-exports
- `apps/web/src/lib/stake-constants.ts` — 5 Solana program `PublicKey` constants
- `apps/web/src/lib/stake-ops/fetch-stake-accounts.ts`
- `apps/web/src/lib/stake-ops/delegate-stake.ts`
- `apps/web/src/lib/stake-ops/split-stake.ts`
- `apps/web/src/lib/stake-ops/merge-stake.ts`
- `apps/web/src/lib/stake-ops/deactivate-stake.ts`
- `apps/web/src/lib/stake-ops/withdraw-stake.ts`
- `apps/web/src/lib/stake-ops/transfer-stake-authority.ts`
- `apps/web/src/lib/stake-ops/transfer-withdraw-authority.ts`
- `apps/web/src/lib/stake-ops/index.ts` — re-exports
- `apps/web/src/store/stake-store.ts` — `createStakeStore`, `StakeStore`, `StakeState`, `StakeActions`

Files modified:
- `apps/web/src/store/stake-provider.tsx` — swap imports from `pye-stake-utils` → `@/store/stake-store`
- `apps/web/src/components/ui/badge.tsx` — swap `pye-stake-utils` → `@/lib/types`
- `apps/web/src/components/stake-list/StakeAccountRow.tsx` — swap `pye-stake-utils` → `@/lib/types`
- `apps/web/src/components/action-panel/StateChangeTab.tsx` — swap `pye-stake-utils` → `@/lib/stake-ops`
- `apps/web/src/components/action-panel/SplitTab.tsx` — swap `pye-stake-utils` → `@/lib/stake-ops`
- `apps/web/src/components/action-panel/TransferTab.tsx` — swap `pye-stake-utils` → `@/lib/stake-ops`
- `apps/web/package.json` — remove `pye-stake-utils` dependency
- `apps/web/next.config.ts` — remove `transpilePackages` and `webpack` extensionAlias workaround

---

## Task 1: Create types

**Files:**
- Create: `apps/web/src/lib/types/stake.ts`
- Create: `apps/web/src/lib/types/validator.ts`
- Create: `apps/web/src/lib/types/index.ts`

- [ ] **Step 1: Create stake.ts**

```typescript
// apps/web/src/lib/types/stake.ts
export type StakeAccountState =
  | "active"
  | "activating"
  | "deactivating"
  | "inactive";

export interface StakeAccount {
  pubkey: string;
  validatorVoteAccount: string;
  validatorName: string;
  validatorIcon: string;
  lamports: number;
  state: StakeAccountState;
}
```

- [ ] **Step 2: Create validator.ts**

```typescript
// apps/web/src/lib/types/validator.ts
export interface Validator {
  name: string;
  symbol: string;
  vote_account: string;
  pt_sol: string;
  rt_sol: string;
  is_allowed: boolean;
  type: "validator" | "lst";
}

export type ValidatorId = string;
```

- [ ] **Step 3: Create index.ts**

```typescript
// apps/web/src/lib/types/index.ts
export type { StakeAccount, StakeAccountState } from "./stake";
export type { Validator, ValidatorId } from "./validator";
```

- [ ] **Step 4: Typecheck**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: same errors as before (unchanged — no consumers updated yet)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/types/
git commit -m "feat(web): add inline stake/validator types"
```

---

## Task 2: Create stake constants

**Files:**
- Create: `apps/web/src/lib/stake-constants.ts`

- [ ] **Step 1: Create stake-constants.ts**

```typescript
// apps/web/src/lib/stake-constants.ts
import { PublicKey } from "@solana/web3.js";

export const STAKE_PROGRAM_ID = new PublicKey(
  "Stake11111111111111111111111111111111111111",
);

export const SYSVAR_CLOCK = new PublicKey(
  "SysvarC1ock11111111111111111111111111111111",
);

export const SYSVAR_RENT = new PublicKey(
  "SysvarRent111111111111111111111111111111111",
);

export const SYSVAR_STAKE_HISTORY = new PublicKey(
  "SysvarStakeHistory1111111111111111111111111",
);

export const STAKE_CONFIG = new PublicKey(
  "StakeConfig11111111111111111111111111111111",
);
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/lib/stake-constants.ts
git commit -m "feat(web): add inline stake program constants"
```

---

## Task 3: Create stake-ops library

**Files:**
- Create: `apps/web/src/lib/stake-ops/fetch-stake-accounts.ts`
- Create: `apps/web/src/lib/stake-ops/delegate-stake.ts`
- Create: `apps/web/src/lib/stake-ops/split-stake.ts`
- Create: `apps/web/src/lib/stake-ops/merge-stake.ts`
- Create: `apps/web/src/lib/stake-ops/deactivate-stake.ts`
- Create: `apps/web/src/lib/stake-ops/withdraw-stake.ts`
- Create: `apps/web/src/lib/stake-ops/transfer-stake-authority.ts`
- Create: `apps/web/src/lib/stake-ops/transfer-withdraw-authority.ts`
- Create: `apps/web/src/lib/stake-ops/index.ts`

- [ ] **Step 1: Create fetch-stake-accounts.ts**

```typescript
// apps/web/src/lib/stake-ops/fetch-stake-accounts.ts
import { Connection, PublicKey } from "@solana/web3.js";
import { STAKE_PROGRAM_ID } from "@/lib/stake-constants";
import type { StakeAccount, StakeAccountState } from "@/lib/types";

export async function fetchStakeAccounts(
  connection: Connection,
  owner: PublicKey,
  validatorMap?: Map<string, { name: string; icon: string }>,
): Promise<StakeAccount[]> {
  const ownerBytes = owner.toBase58();
  const [stakerAccounts, withdrawerAccounts, epochInfo] = await Promise.all([
    connection.getParsedProgramAccounts(STAKE_PROGRAM_ID, {
      filters: [{ memcmp: { offset: 12, bytes: ownerBytes } }],
    }),
    connection.getParsedProgramAccounts(STAKE_PROGRAM_ID, {
      filters: [{ memcmp: { offset: 44, bytes: ownerBytes } }],
    }),
    connection.getEpochInfo(),
  ]);

  const seen = new Map([
    ...stakerAccounts.map((a) => [a.pubkey.toBase58(), a] as const),
    ...withdrawerAccounts.map((a) => [a.pubkey.toBase58(), a] as const),
  ]);
  const accounts = [...seen.values()];

  const currentEpoch = BigInt(epochInfo.epoch);
  const U64_MAX = BigInt("18446744073709551615");

  const results: StakeAccount[] = [];

  for (const { pubkey, account } of accounts) {
    const parsed = (
      account.data as {
        parsed?: {
          info?: {
            stake?: {
              delegation?: {
                voter?: string;
                stake?: string;
                activationEpoch?: string;
                deactivationEpoch?: string;
              };
            };
          };
        };
      }
    ).parsed;
    const delegation = parsed?.info?.stake?.delegation;
    if (!delegation?.voter) continue;

    const activationEpoch = BigInt(delegation.activationEpoch ?? "0");
    const deactivationEpoch = BigInt(
      delegation.deactivationEpoch ?? U64_MAX.toString(),
    );

    let state: StakeAccountState;
    if (deactivationEpoch < currentEpoch) {
      state = "inactive";
    } else if (deactivationEpoch === currentEpoch) {
      state = "deactivating";
    } else if (activationEpoch === currentEpoch) {
      state = "activating";
    } else {
      state = "active";
    }

    const validatorInfo = validatorMap?.get(delegation.voter);

    results.push({
      pubkey: pubkey.toBase58(),
      validatorVoteAccount: delegation.voter,
      validatorName: validatorInfo?.name ?? "Unknown Validator",
      validatorIcon: validatorInfo?.icon ?? "",
      lamports: Number(delegation.stake ?? account.lamports),
      state,
    });
  }

  return results;
}
```

- [ ] **Step 2: Create delegate-stake.ts**

```typescript
// apps/web/src/lib/stake-ops/delegate-stake.ts
import {
  Connection,
  PublicKey,
  StakeProgram,
  Transaction,
  ComputeBudgetProgram,
} from "@solana/web3.js";

export interface DelegateStakeParams {
  connection: Connection;
  stakeAccountPubkey: PublicKey;
  authorizedPubkey: PublicKey;
  votePubkey: PublicKey;
}

export interface DelegateStakeResult {
  transaction: Transaction;
}

export async function buildDelegateStakeTransaction({
  connection,
  stakeAccountPubkey,
  authorizedPubkey,
  votePubkey,
}: DelegateStakeParams): Promise<DelegateStakeResult> {
  const latestBlockhash = await connection.getLatestBlockhash("confirmed");

  const tx = new Transaction();
  tx.recentBlockhash = latestBlockhash.blockhash;
  tx.feePayer = authorizedPubkey;

  tx.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }));
  tx.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1_000 }));
  tx.add(
    StakeProgram.delegate({
      stakePubkey: stakeAccountPubkey,
      authorizedPubkey,
      votePubkey,
    }),
  );

  return { transaction: tx };
}
```

- [ ] **Step 3: Create split-stake.ts**

```typescript
// apps/web/src/lib/stake-ops/split-stake.ts
import {
  Connection,
  Keypair,
  PublicKey,
  StakeProgram,
  Transaction,
  ComputeBudgetProgram,
} from "@solana/web3.js";

export interface SplitStakeParams {
  connection: Connection;
  stakeAccountPubkey: PublicKey;
  authorizedPubkey: PublicKey;
  splitLamports: number;
}

export interface SplitStakeResult {
  transaction: Transaction;
  newStakeKeypair: Keypair;
}

export async function buildSplitStakeTransaction({
  connection,
  stakeAccountPubkey,
  authorizedPubkey,
  splitLamports,
}: SplitStakeParams): Promise<SplitStakeResult> {
  const newStakeKeypair = Keypair.generate();

  const [rentExemptReserve, latestBlockhash] = await Promise.all([
    connection.getMinimumBalanceForRentExemption(StakeProgram.space),
    connection.getLatestBlockhash("confirmed"),
  ]);

  const tx = new Transaction();
  tx.recentBlockhash = latestBlockhash.blockhash;
  tx.feePayer = authorizedPubkey;

  tx.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }));
  tx.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1_000 }));
  tx.add(
    StakeProgram.split(
      {
        stakePubkey: stakeAccountPubkey,
        authorizedPubkey,
        splitStakePubkey: newStakeKeypair.publicKey,
        lamports: splitLamports,
      },
      rentExemptReserve,
    ),
  );

  return { transaction: tx, newStakeKeypair };
}
```

- [ ] **Step 4: Create merge-stake.ts**

```typescript
// apps/web/src/lib/stake-ops/merge-stake.ts
import {
  Connection,
  PublicKey,
  StakeProgram,
  Transaction,
  ComputeBudgetProgram,
} from "@solana/web3.js";

export interface MergeStakeParams {
  connection: Connection;
  destinationStakePubkey: PublicKey;
  sourceStakePubkey: PublicKey;
  authorizedPubkey: PublicKey;
}

export interface MergeStakeResult {
  transaction: Transaction;
}

export async function buildMergeStakeTransaction({
  connection,
  destinationStakePubkey,
  sourceStakePubkey,
  authorizedPubkey,
}: MergeStakeParams): Promise<MergeStakeResult> {
  const latestBlockhash = await connection.getLatestBlockhash("confirmed");

  const tx = new Transaction();
  tx.recentBlockhash = latestBlockhash.blockhash;
  tx.feePayer = authorizedPubkey;

  tx.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }));
  tx.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1_000 }));
  tx.add(
    StakeProgram.merge({
      stakePubkey: destinationStakePubkey,
      sourceStakePubKey: sourceStakePubkey,
      authorizedPubkey,
    }),
  );

  return { transaction: tx };
}
```

- [ ] **Step 5: Create deactivate-stake.ts**

```typescript
// apps/web/src/lib/stake-ops/deactivate-stake.ts
import {
  Connection,
  PublicKey,
  StakeProgram,
  Transaction,
  ComputeBudgetProgram,
} from "@solana/web3.js";

export interface DeactivateStakeParams {
  connection: Connection;
  stakeAccountPubkey: PublicKey;
  authorizedPubkey: PublicKey;
}

export interface DeactivateStakeResult {
  transaction: Transaction;
}

export async function buildDeactivateStakeTransaction({
  connection,
  stakeAccountPubkey,
  authorizedPubkey,
}: DeactivateStakeParams): Promise<DeactivateStakeResult> {
  const latestBlockhash = await connection.getLatestBlockhash("confirmed");

  const tx = new Transaction();
  tx.recentBlockhash = latestBlockhash.blockhash;
  tx.feePayer = authorizedPubkey;

  tx.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }));
  tx.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1_000 }));
  tx.add(
    StakeProgram.deactivate({
      stakePubkey: stakeAccountPubkey,
      authorizedPubkey,
    }),
  );

  return { transaction: tx };
}
```

- [ ] **Step 6: Create withdraw-stake.ts**

```typescript
// apps/web/src/lib/stake-ops/withdraw-stake.ts
import {
  Connection,
  PublicKey,
  StakeProgram,
  Transaction,
  ComputeBudgetProgram,
} from "@solana/web3.js";

export interface WithdrawStakeParams {
  connection: Connection;
  stakeAccountPubkey: PublicKey;
  authorizedPubkey: PublicKey;
  toPubkey: PublicKey;
  lamports: number;
}

export interface WithdrawStakeResult {
  transaction: Transaction;
}

export async function buildWithdrawStakeTransaction({
  connection,
  stakeAccountPubkey,
  authorizedPubkey,
  toPubkey,
  lamports,
}: WithdrawStakeParams): Promise<WithdrawStakeResult> {
  const latestBlockhash = await connection.getLatestBlockhash("confirmed");

  const tx = new Transaction();
  tx.recentBlockhash = latestBlockhash.blockhash;
  tx.feePayer = authorizedPubkey;

  tx.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }));
  tx.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1_000 }));
  tx.add(
    StakeProgram.withdraw({
      stakePubkey: stakeAccountPubkey,
      authorizedPubkey,
      toPubkey,
      lamports,
    }),
  );

  return { transaction: tx };
}
```

- [ ] **Step 7: Create transfer-stake-authority.ts**

```typescript
// apps/web/src/lib/stake-ops/transfer-stake-authority.ts
import {
  Connection,
  PublicKey,
  StakeProgram,
  Transaction,
  ComputeBudgetProgram,
} from "@solana/web3.js";

export interface TransferStakeAuthorityParams {
  connection: Connection;
  stakeAccountPubkey: PublicKey;
  currentAuthorityPubkey: PublicKey;
  newAuthorityPubkey: PublicKey;
}

export interface TransferStakeAuthorityResult {
  transaction: Transaction;
}

export async function buildTransferStakeAuthorityTransaction({
  connection,
  stakeAccountPubkey,
  currentAuthorityPubkey,
  newAuthorityPubkey,
}: TransferStakeAuthorityParams): Promise<TransferStakeAuthorityResult> {
  const latestBlockhash = await connection.getLatestBlockhash("confirmed");

  const tx = new Transaction();
  tx.recentBlockhash = latestBlockhash.blockhash;
  tx.feePayer = currentAuthorityPubkey;

  tx.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }));
  tx.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1_000 }));
  tx.add(
    StakeProgram.authorize({
      stakePubkey: stakeAccountPubkey,
      authorizedPubkey: currentAuthorityPubkey,
      newAuthorizedPubkey: newAuthorityPubkey,
      stakeAuthorizationType: { index: 0 }, // 0 = staker
    }),
  );

  return { transaction: tx };
}
```

- [ ] **Step 8: Create transfer-withdraw-authority.ts**

```typescript
// apps/web/src/lib/stake-ops/transfer-withdraw-authority.ts
import {
  Connection,
  PublicKey,
  StakeProgram,
  Transaction,
  ComputeBudgetProgram,
} from "@solana/web3.js";

export interface TransferWithdrawAuthorityParams {
  connection: Connection;
  stakeAccountPubkey: PublicKey;
  currentAuthorityPubkey: PublicKey;
  newAuthorityPubkey: PublicKey;
}

export interface TransferWithdrawAuthorityResult {
  transaction: Transaction;
}

export async function buildTransferWithdrawAuthorityTransaction({
  connection,
  stakeAccountPubkey,
  currentAuthorityPubkey,
  newAuthorityPubkey,
}: TransferWithdrawAuthorityParams): Promise<TransferWithdrawAuthorityResult> {
  const latestBlockhash = await connection.getLatestBlockhash("confirmed");

  const tx = new Transaction();
  tx.recentBlockhash = latestBlockhash.blockhash;
  tx.feePayer = currentAuthorityPubkey;

  tx.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }));
  tx.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1_000 }));
  tx.add(
    StakeProgram.authorize({
      stakePubkey: stakeAccountPubkey,
      authorizedPubkey: currentAuthorityPubkey,
      newAuthorizedPubkey: newAuthorityPubkey,
      stakeAuthorizationType: { index: 1 }, // 1 = withdrawer
    }),
  );

  return { transaction: tx };
}
```

- [ ] **Step 9: Create index.ts**

```typescript
// apps/web/src/lib/stake-ops/index.ts
export { fetchStakeAccounts } from "./fetch-stake-accounts";
export { buildDelegateStakeTransaction } from "./delegate-stake";
export type { DelegateStakeParams, DelegateStakeResult } from "./delegate-stake";
export { buildSplitStakeTransaction } from "./split-stake";
export type { SplitStakeParams, SplitStakeResult } from "./split-stake";
export { buildMergeStakeTransaction } from "./merge-stake";
export type { MergeStakeParams, MergeStakeResult } from "./merge-stake";
export { buildDeactivateStakeTransaction } from "./deactivate-stake";
export type { DeactivateStakeParams, DeactivateStakeResult } from "./deactivate-stake";
export { buildWithdrawStakeTransaction } from "./withdraw-stake";
export type { WithdrawStakeParams, WithdrawStakeResult } from "./withdraw-stake";
export { buildTransferStakeAuthorityTransaction } from "./transfer-stake-authority";
export type { TransferStakeAuthorityParams, TransferStakeAuthorityResult } from "./transfer-stake-authority";
export { buildTransferWithdrawAuthorityTransaction } from "./transfer-withdraw-authority";
export type { TransferWithdrawAuthorityParams, TransferWithdrawAuthorityResult } from "./transfer-withdraw-authority";
```

- [ ] **Step 10: Commit**

```bash
git add apps/web/src/lib/stake-ops/ apps/web/src/lib/stake-constants.ts
git commit -m "feat(web): add inline stake-ops library"
```

---

## Task 4: Create stake-store.ts

**Files:**
- Create: `apps/web/src/store/stake-store.ts`

- [ ] **Step 1: Create stake-store.ts**

```typescript
// apps/web/src/store/stake-store.ts
import { createStore } from "zustand/vanilla";
import { Connection, PublicKey } from "@solana/web3.js";
import { fetchStakeAccounts } from "@/lib/stake-ops";
import type { StakeAccount } from "@/lib/types";

export interface StakeState {
  stakeAccounts: StakeAccount[];
  loading: boolean;
  error: string | null;
  lastFetchedAt: number | null;
}

export interface StakeActions {
  setStakeAccounts: (accounts: StakeAccount[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  refresh: (
    connection: Connection,
    owner: PublicKey,
    validatorMap?: Map<string, { name: string; icon: string }>,
  ) => Promise<void>;
  reset: () => void;
}

export type StakeStore = StakeState & StakeActions;

const initialState: StakeState = {
  stakeAccounts: [],
  loading: false,
  error: null,
  lastFetchedAt: null,
};

export function createStakeStore() {
  return createStore<StakeStore>()((set, get) => ({
    ...initialState,

    setStakeAccounts(accounts) {
      set({ stakeAccounts: accounts, lastFetchedAt: Date.now() });
    },

    setLoading(loading) {
      set({ loading });
    },

    setError(error) {
      set({ error });
    },

    async refresh(connection, owner, validatorMap) {
      if (get().stakeAccounts.length === 0) {
        set({ loading: true });
      }
      try {
        const accounts = await fetchStakeAccounts(connection, owner, validatorMap);
        set({ stakeAccounts: accounts, error: null, lastFetchedAt: Date.now() });
      } catch (err) {
        set({ error: err instanceof Error ? err.message : String(err) });
      } finally {
        set({ loading: false });
      }
    },

    reset() {
      set(initialState);
    },
  }));
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/store/stake-store.ts
git commit -m "feat(web): add inline stake store"
```

---

## Task 5: Update stake-provider.tsx

**Files:**
- Modify: `apps/web/src/store/stake-provider.tsx`

- [ ] **Step 1: Replace pye-stake-utils imports**

In `apps/web/src/store/stake-provider.tsx`, replace:

```typescript
import { createStakeStore } from "pye-stake-utils";
import type { StakeStore } from "pye-stake-utils";
```

With:

```typescript
import { createStakeStore } from "@/store/stake-store";
import type { StakeStore } from "@/store/stake-store";
```

- [ ] **Step 2: Typecheck**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: errors only from the remaining `pye-stake-utils` imports in components (not from stake-provider.tsx)

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/store/stake-provider.tsx
git commit -m "feat(web): migrate stake-provider to inline store"
```

---

## Task 6: Update UI component imports

**Files:**
- Modify: `apps/web/src/components/ui/badge.tsx`
- Modify: `apps/web/src/components/stake-list/StakeAccountRow.tsx`

- [ ] **Step 1: Update badge.tsx**

In `apps/web/src/components/ui/badge.tsx`, replace:

```typescript
import type { StakeAccountState } from "pye-stake-utils";
```

With:

```typescript
import type { StakeAccountState } from "@/lib/types";
```

- [ ] **Step 2: Update StakeAccountRow.tsx**

In `apps/web/src/components/stake-list/StakeAccountRow.tsx`, replace:

```typescript
import type { StakeAccount } from "pye-stake-utils";
```

With:

```typescript
import type { StakeAccount } from "@/lib/types";
```

- [ ] **Step 3: Typecheck**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: errors only from action-panel components

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/ui/badge.tsx apps/web/src/components/stake-list/StakeAccountRow.tsx
git commit -m "feat(web): migrate ui components to inline types"
```

---

## Task 7: Update action-panel imports

**Files:**
- Modify: `apps/web/src/components/action-panel/StateChangeTab.tsx`
- Modify: `apps/web/src/components/action-panel/SplitTab.tsx`
- Modify: `apps/web/src/components/action-panel/TransferTab.tsx`

- [ ] **Step 1: Update StateChangeTab.tsx**

In `apps/web/src/components/action-panel/StateChangeTab.tsx`, replace:

```typescript
import {
  buildDeactivateStakeTransaction,
  buildDelegateStakeTransaction,
} from "pye-stake-utils";
```

With:

```typescript
import {
  buildDeactivateStakeTransaction,
  buildDelegateStakeTransaction,
} from "@/lib/stake-ops";
```

- [ ] **Step 2: Update SplitTab.tsx**

In `apps/web/src/components/action-panel/SplitTab.tsx`, replace:

```typescript
import { buildSplitStakeTransaction } from "pye-stake-utils";
```

With:

```typescript
import { buildSplitStakeTransaction } from "@/lib/stake-ops";
```

- [ ] **Step 3: Update TransferTab.tsx**

In `apps/web/src/components/action-panel/TransferTab.tsx`, replace:

```typescript
import {
  buildTransferStakeAuthorityTransaction,
  buildTransferWithdrawAuthorityTransaction,
} from "pye-stake-utils";
```

With:

```typescript
import {
  buildTransferStakeAuthorityTransaction,
  buildTransferWithdrawAuthorityTransaction,
} from "@/lib/stake-ops";
```

- [ ] **Step 4: Typecheck — must be clean**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: **zero errors**

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/action-panel/
git commit -m "feat(web): migrate action-panel components to inline stake-ops"
```

---

## Task 8: Remove pye-stake-utils dependency and clean up config

**Files:**
- Modify: `apps/web/package.json`
- Modify: `apps/web/next.config.ts`

- [ ] **Step 1: Remove dependency from apps/web/package.json**

In `apps/web/package.json`, remove the line:

```json
"pye-stake-utils": "file:../..",
```

- [ ] **Step 2: Revert next.config.ts to clean state**

Replace the full content of `apps/web/next.config.ts` with:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
};

export default nextConfig;
```

- [ ] **Step 3: Reinstall dependencies**

```bash
cd apps/web && pnpm install
```

Expected: pnpm removes `pye-stake-utils` from node_modules

- [ ] **Step 4: Typecheck — still clean**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: zero errors

- [ ] **Step 5: Commit**

```bash
git add apps/web/package.json apps/web/next.config.ts
git commit -m "chore(web): remove pye-stake-utils dependency, clean up next.config"
```

---

## Task 9: Verify build and dev server

- [ ] **Step 1: Build**

```bash
cd apps/web && pnpm build
```

Expected: exits 0, no module-not-found errors

- [ ] **Step 2: Start dev server**

```bash
cd apps/web && pnpm dev
```

Open `http://localhost:3000` in a browser.

- [ ] **Step 3: Manual smoke test checklist**

- [ ] Page loads without console errors
- [ ] Wallet connect button is visible
- [ ] Connect a wallet (or observe the UI in disconnected state)
- [ ] If connected: stake accounts load in the list
- [ ] Selecting an account shows action panel tabs (State Change, Split, Transfer)
- [ ] Each tab renders without errors

- [ ] **Step 4: Final commit**

```bash
git add -p  # stage any incidental changes
git commit -m "chore(web): verify inline stake-utils migration complete"
```
