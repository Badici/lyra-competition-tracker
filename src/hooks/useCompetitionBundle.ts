"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchCompetition,
  fetchResults,
  fetchSectors,
  fetchStandsForCompetition,
  fetchTeams,
  fetchWeighIns,
} from "@/lib/api/resources";
import { queryKeys } from "@/lib/queryKeys";
import {
  assignSectorAndGeneralRanks,
  computeBraila,
  computeLeaderboard,
  computeSectorRankings,
} from "@/lib/scoring/engine";

const LIVE_REFETCH_MS = 7_000;

export function useCompetitionBundle(competitionId: string, live = true) {
  const competitionQ = useQuery({
    queryKey: queryKeys.competition(competitionId),
    queryFn: () => fetchCompetition(competitionId),
    enabled: Boolean(competitionId),
    refetchInterval: live ? LIVE_REFETCH_MS : false,
  });

  const teamsQ = useQuery({
    queryKey: queryKeys.teams(competitionId),
    queryFn: () => fetchTeams({ competition: competitionId }),
    enabled: Boolean(competitionId),
    refetchInterval: live ? LIVE_REFETCH_MS : false,
  });

  const sectorsQ = useQuery({
    queryKey: queryKeys.sectors(competitionId),
    queryFn: () => fetchSectors({ competition: competitionId }),
    enabled: Boolean(competitionId),
    refetchInterval: live ? LIVE_REFETCH_MS : false,
  });

  const weighInsQ = useQuery({
    queryKey: queryKeys.weighIns(competitionId),
    queryFn: () => fetchWeighIns({ competition: competitionId }),
    enabled: Boolean(competitionId),
    refetchInterval: live ? LIVE_REFETCH_MS : false,
  });

  const resultsQ = useQuery({
    queryKey: queryKeys.results(competitionId),
    queryFn: () => fetchResults({ competition: competitionId }),
    enabled: Boolean(competitionId),
    refetchInterval: live ? LIVE_REFETCH_MS : false,
  });

  const standsQ = useQuery({
    queryKey: queryKeys.stands(competitionId),
    queryFn: () => fetchStandsForCompetition(competitionId),
    enabled: Boolean(competitionId),
    refetchInterval: live ? LIVE_REFETCH_MS : false,
  });

  const competition = competitionQ.data ?? null;
  const teams = teamsQ.data ?? [];
  const sectors = sectorsQ.data ?? [];
  const weighIns = weighInsQ.data ?? [];
  const results = resultsQ.data ?? [];
  const stands = standsQ.data ?? [];

  const teamsWithRelations = teams.map((t) => {
    if (t.sectorId && t.competitionId) return t;
    const stand = stands.find((s) => s.teamId === t.id);
    const result = results.find((r) => r.teamId === t.id);
    return {
      ...t,
      sectorId: t.sectorId ?? stand?.sectorId ?? result?.sectorId ?? "",
      competitionId: t.competitionId ?? competitionId,
    };
  });

  const leaderboardRaw =
    results.length > 0
      ? results
          .map((r) => ({
            rank: r.rankPosition ?? 0,
            teamId: r.teamId,
            teamName: teams.find((t) => t.id === r.teamId)?.name ?? r.teamId,
            sectorId: r.sectorId,
            sectorName: sectors.find((s) => s.id === r.sectorId)?.name ?? "—",
            fishCount: r.totalFish,
            totalWeightKg: r.totalWeightKg,
            qualityScoreKg: r.biggestFishKg,
            combinedScore: r.totalWeightKg + r.totalFish,
            primaryScore: r.rankPosition ? 100000 - r.rankPosition : r.totalWeightKg,
          }))
          .sort((a, b) => (a.rank && b.rank ? a.rank - b.rank : b.totalWeightKg - a.totalWeightKg))
          .map((e, i) => ({ ...e, rank: e.rank || i + 1 }))
      : competition
        ? computeLeaderboard({ competition, teams: teamsWithRelations, sectors, weighIns })
        : [];

  const leaderboard = assignSectorAndGeneralRanks(leaderboardRaw);

  const sectorRankings = computeSectorRankings(leaderboard);
  const braila =
    competition && teams.length
      ? computeBraila(competition.id, teams, weighIns)
      : [];

  const isLoading =
    competitionQ.isLoading ||
    teamsQ.isLoading ||
    sectorsQ.isLoading ||
    standsQ.isLoading ||
    weighInsQ.isLoading ||
    resultsQ.isLoading;

  const isError =
    competitionQ.isError ||
    teamsQ.isError ||
    sectorsQ.isError ||
    standsQ.isError ||
    weighInsQ.isError ||
    resultsQ.isError;

  const refetchAll = () =>
    Promise.all([
      competitionQ.refetch(),
      teamsQ.refetch(),
      sectorsQ.refetch(),
      standsQ.refetch(),
      weighInsQ.refetch(),
      resultsQ.refetch(),
    ]);

  return {
    competition,
    teams: teamsWithRelations,
    sectors,
    stands,
    weighIns,
    results,
    leaderboard,
    sectorRankings,
    braila,
    isLoading,
    isError,
    refetchAll,
  };
}
