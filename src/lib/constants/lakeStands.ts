/** Standurile pe lac sunt doar literele A–D (fără alte etichete). */
export const LAKE_STAND_LETTERS = ["A", "B", "C", "D"] as const;
export type LakeStandLetter = (typeof LAKE_STAND_LETTERS)[number];

export function normalizeStandLetter(
  label?: string | null,
): LakeStandLetter | null {
  const c = (label ?? "").trim().toUpperCase().charAt(0);
  if (c === "A" || c === "B" || c === "C" || c === "D") return c;
  return null;
}

export function standLetterOrFallback(label?: string | null, id?: string): string {
  const n = normalizeStandLetter(label);
  if (n) return n;
  const c = (label ?? "").trim().toUpperCase().charAt(0);
  return c || `#${id ?? "?"}`;
}

export function sortLakeStandsByLetter<T extends { label?: string; id: string }>(
  stands: T[],
): T[] {
  return [...stands].sort((a, b) => {
    const na = normalizeStandLetter(a.label);
    const nb = normalizeStandLetter(b.label);
    if (na && nb) return na.localeCompare(nb);
    if (na) return -1;
    if (nb) return 1;
    return a.id.localeCompare(b.id);
  });
}
