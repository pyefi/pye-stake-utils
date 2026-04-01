let cache: Map<string, { name: string; icon: string }> | null = null;

export async function fetchValidatorMap(): Promise<Map<string, { name: string; icon: string }>> {
  if (cache) return cache;

  try {
    const res = await fetch("https://api.stakewiz.com/validators");
    if (!res.ok) return new Map();

    const data: Array<{ vote_account?: string; name?: string; avatar_url?: string }> =
      await res.json();

    const map = new Map<string, { name: string; icon: string }>();
    for (const v of data) {
      if (v.vote_account) {
        map.set(v.vote_account, {
          name: v.name ?? "Unknown Validator",
          icon: v.avatar_url ?? "",
        });
      }
    }

    cache = map;
    return map;
  } catch {
    return new Map();
  }
}
