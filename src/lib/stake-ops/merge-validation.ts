import type { StakeAccount, StakeLockup } from "@/lib/types";

export type ValidateMergeResult =
  | { ok: true }
  | { ok: false; reason: string };

function lockupInForce(
  lockup: StakeLockup,
  currentEpoch: number,
  nowUnix: number,
): boolean {
  return lockup.epoch > currentEpoch || lockup.unixTimestamp > nowUnix;
}

function lockupsEqual(a: StakeLockup, b: StakeLockup): boolean {
  return (
    a.epoch === b.epoch &&
    a.unixTimestamp === b.unixTimestamp &&
    a.custodian === b.custodian
  );
}

function statePairOk(
  destination: StakeAccount,
  source: StakeAccount,
): ValidateMergeResult {
  const d = destination.state;
  const s = source.state;
  const sameVoter =
    destination.validatorVoteAccount === source.validatorVoteAccount;

  if (d === "inactive" && s === "inactive") return { ok: true };
  if (d === "deactivating" && s === "deactivating") {
    return sameVoter
      ? { ok: true }
      : { ok: false, reason: "Both deactivating accounts must be on the same validator" };
  }
  if (d === "active" && s === "active") {
    return sameVoter
      ? { ok: true }
      : { ok: false, reason: "Active accounts must be delegated to the same validator" };
  }
  if (
    (d === "activating" && s === "inactive") ||
    (d === "inactive" && s === "activating")
  ) {
    return { ok: true };
  }
  return {
    ok: false,
    reason: `Cannot merge a ${d} account with a ${s} one`,
  };
}

export function validateMerge(
  destination: StakeAccount,
  source: StakeAccount,
  walletPubkey: string,
  currentEpoch: number,
  nowUnix: number,
): ValidateMergeResult {
  if (destination.pubkey === source.pubkey) {
    return { ok: false, reason: "Cannot merge an account into itself" };
  }
  if (!destination.authorities.includes("staker")) {
    return { ok: false, reason: "You are not the staker on the destination" };
  }
  if (!source.authorities.includes("staker")) {
    return { ok: false, reason: "You are not the staker on this account" };
  }

  const stateCheck = statePairOk(destination, source);
  if (!stateCheck.ok) return stateCheck;

  const dl = destination.lockup;
  const sl = source.lockup;

  if ((dl === null) !== (sl === null)) {
    return { ok: false, reason: "Lockup terms differ between the two accounts" };
  }
  if (dl && sl) {
    if (!lockupsEqual(dl, sl)) {
      return { ok: false, reason: "Lockup terms differ between the two accounts" };
    }
    const inForce =
      lockupInForce(dl, currentEpoch, nowUnix) ||
      lockupInForce(sl, currentEpoch, nowUnix);
    if (inForce && dl.custodian !== walletPubkey) {
      return { ok: false, reason: `Locked until epoch ${dl.epoch}` };
    }
  }

  return { ok: true };
}
