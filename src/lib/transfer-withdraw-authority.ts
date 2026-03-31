import {
  Connection,
  PublicKey,
  StakeProgram,
  Transaction,
  ComputeBudgetProgram,
} from "@solana/web3.js";

export interface TransferWithdrawAuthorityParams {
  connection: Connection;
  /** The stake account to update */
  stakeAccountPubkey: PublicKey;
  /** The current withdraw authority (must sign) */
  currentAuthorityPubkey: PublicKey;
  /** The new withdraw authority */
  newAuthorityPubkey: PublicKey;
}

export interface TransferWithdrawAuthorityResult {
  transaction: Transaction;
}

/**
 * Build a transaction that reassigns the withdraw authority on a stake account.
 */
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
      stakeAuthorizationType: { index: 1 }, // 0 = staker, 1 = withdrawer
    }),
  );

  return { transaction: tx };
}
