import { describe, expect, it } from "vitest";
import type {
  Competition,
  LeaderboardEntry,
  Sector,
  Stand,
  Team,
  WeighIn,
} from "@/types/models";
import {
  assignSectorAndGeneralRanks,
  bestNFishSumKg,
  collectFishWeightsKg,
  computeBraila,
  computeLeaderboard,
  computeSectorRankings,
  sortLeaderboardForDisplay,
  totalFishCount,
  totalWeightKg,
} from "./engine";

const baseCompetition = (over: Partial<Competition> = {}): Competition => ({
  id: "c1",
  name: "Test",
  startDate: "2026-04-01",
  endDate: "2026-04-03",
  type: "quantity",
  bestFishCount: 3,
  sectorPlayoffEnabled: false,
  rules: {
    weighInsPerDay: 2,
    weightThresholdKg: 15,
    fishCountThreshold: 5,
  },
  combinedWeights: {
    totalWeight: 1,
    fishCount: 0.5,
    bestNQuality: 1,
  },
  isActive: true,
  ...over,
});

describe("collectFishWeightsKg", () => {
  it("uses explicit fishWeightsKg", () => {
    const w: WeighIn = {
      id: "1",
      competitionId: "c1",
      teamId: "t1",
      fishCount: 2,
      totalWeightKg: 20,
      recordedAt: "2026-04-01T10:00:00Z",
      kind: "scheduled",
      fishWeightsKg: [12, 8],
    };
    expect(collectFishWeightsKg([w])).toEqual([12, 8]);
  });

  it("splits with biggestFishKg and remainder", () => {
    const w: WeighIn = {
      id: "1",
      competitionId: "c1",
      teamId: "t1",
      fishCount: 3,
      totalWeightKg: 30,
      recordedAt: "2026-04-01T10:00:00Z",
      kind: "scheduled",
      biggestFishKg: 15,
    };
    const fish = collectFishWeightsKg([w]);
    expect(fish[0]).toBe(15);
    expect(fish.length).toBe(3);
    expect(fish.reduce((a, b) => a + b, 0)).toBeCloseTo(30, 5);
  });
});

describe("bestNFishSumKg", () => {
  it("sums top N", () => {
    const w: WeighIn = {
      id: "1",
      competitionId: "c1",
      teamId: "t1",
      fishCount: 4,
      totalWeightKg: 40,
      recordedAt: "2026-04-01T10:00:00Z",
      kind: "scheduled",
      fishWeightsKg: [5, 12, 9, 20],
    };
    expect(bestNFishSumKg([w], 2)).toBe(32);
  });
});

describe("computeLeaderboard", () => {
  const sectors: Sector[] = [
    { id: "s1", competitionId: "c1", name: "A", order: 1 },
    { id: "s2", competitionId: "c1", name: "B", order: 2 },
  ];
  const teams: Team[] = [
    { id: "t1", competitionId: "c1", sectorId: "s1", name: "Alpha" },
    { id: "t2", competitionId: "c1", sectorId: "s2", name: "Beta" },
  ];

  it("ranks by fish count for quantity", () => {
    const competition = baseCompetition({ type: "quantity" });
    const weighIns: WeighIn[] = [
      {
        id: "w1",
        competitionId: "c1",
        teamId: "t1",
        fishCount: 3,
        totalWeightKg: 30,
        recordedAt: "2026-04-01T08:00:00Z",
        kind: "scheduled",
      },
      {
        id: "w2",
        competitionId: "c1",
        teamId: "t2",
        fishCount: 5,
        totalWeightKg: 25,
        recordedAt: "2026-04-01T09:00:00Z",
        kind: "scheduled",
      },
    ];
    const board = computeLeaderboard({
      competition,
      teams,
      sectors,
      weighIns,
    });
    expect(board[0].teamId).toBe("t2");
    expect(board[0].primaryScore).toBe(5);
    expect(totalFishCount(weighIns.filter((x) => x.teamId === "t2"))).toBe(5);
  });

  it("flags sector winners when playoff enabled", () => {
    const competition = baseCompetition({
      type: "quantity",
      sectorPlayoffEnabled: true,
    });
    const weighIns: WeighIn[] = [
      {
        id: "w1",
        competitionId: "c1",
        teamId: "t1",
        fishCount: 10,
        totalWeightKg: 10,
        recordedAt: "2026-04-01T08:00:00Z",
        kind: "scheduled",
      },
      {
        id: "w2",
        competitionId: "c1",
        teamId: "t2",
        fishCount: 4,
        totalWeightKg: 4,
        recordedAt: "2026-04-01T09:00:00Z",
        kind: "scheduled",
      },
    ];
    const board = computeLeaderboard({
      competition,
      teams,
      sectors,
      weighIns,
    });
    const t1 = board.find((b) => b.teamId === "t1");
    expect(t1?.isSectorWinner).toBe(true);
  });
});

describe("assignSectorAndGeneralRanks", () => {
  function row(
    teamId: string,
    sectorId: string,
    primaryScore: number,
    totalWeightKg: number,
    fishCount: number,
  ): LeaderboardEntry {
    return {
      rank: 0,
      teamId,
      teamName: teamId,
      sectorId,
      sectorName: sectorId,
      fishCount,
      totalWeightKg,
      qualityScoreKg: 0,
      combinedScore: 0,
      primaryScore,
    };
  }

  it("ranks sector leaders first in general, then rest by score", () => {
    const entries = [
      row("t1", "s1", 10, 10, 10),
      row("t2", "s1", 5, 5, 5),
      row("t3", "s2", 8, 8, 8),
      row("t4", "s2", 7, 7, 7),
    ];
    const out = assignSectorAndGeneralRanks(entries);
    const byId = Object.fromEntries(out.map((e) => [e.teamId, e]));
    expect(byId.t1?.sectorRank).toBe(1);
    expect(byId.t2?.sectorRank).toBe(2);
    expect(byId.t3?.sectorRank).toBe(1);
    expect(byId.t4?.sectorRank).toBe(2);
    expect(out.map((e) => e.teamId)).toEqual(["t1", "t3", "t4", "t2"]);
    expect(out.map((e) => e.generalRank)).toEqual([1, 2, 3, 4]);
  });
});

describe("computeSectorRankings", () => {
  it("re-ranks within sector", () => {
    const entries = [
      {
        rank: 1,
        teamId: "a",
        teamName: "A",
        sectorId: "s1",
        sectorName: "S1",
        fishCount: 2,
        totalWeightKg: 2,
        qualityScoreKg: 0,
        combinedScore: 0,
        primaryScore: 2,
      },
      {
        rank: 2,
        teamId: "b",
        teamName: "B",
        sectorId: "s1",
        sectorName: "S1",
        fishCount: 1,
        totalWeightKg: 1,
        qualityScoreKg: 0,
        combinedScore: 0,
        primaryScore: 1,
      },
    ];
    const map = computeSectorRankings(entries);
    const s1 = map.get("s1");
    expect(s1?.[0].rank).toBe(1);
    expect(s1?.[1].rank).toBe(2);
  });
});

describe("computeBraila", () => {
  it("picks max fish per day", () => {
    const teams: Team[] = [
      { id: "t1", competitionId: "c1", sectorId: "s1", name: "A" },
    ];
    const weighIns: WeighIn[] = [
      {
        id: "w1",
        competitionId: "c1",
        teamId: "t1",
        fishCount: 1,
        totalWeightKg: 12,
        recordedAt: "2026-04-01T10:00:00Z",
        kind: "scheduled",
        biggestFishKg: 12,
      },
      {
        id: "w2",
        competitionId: "c1",
        teamId: "t1",
        fishCount: 1,
        totalWeightKg: 18,
        recordedAt: "2026-04-01T15:00:00Z",
        kind: "extra",
        biggestFishKg: 18,
      },
    ];
    const b = computeBraila("c1", teams, weighIns);
    expect(b).toHaveLength(1);
    expect(b[0].weightKg).toBe(18);
  });

  it("ignores sessions with more than one fish", () => {
    const teams: Team[] = [
      { id: "t1", competitionId: "c1", sectorId: "s1", name: "A" },
    ];
    const weighIns: WeighIn[] = [
      {
        id: "w1",
        competitionId: "c1",
        teamId: "t1",
        fishCount: 2,
        totalWeightKg: 20,
        recordedAt: "2026-04-01T10:00:00Z",
        kind: "scheduled",
        biggestFishKg: 12,
      },
      {
        id: "w2",
        competitionId: "c1",
        teamId: "t1",
        fishCount: 1,
        totalWeightKg: 8,
        recordedAt: "2026-04-01T10:00:00Z",
        kind: "scheduled",
        biggestFishKg: 8,
      },
    ];
    const b = computeBraila("c1", teams, weighIns);
    expect(b).toHaveLength(1);
    expect(b[0].weightKg).toBe(8);
    expect(b[0].weighInId).toBe("w2");
  });
});

describe("sortLeaderboardForDisplay", () => {
  it("orders by sector order then stand letter", () => {
    const sectors: Sector[] = [
      { id: "s2", competitionId: "c1", name: "Beta", order: 2 },
      { id: "s1", competitionId: "c1", name: "Alfa", order: 1 },
    ];
    const stands: Stand[] = [
      { id: "x1", sectorId: "s1", teamId: "t2", label: "B" },
      { id: "x2", sectorId: "s1", teamId: "t1", label: "A" },
    ];
    const base: Omit<LeaderboardEntry, "teamId" | "teamName" | "sectorId" | "sectorName" | "rank"> = {
      fishCount: 1,
      totalWeightKg: 1,
      qualityScoreKg: 0,
      combinedScore: 0,
      primaryScore: 1,
    };
    const entries: LeaderboardEntry[] = [
      {
        rank: 2,
        teamId: "t2",
        teamName: "T2",
        sectorId: "s1",
        sectorName: "Alfa",
        ...base,
      },
      {
        rank: 1,
        teamId: "t1",
        teamName: "T1",
        sectorId: "s1",
        sectorName: "Alfa",
        ...base,
      },
      {
        rank: 3,
        teamId: "t3",
        teamName: "T3",
        sectorId: "s2",
        sectorName: "Beta",
        ...base,
      },
    ];
    const sorted = sortLeaderboardForDisplay(entries, sectors, stands);
    expect(sorted.map((e) => e.teamId)).toEqual(["t1", "t2", "t3"]);
  });
});

describe("totals", () => {
  it("aggregates weigh-ins", () => {
    const list: WeighIn[] = [
      {
        id: "1",
        competitionId: "c1",
        teamId: "t",
        fishCount: 2,
        totalWeightKg: 10,
        recordedAt: "2026-04-01T10:00:00Z",
        kind: "scheduled",
      },
      {
        id: "2",
        competitionId: "c1",
        teamId: "t",
        fishCount: 1,
        totalWeightKg: 7,
        recordedAt: "2026-04-01T11:00:00Z",
        kind: "scheduled",
      },
    ];
    expect(totalFishCount(list)).toBe(3);
    expect(totalWeightKg(list)).toBe(17);
  });
});
