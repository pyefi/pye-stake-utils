# pye-stake-utils

Swiss Army knife for Solana native stake account operations.

## Features

- **Detect** — Fetch all stake accounts owned by a wallet, with validator metadata resolution and epoch-aware state detection (active, activating, deactivating, inactive)
- **Split** — Split a stake account into two, moving a specified lamport amount to a new account
- **Merge** — Merge two stake accounts into one (same validator, same authorities, same state)
- **Delegate** — Delegate (activate) a stake account to a validator
- **Deactivate** — Begin deactivation of a stake account
- **Withdraw** — Withdraw SOL from a deactivated stake account
- **Transfer Withdraw Authority** — Reassign the withdraw authority to a new public key
- **Transfer Stake Authority** — Reassign the staker authority to a new public key

## Installation

```bash
npm install
```

## Project Structure

```
src/
├── types/          # StakeAccount, StakeAccountState, Validator types
├── constants/      # Stake program ID, sysvars
├── store/          # Zustand store with fetch-on-mount and post-tx refresh
└── lib/            # Transaction builders for each stake operation
```

## Usage

All lib functions return **unsigned transactions** — the caller is responsible for signing and sending. This keeps the library wallet-agnostic.

### Fetch stake accounts

```ts
import { Connection, PublicKey } from "@solana/web3.js";
import { fetchStakeAccounts } from "pye-stake-utils";

const connection = new Connection("https://api.mainnet-beta.solana.com");
const owner = new PublicKey("...");

const accounts = await fetchStakeAccounts(connection, owner);
// Returns: StakeAccount[] with pubkey, validator info, lamports, state
```

### Split a stake account

```ts
import { buildSplitStakeTransaction } from "pye-stake-utils";

const { transaction, newStakeKeypair } = await buildSplitStakeTransaction({
  connection,
  stakeAccountPubkey: existingStakeAccount,
  authorizedPubkey: wallet.publicKey,
  splitLamports: 1_000_000_000, // 1 SOL
});
// Sign with wallet + newStakeKeypair, then send
```

### Merge stake accounts

```ts
import { buildMergeStakeTransaction } from "pye-stake-utils";

const { transaction } = await buildMergeStakeTransaction({
  connection,
  destinationStakePubkey,
  sourceStakePubkey,
  authorizedPubkey: wallet.publicKey,
});
```

### Transfer withdraw authority

```ts
import { buildTransferWithdrawAuthorityTransaction } from "pye-stake-utils";

const { transaction } = await buildTransferWithdrawAuthorityTransaction({
  connection,
  stakeAccountPubkey,
  currentAuthorityPubkey: wallet.publicKey,
  newAuthorityPubkey: new PublicKey("..."),
});
```

### Store with auto-refresh

```ts
import { createStakeStore } from "pye-stake-utils";

const store = createStakeStore();

// Initial fetch (shows loading spinner)
await store.getState().refresh(connection, owner);

// Post-transaction refresh (no spinner, silent update)
await store.getState().refresh(connection, owner);

// Access state
const { stakeAccounts, loading, error } = store.getState();
```

## Dependencies

- `@solana/web3.js` — Solana SDK
- `@solana/spl-token` — SPL Token utilities
- `zustand` — State management
