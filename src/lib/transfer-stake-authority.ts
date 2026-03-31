import {
  Connection,
  PublicKey,
  StakeProgram,
  Transaction,
  ComputeBudgetProgram,
} from "@solana/web3.js";

export interface TransferStakeAuthorityParams {
  connection: Connection;
  /** The stake account to update */
  stakeAccountPubkey: PublicKey;
  /** The current staker authority (must sign) */
  currentAuthorityPubkey: PublicKey;
  /** The new staker authority */
  newAuthorityPubkey: PublicKey;
}

export interface TransferStakeAuthorityResult {
  transaction: Transaction;
}

/**
 * Build a transaction that reassigns the staker authority on a stake account.
 */
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
      stakeAuthorizationType: { index: 0 }, // 0 = staker, 1 = withdrawer
    }),
  );

  return { transaction: tx };
}
