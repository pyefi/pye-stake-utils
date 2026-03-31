import {
  Connection,
  PublicKey,
  StakeProgram,
  Transaction,
  ComputeBudgetProgram,
} from "@solana/web3.js";

export interface WithdrawStakeParams {
  connection: Connection;
  stakeAccountPubkey: PublicKey;
  /** The withdraw authority (must sign) */
  authorizedPubkey: PublicKey;
  /** Destination for withdrawn SOL */
  toPubkey: PublicKey;
  /** Lamports to withdraw */
  lamports: number;
}

export interface WithdrawStakeResult {
  transaction: Transaction;
}

/**
 * Build a transaction that withdraws SOL from an inactive/deactivated stake account.
 */
export async function buildWithdrawStakeTransaction({
  connection,
  stakeAccountPubkey,
  authorizedPubkey,
  toPubkey,
  lamports,
}: WithdrawStakeParams): Promise<WithdrawStakeResult> {
  const latestBlockhash = await connection.getLatestBlockhash("confirmed");

  const tx = new Transaction();
  tx.recentBlockhash = latestBlockhash.blockhash;
  tx.feePayer = authorizedPubkey;

  tx.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }));
  tx.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1_000 }));

  tx.add(
    StakeProgram.withdraw({
      stakePubkey: stakeAccountPubkey,
      authorizedPubkey,
      toPubkey,
      lamports,
    }),
  );

  return { transaction: tx };
}
