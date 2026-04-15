export interface Validator {
  name: string;
  symbol: string;
  vote_account: string;
  pt_sol: string;
  rt_sol: string;
  is_allowed: boolean;
  type: "validator" | "lst";
}

export type ValidatorId = string;
