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
