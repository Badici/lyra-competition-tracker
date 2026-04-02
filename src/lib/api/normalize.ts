import type {
  AuthUser,
  BrailaEntry,
  CombinedScoreWeights,
  Competition,
  CompetitionResult,
  CompetitionRules,
  CompetitionType,
  Lake,
  LakeRegulationLink,
  Prize,
  Regulation,
  Sector,
  Stand,
  Team,
  TeamMember,
  TeamMemberRole,
  UserRole,
  WeighIn,
  WeighInKind,
} from "@/types/models";

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function str(v: unknown, fallback = ""): string {
  if (v == null) return fallback;
  return String(v);
}

function bool(v: unknown, fallback = false): boolean {
  if (typeof v === "boolean") return v;
  return fallback;
}

/** Pentru câmpuri API tip is_staff / is_superuser (1, "true", etc.). */
function truthyStaffFlag(v: unknown): boolean {
  if (v === true) return true;
  if (v === false || v == null) return false;
  if (typeof v === "number" && Number.isFinite(v) && v !== 0) return true;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return s === "true" || s === "1" || s === "yes";
  }
  return false;
}

export function normalizeRules(raw: Record<string, unknown>): CompetitionRules {
  return {
    weighInsPerDay: num(raw.weigh_ins_per_day ?? raw.weighInsPerDay, 2),
    weightThresholdKg: num(raw.weight_threshold_kg ?? raw.weightThresholdKg, 0),
    fishCountThreshold: num(
      raw.fish_count_threshold ?? raw.fishCountThreshold,
      0,
    ),
  };
}

export function normalizeCombinedWeights(
  raw: Record<string, unknown> | undefined,
): CombinedScoreWeights {
  if (!raw) {
    return { totalWeight: 1, fishCount: 0.5, bestNQuality: 1 };
  }
  return {
    totalWeight: num(raw.total_weight ?? raw.totalWeight, 1),
    fishCount: num(raw.fish_count ?? raw.fishCount, 0.5),
    bestNQuality: num(raw.best_n_quality ?? raw.bestNQuality, 1),
  };
}

export function normalizeCompetition(raw: Record<string, unknown>): Competition {
  const typeRawStr = str(raw.type, "");
  const typeRaw = (typeRawStr || "quantity") as CompetitionType;
  const type: CompetitionType = ["quantity", "quality", "combined"].includes(
    typeRaw,
  )
    ? typeRaw
    : "quantity";

  const rulesRaw = raw.rules;
  const rulesText =
    typeof rulesRaw === "string" ? rulesRaw : undefined;
  const rulesObj =
    rulesRaw && typeof rulesRaw === "object"
      ? (rulesRaw as Record<string, unknown>)
      : undefined;

  return {
    id: str(raw.id),
    organizerId: raw.organizer != null ? str(raw.organizer) : undefined,
    lakeId: raw.lake != null ? str(raw.lake) : undefined,
    name: str(raw.name),
    slug: raw.slug ? str(raw.slug) : undefined,
    description: raw.description ? str(raw.description) : undefined,
    rulesText,
    durationHours:
      raw.duration_hours != null ? num(raw.duration_hours) : undefined,
    startDate: str(raw.start_date ?? raw.startDate ?? ""),
    endDate: str(raw.end_date ?? raw.endDate ?? ""),
    rawType: typeRawStr || undefined,
    type,
    bestFishCount: num(raw.best_fish_count ?? raw.bestFishCount, 3),
    sectorPlayoffEnabled: bool(
      raw.sector_playoff_enabled ?? raw.sectorPlayoffEnabled,
      false,
    ),
    rules: rulesObj
      ? normalizeRules(rulesObj)
      : {
          weighInsPerDay: 2,
          weightThresholdKg: 0,
          fishCountThreshold: 0,
        },
    combinedWeights: normalizeCombinedWeights(
      raw.combined_weights as Record<string, unknown> | undefined ??
        (raw.combinedWeights as Record<string, unknown> | undefined),
    ),
    isActive: bool(raw.is_active ?? raw.isActive, true),
    createdAt: raw.created_at ? str(raw.created_at) : undefined,
    updatedAt: raw.updated_at ? str(raw.updated_at) : undefined,
  };
}

export function normalizeSector(raw: Record<string, unknown>): Sector {
  return {
    id: str(raw.id),
    competitionId: str(raw.contest ?? raw.competition ?? raw.competition_id ?? raw.competitionId),
    name: str(raw.name),
    order: num(raw.order, 0),
    description: raw.description ? str(raw.description) : undefined,
  };
}

export function normalizeTeam(raw: Record<string, unknown>): Team {
  return {
    id: str(raw.id),
    competitionId:
      raw.competition != null || raw.contest != null
        ? str(raw.contest ?? raw.competition ?? raw.competition_id ?? raw.competitionId)
        : undefined,
    sectorId:
      raw.sector != null || raw.sector_id != null || raw.sectorId != null
        ? str(raw.sector ?? raw.sector_id ?? raw.sectorId)
        : undefined,
    name: str(raw.name),
    membersLabel: raw.members_label
      ? str(raw.members_label)
      : raw.membersLabel
        ? str(raw.membersLabel)
        : undefined,
    bibNumber: raw.bib_number
      ? str(raw.bib_number)
      : raw.bibNumber
        ? str(raw.bibNumber)
        : undefined,
    isDisqualified: bool(raw.is_disqualified ?? raw.isDisqualified, false),
  };
}

function parseKind(v: unknown): WeighInKind {
  const s = str(v, "scheduled");
  return s === "extra" ? "extra" : "scheduled";
}

export function normalizeWeighIn(raw: Record<string, unknown>): WeighIn {
  const fishWeights =
    raw.fish_weights_kg ?? raw.fishWeightsKg ?? raw.fish_weights;
  let fishWeightsKg: number[] | undefined;
  if (Array.isArray(fishWeights)) {
    fishWeightsKg = fishWeights.map((x) => num(x));
  }
  return {
    id: str(raw.id),
    competitionId: str(raw.contest ?? raw.competition ?? raw.competition_id ?? raw.competitionId),
    teamId: str(raw.team ?? raw.team_id ?? raw.teamId),
    fishCount: num(raw.fish_count ?? raw.fishCount, 1),
    totalWeightKg: num(raw.weight ?? raw.total_weight_kg ?? raw.totalWeightKg, 0),
    recordedAt: str(raw.caught_at ?? raw.recorded_at ?? raw.recordedAt ?? new Date().toISOString()),
    kind: parseKind(raw.kind ?? raw.weigh_in_type ?? raw.weighInType),
    biggestFishKg:
      raw.biggest_fish_kg != null || raw.biggestFishKg != null
        ? num(raw.biggest_fish_kg ?? raw.biggestFishKg)
        : null,
    fishWeightsKg,
    notes: raw.notes ? str(raw.notes) : undefined,
    standId: raw.stand != null ? str(raw.stand) : undefined,
    fishType: raw.fish_type ? str(raw.fish_type) : undefined,
    fishName: raw.fish_name ? str(raw.fish_name) : undefined,
  };
}

export function normalizePrize(raw: Record<string, unknown>): Prize {
  return {
    id: str(raw.id),
    competitionId: str(raw.competition ?? raw.competition_id ?? raw.competitionId),
    label: str(raw.label),
    amount: raw.amount != null ? str(raw.amount) : undefined,
    rank: raw.rank != null ? num(raw.rank) : undefined,
    teamId:
      raw.team != null
        ? str(raw.team)
        : raw.team_id != null
          ? str(raw.team_id)
          : raw.teamId != null
            ? str(raw.teamId)
            : null,
  };
}

function inferRole(
  raw: Record<string, unknown>,
): { role: UserRole; isStaff: boolean } {
  const isSuper = truthyStaffFlag(
    raw.is_superuser ??
      raw.isSuperuser ??
      raw.is_admin ??
      raw.isAdmin ??
      raw.django_is_superuser,
  );
  const isStaff =
    truthyStaffFlag(
      raw.is_staff ?? raw.isStaff ?? raw.django_is_staff,
    ) || isSuper;
  const roleStr = str(
    raw.role ?? raw.user_role ?? raw.userRole ?? "",
    "",
  ).toLowerCase();
  if (roleStr === "admin" || roleStr === "organizer") {
    return { role: roleStr as UserRole, isStaff };
  }
  if (roleStr === "contest_organizer") {
    return { role: "organizer", isStaff };
  }
  if (isSuper) return { role: "admin", isStaff: true };
  if (isStaff) return { role: "admin", isStaff: true };
  const groups = raw.groups;
  if (typeof groups === "string" && groups.trim()) {
    const g = groups.toLowerCase();
    if (g.includes("admin") || g.includes("organizer")) {
      return { role: "admin", isStaff: true };
    }
  }
  if (Array.isArray(groups)) {
    const names = groups.map((g) =>
      typeof g === "object" && g && "name" in g
        ? str((g as { name: unknown }).name).toLowerCase()
        : str(g).toLowerCase(),
    );
    if (names.some((n) => n.includes("admin") || n.includes("organizer"))) {
      return { role: "admin", isStaff };
    }
  }
  const perms = raw.permissions ?? raw.user_permissions;
  if (Array.isArray(perms)) {
    const flat = perms.map((p) => str(p).toLowerCase());
    if (
      flat.some(
        (p) =>
          p.includes("admin") ||
          p === "all" ||
          (p.includes("contest") && p.includes("organ")),
      )
    ) {
      return { role: "admin", isStaff: true };
    }
  }
  return { role: "user", isStaff };
}

export function normalizeUser(raw: Record<string, unknown>): AuthUser {
  const { role, isStaff } = inferRole(raw);
  return {
    id: str(raw.id),
    username: str(raw.username),
    email: raw.email ? str(raw.email) : undefined,
    role,
    isStaff,
  };
}

export function normalizeBrailaEntry(raw: Record<string, unknown>): BrailaEntry {
  return {
    date: str(raw.date),
    teamId: str(raw.team ?? raw.team_id ?? raw.teamId),
    teamName: str(raw.team_name ?? raw.teamName),
    weightKg: num(raw.weight_kg ?? raw.weightKg),
    weighInId: raw.weigh_in != null ? str(raw.weigh_in) : raw.weighInId != null ? str(raw.weighInId) : undefined,
  };
}

export function normalizeResult(raw: Record<string, unknown>): CompetitionResult {
  return {
    id: str(raw.id),
    competitionId: str(raw.contest ?? raw.competition),
    teamId: str(raw.team),
    sectorId: str(raw.sector),
    totalWeightKg: num(raw.total_weight),
    totalFish: num(raw.total_fish),
    biggestFishKg: num(raw.biggest_fish),
    rankPosition: raw.rank_position != null ? num(raw.rank_position) : null,
  };
}

export function normalizeStand(raw: Record<string, unknown>): Stand {
  const sectorRaw = raw.sector ?? raw.sector_id ?? raw.sectorId;
  const sectorId =
    sectorRaw != null && String(sectorRaw).trim() !== ""
      ? str(sectorRaw)
      : "";
  const contestRaw = raw.contest ?? raw.contest_id ?? raw.contestId;
  return {
    id: str(raw.id),
    sectorId,
    lakeId:
      raw.lake != null
        ? str(raw.lake)
        : raw.lake_id != null
          ? str(raw.lake_id)
          : null,
    label: raw.label
      ? str(raw.label)
      : raw.name
        ? str(raw.name)
        : raw.stand_label
          ? str(raw.stand_label)
          : undefined,
    teamId: raw.team != null ? str(raw.team) : null,
    positionNumber:
      raw.position_number != null ? num(raw.position_number) : null,
    contestId:
      contestRaw != null && String(contestRaw).trim() !== ""
        ? str(contestRaw)
        : undefined,
  };
}

export function normalizeLake(raw: Record<string, unknown>): Lake {
  return {
    id: str(raw.id),
    name: str(raw.name),
    mapUrl: raw.map_url != null ? str(raw.map_url) : null,
    description: raw.description ? str(raw.description) : undefined,
  };
}

export function normalizeRegulation(raw: Record<string, unknown>): Regulation {
  return {
    id: str(raw.id),
    title: str(raw.title),
    category: raw.category ? str(raw.category) : undefined,
    description: raw.description ? str(raw.description) : undefined,
  };
}

export function normalizeLakeRegulation(
  raw: Record<string, unknown>,
): LakeRegulationLink {
  return {
    id: str(raw.id),
    lakeId: str(raw.lake),
    regulationId: str(raw.regulation),
  };
}

function parseTeamMemberRole(v: unknown): TeamMemberRole {
  const s = str(v, "member");
  return s === "captain" ? "captain" : "member";
}

export function normalizeTeamMember(raw: Record<string, unknown>): TeamMember {
  return {
    id: str(raw.id),
    teamId: str(raw.team),
    userId: str(raw.user),
    role: parseTeamMemberRole(raw.role),
  };
}
