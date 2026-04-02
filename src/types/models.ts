/**
 * Frontend domain model. Maps from Django REST are normalized in the API layer.
 * Field names are camelCase in app code; serializers may use snake_case.
 */

export type CompetitionType = "quantity" | "quality" | "combined";

export type WeighInKind = "scheduled" | "extra";

export type UserRole = "admin" | "organizer" | "user";

export interface CombinedScoreWeights {
  /** Weight multiplier for total kg (default 1) */
  totalWeight: number;
  /** Points per fish when using count component (default 0.5) */
  fishCount: number;
  /** Weight multiplier for best-N quality sub-score in kg (default 1) */
  bestNQuality: number;
}

export interface CompetitionRules {
  /** Target weigh-ins per calendar day (default 2) */
  weighInsPerDay: number;
  /** Single-fish weight (kg) that allows an extra weigh-in when exceeded */
  weightThresholdKg: number;
  /** Fish count in one session that allows an extra weigh-in when exceeded */
  fishCountThreshold: number;
}

export interface Competition {
  id: string;
  organizerId?: string;
  lakeId?: string;
  name: string;
  slug?: string;
  description?: string;
  /** API returns free-text rules string */
  rulesText?: string;
  durationHours?: number | null;
  startDate: string;
  endDate: string;
  /** Valoare brută din API (poate fi orice string) */
  rawType?: string;
  type: CompetitionType;
  /** For quality / combined: how many best fish count toward quality score */
  bestFishCount: number;
  /** Optional sector playoff: global rank compares sector winners first */
  sectorPlayoffEnabled: boolean;
  rules: CompetitionRules;
  combinedWeights: CombinedScoreWeights;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Sector {
  id: string;
  competitionId: string;
  name: string;
  order: number;
  description?: string;
}

export interface Team {
  id: string;
  competitionId?: string;
  sectorId?: string;
  name: string;
  /** Optional angler names for display */
  membersLabel?: string;
  bibNumber?: string;
  isDisqualified?: boolean;
}

/**
 * One weigh-in session for a team. Backend may send snake_case; normalized on ingest.
 * Per-fish weights enable accurate quality scoring; when absent, engine uses fallbacks (see scoring docs).
 */
export interface WeighIn {
  id: string;
  competitionId: string;
  teamId: string;
  fishCount: number;
  totalWeightKg: number;
  recordedAt: string;
  kind: WeighInKind;
  /** Largest single fish in this session (kg), used for Braila and quality fallback */
  biggestFishKg?: number | null;
  /** Optional individual fish weights (kg) for exact best-N */
  fishWeightsKg?: number[];
  notes?: string;
  standId?: string;
  fishType?: string;
  fishName?: string;
}

export interface Stand {
  id: string;
  /** Sector la concurs; gol dacă standul e doar pe lac, nealocat încă unui sector */
  sectorId: string;
  /** Lacul căruia îi aparține postul (configurare fixă) */
  lakeId?: string | null;
  /** Etichetă pe lac (ex. A1, Ponton 3); nu se schimbă odată cu concursul */
  label?: string;
  teamId?: string | null;
  positionNumber?: number | null;
  contestId?: string;
}

export interface CompetitionResult {
  id: string;
  competitionId: string;
  teamId: string;
  sectorId: string;
  totalWeightKg: number;
  totalFish: number;
  biggestFishKg: number;
  rankPosition?: number | null;
}

export interface Lake {
  id: string;
  name: string;
  mapUrl?: string | null;
  description?: string;
}

export interface Regulation {
  id: string;
  title: string;
  category?: string;
  description?: string;
}

export interface LakeRegulationLink {
  id: string;
  lakeId: string;
  regulationId: string;
}

export type TeamMemberRole = "captain" | "member";

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: TeamMemberRole;
}

export interface Prize {
  id: string;
  competitionId: string;
  label: string;
  amount?: string;
  rank?: number;
  teamId?: string | null;
}

export interface LeaderboardEntry {
  /** Loc general (după regulă: mai întâi câștigătorii de sector, apoi restul) */
  rank: number;
  /** Loc în sector (1 = primul în sector după scor) */
  sectorRank?: number;
  generalRank?: number;
  teamId: string;
  teamName: string;
  sectorId: string;
  sectorName: string;
  fishCount: number;
  totalWeightKg: number;
  qualityScoreKg: number;
  combinedScore: number;
  /** Raw score used for sorting depending on competition type */
  primaryScore: number;
  isSectorWinner?: boolean;
}

export interface BrailaEntry {
  date: string;
  teamId: string;
  teamName: string;
  weightKg: number;
  weighInId?: string;
}

export interface AuthUser {
  id: string;
  username: string;
  email?: string;
  role: UserRole;
  isStaff: boolean;
}

/** Paginated DRF-style list response */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
