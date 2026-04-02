/** Specii folosite la cântărire (trimise la API ca fish_type). */
export const FISH_SPECIES_OPTIONS = [
  { apiValue: "carp", label: "Crap" },
  { apiValue: "tench", label: "Țipă" },
] as const;

export type FishSpeciesApi = (typeof FISH_SPECIES_OPTIONS)[number]["apiValue"];

export function fishSpeciesLabel(fishType?: string | null): string {
  const t = (fishType ?? "").toLowerCase().trim();
  if (t === "carp" || t === "crap") return "Crap";
  if (t === "tench" || t === "țipă" || t === "tipa") return "Țipă";
  return fishType?.trim() ? fishType : "—";
}

export function resolveStandIdForTeam(
  stands: { id: string; teamId?: string | null }[],
  teamId: string,
): string | undefined {
  const s = stands.find((x) => x.teamId === teamId);
  return s?.id;
}
