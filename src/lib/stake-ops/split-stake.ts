import {
  Connection,
  Keypair,
  PublicKey,
  StakeProgram,
  Transaction,
  ComputeBudgetProgram,
} from "@solana/web3.js";

export interface SplitStakeParams {
  connection: Connection;
  stakeAccountPubkey: PublicKey;
  authorizedPubkey: PublicKey;
  splitLamports: number;
}

export interface SplitStakeResult {
  transaction: Transaction;
  newStakeKeypair: Keypair;
}

export async function buildSplitStakeTransaction({
  connection,
  stakeAccountPubkey,
  authorizedPubkey,
  splitLamports,
}: SplitStakeParams): Promise<SplitStakeResult> {
  const newStakeKeypair = Keypair.generate();

  const [rentExemptReserve, latestBlockhash] = await Promise.all([
    connection.getMinimumBalanceForRentExemption(StakeProgram.space),
    connection.getLatestBlockhash("confirmed"),
  ]);

  const tx = new Transaction();
  tx.recentBlockhash = latestBlockhash.blockhash;
  tx.feePayer = authorizedPubkey;

  tx.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }));
  tx.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1_000 }));
  tx.add(
    StakeProgram.split(
      {
        stakePubkey: stakeAccountPubkey,
        authorizedPubkey,
        splitStakePubkey: newStakeKeypair.publicKey,
        lamports: splitLamports,
      },
      rentExemptReserve,
    ),
  );

  return { transaction: tx, newStakeKeypair };
}
