const LAMPORTS_PER_SOL = 1_000_000_000;

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function lamportsToSol(lamports: number | null): number {
  if (lamports === null) return 0;
  return lamports / LAMPORTS_PER_SOL;
}

export function formatSol(lamports: number | null, decimals = 4): string {
  if (lamports === null) return "—";
  const sol = lamports / LAMPORTS_PER_SOL;
  return sol.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  });
}

export function solToLamports(sol: number): number {
  return Math.round(sol * LAMPORTS_PER_SOL);
}
