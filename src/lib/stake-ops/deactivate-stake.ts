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
