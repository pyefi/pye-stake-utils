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
