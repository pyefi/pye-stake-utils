export type StakeAccountState =
  | "active"
  | "activating"
  | "deactivating"
  | "inactive";

export interface StakeAccount {
  pubkey: string;
  validatorVoteAccount: string;
  validatorName: string;
  validatorIcon: string;
  lamports: number;
  state: StakeAccountState;
}
