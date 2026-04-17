import {
  Connection,
  PublicKey,
  StakeProgram,
  Transaction,
  ComputeBudgetProgram,
} from "@solana/web3.js";

export interface TransferBothAuthoritiesParams {
  connection: Connection;
  stakeAccountPubkey: PublicKey;
  currentAuthorityPubkey: PublicKey;
  newAuthorityPubkey: PublicKey;
}

export interface TransferBothAuthoritiesResult {
  transaction: Transaction;
}

export async function buildTransferBothAuthoritiesTransaction({
  connection,
  stakeAccountPubkey,
  currentAuthorityPubkey,
  newAuthorityPubkey,
}: TransferBothAuthoritiesParams): Promise<TransferBothAuthoritiesResult> {
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
      stakeAuthorizationType: { index: 0 }, // staker
    }),
  );
  tx.add(
    StakeProgram.authorize({
      stakePubkey: stakeAccountPubkey,
      authorizedPubkey: currentAuthorityPubkey,
      newAuthorizedPubkey: newAuthorityPubkey,
      stakeAuthorizationType: { index: 1 }, // withdrawer
    }),
  );

  return { transaction: tx };
}
