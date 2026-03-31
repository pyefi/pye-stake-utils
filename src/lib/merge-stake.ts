import {
  Connection,
  PublicKey,
  StakeProgram,
  Transaction,
  ComputeBudgetProgram,
} from "@solana/web3.js";

export interface MergeStakeParams {
  connection: Connection;
  /** The destination stake account (receives the merged stake) */
  destinationStakePubkey: PublicKey;
  /** The source stake account (will be consumed/closed) */
  sourceStakePubkey: PublicKey;
  /** The authorized staker (must sign) */
  authorizedPubkey: PublicKey;
}

export interface MergeStakeResult {
  transaction: Transaction;
}

/**
 * Build a transaction that merges two stake accounts.
 * Both accounts must share the same validator, withdraw authority, and staker authority.
 * Both must be in the same state (both active or both inactive).
 * The source account is consumed and its lamports move to the destination.
 */
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
