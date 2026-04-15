import { Connection, PublicKey } from "@solana/web3.js";
import { STAKE_PROGRAM_ID } from "@/lib/stake-constants";
import type { StakeAccount, StakeAccountState } from "@/lib/types";

export async function fetchStakeAccounts(
  connection: Connection,
  owner: PublicKey,
  validatorMap?: Map<string, { name: string; icon: string }>,
): Promise<StakeAccount[]> {
  const ownerBytes = owner.toBase58();
  const [stakerAccounts, withdrawerAccounts, epochInfo] = await Promise.all([
    connection.getParsedProgramAccounts(STAKE_PROGRAM_ID, {
      filters: [{ memcmp: { offset: 12, bytes: ownerBytes } }],
    }),
    connection.getParsedProgramAccounts(STAKE_PROGRAM_ID, {
      filters: [{ memcmp: { offset: 44, bytes: ownerBytes } }],
    }),
    connection.getEpochInfo(),
  ]);

  const seen = new Map([
    ...stakerAccounts.map((a) => [a.pubkey.toBase58(), a] as const),
    ...withdrawerAccounts.map((a) => [a.pubkey.toBase58(), a] as const),
  ]);
  const accounts = [...seen.values()];

  const currentEpoch = BigInt(epochInfo.epoch);
  const U64_MAX = BigInt("18446744073709551615");

  const results: StakeAccount[] = [];

  for (const { pubkey, account } of accounts) {
    const parsed = (
      account.data as {
        parsed?: {
          info?: {
            stake?: {
              delegation?: {
                voter?: string;
                stake?: string;
                activationEpoch?: string;
                deactivationEpoch?: string;
              };
            };
          };
        };
      }
    ).parsed;
    const delegation = parsed?.info?.stake?.delegation;
    if (!delegation?.voter) continue;

    const activationEpoch = BigInt(delegation.activationEpoch ?? "0");
    const deactivationEpoch = BigInt(
      delegation.deactivationEpoch ?? U64_MAX.toString(),
    );

    let state: StakeAccountState;
    if (deactivationEpoch < currentEpoch) {
      state = "inactive";
    } else if (deactivationEpoch === currentEpoch) {
      state = "deactivating";
    } else if (activationEpoch === currentEpoch) {
      state = "activating";
    } else {
      state = "active";
    }

    const validatorInfo = validatorMap?.get(delegation.voter);

    results.push({
      pubkey: pubkey.toBase58(),
      validatorVoteAccount: delegation.voter,
      validatorName: validatorInfo?.name ?? "Unknown Validator",
      validatorIcon: validatorInfo?.icon ?? "",
      lamports: Number(delegation.stake ?? account.lamports),
      state,
    });
  }

  return results;
}
