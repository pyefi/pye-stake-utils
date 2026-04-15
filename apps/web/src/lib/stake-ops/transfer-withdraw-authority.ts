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
