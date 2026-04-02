import { normalizeStandLetter } from "@/lib/constants/lakeStands";
import type {
  BrailaEntry,
  Competition,
  CombinedScoreWeights,
  LeaderboardEntry,
  Sector,
  Stand,
  Team,
  WeighIn,
} from "@/types/models";

export interface ScoringContext {
  competition: Competition;
  teams: Team[];
  sectors: Sector[];
  weighIns: WeighIn[];
}

const defaultCombinedWeights: CombinedScoreWeights = {
  totalWeight: 1,
  fishCount: 0.5,
  bestNQuality: 1,
};

function sortDesc(nums: number[]): number[] {
  return [...nums].sort((a, b) => b - a);
}

/**
 * Builds per-fish weight samples from weigh-ins.
 * Prefer fishWeightsKg; else approximate with biggestFishKg or even distribution.
 */
export function collectFishWeightsKg(weighIns: WeighIn[]): number[] {
  const out: number[] = [];
  for (const w of weighIns) {
    if (w.fishWeightsKg?.length) {
      out.push(...w.fishWeightsKg);
      continue;
    }
    if (w.biggestFishKg != null && w.biggestFishKg > 0) {
      out.push(w.biggestFishKg);
      const remaining = w.fishCount - 1;
      const restKg = Math.max(0, w.totalWeightKg - w.biggestFishKg);
      if (remaining > 0 && restKg > 0) {
        const each = restKg / remaining;
        for (let i = 0; i < remaining; i++) out.push(each);
      }
      continue;
    }
    if (w.fishCount > 0 && w.totalWeightKg >= 0) {
      const each = w.totalWeightKg / w.fishCount;
      for (let i = 0; i < w.fishCount; i++) out.push(each);
    }
  }
  return out;
}

/** Sum of top N fish weights (kg). */
export function bestNFishSumKg(weighIns: WeighIn[], n: number): number {
  if (n <= 0) return 0;
  const fish = sortDesc(collectFishWeightsKg(weighIns));
  return fish.slice(0, n).reduce((a, b) => a + b, 0);
}

export function totalFishCount(weighIns: WeighIn[]): number {
  return weighIns.reduce((s, w) => s + w.fishCount, 0);
}

export function totalWeightKg(weighIns: WeighIn[]): number {
  return weighIns.reduce((s, w) => s + w.totalWeightKg, 0);
}

function primaryAndQuality(
  competition: Competition,
  teamWeighIns: WeighIn[],
): { primaryScore: number; qualityScoreKg: number } {
  const count = totalFishCount(teamWeighIns);
  const weight = totalWeightKg(teamWeighIns);
  const n = Math.max(0, competition.bestFishCount);
  const quality = bestNFishSumKg(teamWeighIns, n);

  switch (competition.type) {
    case "quantity":
      return { primaryScore: count, qualityScoreKg: quality };
    case "quality":
      return { primaryScore: quality, qualityScoreKg: quality };
    case "combined": {
      const w = { ...defaultCombinedWeights, ...competition.combinedWeights };
      const combined =
        w.totalWeight * weight + w.fishCount * count + w.bestNQuality * quality;
      return { primaryScore: combined, qualityScoreKg: quality };
    }
    default:
      return { primaryScore: weight, qualityScoreKg: quality };
  }
}

export function compareEntries(a: LeaderboardEntry, b: LeaderboardEntry): number {
  if (b.primaryScore !== a.primaryScore) return b.primaryScore - a.primaryScore;
  if (b.totalWeightKg !== a.totalWeightKg) return b.totalWeightKg - a.totalWeightKg;
  return b.fishCount - a.fishCount;
}

/**
 * Loc sector: clasament în cadrul fiecărui sector.
 * Loc general: mai întâi toate echipele pe locul 1 în sector (ordonate între ele),
 * apoi restul echipelor (ordonate după același criteriu ca la sector).
 * `rank` devine egal cu `generalRank` pentru compatibilitate cu UI vechi.
 */
export function assignSectorAndGeneralRanks(
  entries: LeaderboardEntry[],
): LeaderboardEntry[] {
  if (!entries.length) return [];

  const NONE = "__none__";
  const bySector = new Map<string, LeaderboardEntry[]>();
  for (const e of entries) {
    const sid = e.sectorId || NONE;
    const list = bySector.get(sid) ?? [];
    list.push(e);
    bySector.set(sid, list);
  }

  const sectorRankByTeam = new Map<string, number>();
  for (const [, list] of bySector) {
    [...list]
      .sort(compareEntries)
      .forEach((row, i) => sectorRankByTeam.set(row.teamId, i + 1));
  }

  const enriched = entries.map((e) => ({
    ...e,
    sectorRank: sectorRankByTeam.get(e.teamId) ?? 0,
  }));

  const winners = enriched.filter((e) => e.sectorRank === 1);
  winners.sort(compareEntries);
  const rest = enriched.filter((e) => e.sectorRank !== 1);
  rest.sort(compareEntries);

  const generalOrder = [...winners, ...rest];
  return generalOrder.map((e, i) => ({
    ...e,
    generalRank: i + 1,
    rank: i + 1,
  }));
}

function sectorName(sectors: Sector[], id: string): string {
  return sectors.find((s) => s.id === id)?.name ?? "—";
}

/**
 * Computes leaderboard entries for all teams, then assigns a provisional global rank (după scor).
 * În UI se folosește `assignSectorAndGeneralRanks` pentru loc sector + loc general.
 * Câștigătorii de sector (`isSectorWinner`) când `sectorPlayoffEnabled`.
 */
export function computeLeaderboard(ctx: ScoringContext): LeaderboardEntry[] {
  const { competition, teams, sectors, weighIns } = ctx;
  const activeTeams = teams.filter((t) => !t.isDisqualified);

  const byTeam = new Map<string, WeighIn[]>();
  for (const w of weighIns) {
    if (w.competitionId !== competition.id) continue;
    const list = byTeam.get(w.teamId) ?? [];
    list.push(w);
    byTeam.set(w.teamId, list);
  }

  const entries: LeaderboardEntry[] = activeTeams.map((team) => {
    const tw = byTeam.get(team.id) ?? [];
    const { primaryScore, qualityScoreKg } = primaryAndQuality(competition, tw);
    const w = { ...defaultCombinedWeights, ...competition.combinedWeights };
    const combinedRaw =
      w.totalWeight * totalWeightKg(tw) +
      w.fishCount * totalFishCount(tw) +
      w.bestNQuality * qualityScoreKg;

    return {
      rank: 0,
      teamId: team.id,
      teamName: team.name,
      sectorId: team.sectorId ?? "",
      sectorName: sectorName(sectors, team.sectorId ?? ""),
      fishCount: totalFishCount(tw),
      totalWeightKg: totalWeightKg(tw),
      qualityScoreKg,
      combinedScore: combinedRaw,
      primaryScore,
    };
  });

  entries.sort(compareEntries);
  entries.forEach((e, i) => {
    e.rank = i + 1;
  });

  if (competition.sectorPlayoffEnabled) {
    const bestBySector = new Map<string, LeaderboardEntry>();
    for (const e of entries) {
      const cur = bestBySector.get(e.sectorId);
      if (!cur || e.primaryScore > cur.primaryScore) bestBySector.set(e.sectorId, e);
    }
    for (const e of entries) {
      e.isSectorWinner = bestBySector.get(e.sectorId)?.teamId === e.teamId;
    }
  }

  return entries;
}

export function computeSectorRankings(
  global: LeaderboardEntry[],
): Map<string, LeaderboardEntry[]> {
  const map = new Map<string, LeaderboardEntry[]>();
  for (const e of global) {
    const list = map.get(e.sectorId) ?? [];
    list.push({ ...e });
    map.set(e.sectorId, list);
  }
  for (const [, list] of map) {
    list.sort(compareEntries);
    list.forEach((row, i) => {
      row.rank = i + 1;
    });
  }
  return map;
}

/**
 * Biggest fish per calendar day (local date of recordedAt).
 * Doar cântăririle cu exact un pește intră la Braila; restul contează la kg / nr. capturi, dar nu aici.
 */
export function computeBraila(
  competitionId: string,
  teams: Team[],
  weighIns: WeighIn[],
): BrailaEntry[] {
  const teamName = (id: string) => teams.find((t) => t.id === id)?.name ?? "—";
  const byDay = new Map<string, BrailaEntry>();

  for (const w of weighIns) {
    if (w.competitionId !== competitionId) continue;
    if (w.fishCount !== 1) continue;
    const d = w.recordedAt.slice(0, 10);
    let candidate = w.biggestFishKg;
    if (candidate == null || candidate <= 0) {
      const fish = collectFishWeightsKg([w]);
      candidate = fish.length ? Math.max(...fish) : 0;
    }
    if (candidate <= 0) continue;
    const prev = byDay.get(d);
    if (!prev || candidate > prev.weightKg) {
      byDay.set(d, {
        date: d,
        teamId: w.teamId,
        teamName: teamName(w.teamId),
        weightKg: candidate,
        weighInId: w.id,
      });
    }
  }

  return [...byDay.values()].sort((a, b) => b.date.localeCompare(a.date));
}

/** Ordine afișare: sectoare după `order`, apoi standuri A–D / poziție. */
export function sortLeaderboardForDisplay(
  entries: LeaderboardEntry[],
  sectors: Sector[],
  stands: Stand[],
): LeaderboardEntry[] {
  const sectorRank = new Map<string, number>();
  [...sectors]
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
    .forEach((s, i) => sectorRank.set(s.id, i));

  function standSortKey(teamId: string): number {
    const st = stands.find((x) => x.teamId === teamId);
    const L = normalizeStandLetter(st?.label);
    if (L === "A") return 0;
    if (L === "B") return 1;
    if (L === "C") return 2;
    if (L === "D") return 3;
    const pn = st?.positionNumber;
    if (pn != null && Number.isFinite(pn)) return 100 + pn;
    return 500;
  }

  return [...entries].sort((a, b) => {
    const ra = sectorRank.has(a.sectorId)
      ? (sectorRank.get(a.sectorId) ?? 0)
      : 9999;
    const rb = sectorRank.has(b.sectorId)
      ? (sectorRank.get(b.sectorId) ?? 0)
      : 9999;
    if (ra !== rb) return ra - rb;
    return standSortKey(a.teamId) - standSortKey(b.teamId);
  });
}

export function teamStats(entry: LeaderboardEntry | undefined) {
  if (!entry) return null;
  return {
    rank: entry.generalRank ?? entry.rank,
    fishCount: entry.fishCount,
    totalWeightKg: entry.totalWeightKg,
    qualityScoreKg: entry.qualityScoreKg,
    combinedScore: entry.combinedScore,
    primaryScore: entry.primaryScore,
  };
}
