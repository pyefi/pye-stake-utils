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
