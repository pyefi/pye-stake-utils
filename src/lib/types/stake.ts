export type StakeAccountState =
  | "active"
  | "activating"
  | "deactivating"
  | "inactive";

export type StakeAuthority = "staker" | "withdrawer";

export interface StakeLockup {
  unixTimestamp: number;
  epoch: number;
  custodian: string;
}

export interface StakeAccount {
  pubkey: string;
  validatorVoteAccount: string;
  validatorName: string;
  validatorIcon: string;
  lamports: number;
  state: StakeAccountState;
  authorities: StakeAuthority[];
  lockup: StakeLockup | null;
}
