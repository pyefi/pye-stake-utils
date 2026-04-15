let cache: Map<string, { name: string; icon: string }> | null = null;

export async function fetchValidatorMap(): Promise<Map<string, { name: string; icon: string }>> {
  if (cache) return cache;

  try {
    const res = await fetch("https://api.stakewiz.com/validators");
    if (!res.ok) return new Map();

    const data: Array<{ vote_identity?: string; name?: string; image?: string }> =
      await res.json();

    const map = new Map<string, { name: string; icon: string }>();
    for (const v of data) {
      if (v.vote_identity) {
        map.set(v.vote_identity, {
          name: v.name ?? "Unknown Validator",
          icon: v.image ?? "",
        });
      }
    }

    cache = map;
    return map;
  } catch {
    return new Map();
  }
}
