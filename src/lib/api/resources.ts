import { apiClient } from "@/lib/api/client";
import {
  normalizeCompetition,
  normalizeLake,
  normalizeLakeRegulation,
  normalizePrize,
  normalizeRegulation,
  normalizeResult,
  normalizeSector,
  normalizeStand,
  normalizeTeam,
  normalizeTeamMember,
  normalizeUser,
  normalizeWeighIn,
} from "@/lib/api/normalize";
import { resourcePaths } from "@/lib/api/resourcePaths";
import { unwrapDetail, unwrapList } from "@/lib/api/unwrap";
import type {
  Competition,
  CompetitionResult,
  Lake,
  LakeRegulationLink,
  Prize,
  Regulation,
  Sector,
  Stand,
  Team,
  TeamMember,
  AuthUser,
  WeighIn,
} from "@/types/models";

function asRecord(x: unknown): Record<string, unknown> {
  return x && typeof x === "object" ? (x as Record<string, unknown>) : {};
}

function withQuery(path: string, search: URLSearchParams): string {
  const q = search.toString();
  return q ? `${path}?${q}` : path;
}

export async function fetchCompetitions(): Promise<Competition[]> {
  const { data } = await apiClient.get<unknown>(
    `/${resourcePaths.competitions}/`,
  );
  return unwrapList<Record<string, unknown>>(data).map(normalizeCompetition);
}

export async function fetchCompetition(id: string): Promise<Competition | null> {
  const { data } = await apiClient.get<unknown>(
    `/${resourcePaths.competitions}/${id}/`,
  );
  const r = unwrapDetail<Record<string, unknown>>(data);
  return r ? normalizeCompetition(r) : null;
}

export async function createCompetition(
  payload: Record<string, unknown>,
): Promise<Competition> {
  const { data } = await apiClient.post<unknown>(
    `/${resourcePaths.competitions}/`,
    payload,
  );
  return normalizeCompetition(asRecord(data));
}

export async function updateCompetition(
  id: string,
  payload: Record<string, unknown>,
): Promise<Competition> {
  const { data } = await apiClient.patch<unknown>(
    `/${resourcePaths.competitions}/${id}/`,
    payload,
  );
  return normalizeCompetition(asRecord(data));
}

export async function deleteCompetition(id: string): Promise<void> {
  await apiClient.delete(`/${resourcePaths.competitions}/${id}/`);
}

export async function fetchTeams(params?: {
  competition?: string;
}): Promise<Team[]> {
  const search = new URLSearchParams();
  if (params?.competition) search.set("contest", params.competition);
  const { data } = await apiClient.get<unknown>(
    withQuery(`/${resourcePaths.teams}/`, search),
  );
  return unwrapList<Record<string, unknown>>(data).map(normalizeTeam);
}

export async function createTeam(
  payload: Record<string, unknown>,
): Promise<Team> {
  const { data } = await apiClient.post<unknown>(
    `/${resourcePaths.teams}/`,
    payload,
  );
  return normalizeTeam(asRecord(data));
}

export async function updateTeam(
  id: string,
  payload: Record<string, unknown>,
): Promise<Team> {
  const { data } = await apiClient.patch<unknown>(
    `/${resourcePaths.teams}/${id}/`,
    payload,
  );
  return normalizeTeam(asRecord(data));
}

export async function deleteTeam(id: string): Promise<void> {
  await apiClient.delete(`/${resourcePaths.teams}/${id}/`);
}

export async function fetchTeamsAll(): Promise<Team[]> {
  const { data } = await apiClient.get<unknown>(`/${resourcePaths.teams}/`);
  return unwrapList<Record<string, unknown>>(data).map(normalizeTeam);
}

export async function fetchSectors(params?: {
  competition?: string;
}): Promise<Sector[]> {
  const search = new URLSearchParams();
  if (params?.competition) search.set("contest", params.competition);
  const { data } = await apiClient.get<unknown>(
    withQuery(`/${resourcePaths.sectors}/`, search),
  );
  return unwrapList<Record<string, unknown>>(data).map(normalizeSector);
}

export async function createSector(
  payload: Record<string, unknown>,
): Promise<Sector> {
  const { data } = await apiClient.post<unknown>(
    `/${resourcePaths.sectors}/`,
    payload,
  );
  return normalizeSector(asRecord(data));
}

export async function updateSector(
  id: string,
  payload: Record<string, unknown>,
): Promise<Sector> {
  const { data } = await apiClient.patch<unknown>(
    `/${resourcePaths.sectors}/${id}/`,
    payload,
  );
  return normalizeSector(asRecord(data));
}

export async function deleteSector(id: string): Promise<void> {
  await apiClient.delete(`/${resourcePaths.sectors}/${id}/`);
}

export async function fetchWeighIns(params?: {
  competition?: string;
  team?: string;
}): Promise<WeighIn[]> {
  const search = new URLSearchParams();
  if (params?.competition) search.set("contest", params.competition);
  if (params?.team) search.set("team", params.team);
  const { data } = await apiClient.get<unknown>(
    withQuery(`/${resourcePaths.weighIns}/`, search),
  );
  return unwrapList<Record<string, unknown>>(data).map(normalizeWeighIn);
}

export async function createWeighIn(
  payload: Record<string, unknown>,
): Promise<WeighIn> {
  const { data } = await apiClient.post<unknown>(
    `/${resourcePaths.weighIns}/`,
    payload,
  );
  return normalizeWeighIn(asRecord(data));
}

export async function updateWeighIn(
  id: string,
  payload: Record<string, unknown>,
): Promise<WeighIn> {
  const { data } = await apiClient.patch<unknown>(
    `/${resourcePaths.weighIns}/${id}/`,
    payload,
  );
  return normalizeWeighIn(asRecord(data));
}

export async function deleteWeighIn(id: string): Promise<void> {
  await apiClient.delete(`/${resourcePaths.weighIns}/${id}/`);
}

export async function fetchCapturesAll(): Promise<WeighIn[]> {
  const { data } = await apiClient.get<unknown>(`/${resourcePaths.weighIns}/`);
  return unwrapList<Record<string, unknown>>(data).map(normalizeWeighIn);
}

export async function fetchResults(params?: {
  competition?: string;
}): Promise<CompetitionResult[]> {
  const search = new URLSearchParams();
  if (params?.competition) search.set("contest", params.competition);
  const { data } = await apiClient.get<unknown>(
    withQuery(`/${resourcePaths.results}/`, search),
  );
  return unwrapList<Record<string, unknown>>(data).map(normalizeResult);
}

export async function fetchResultsAll(): Promise<CompetitionResult[]> {
  const { data } = await apiClient.get<unknown>(`/${resourcePaths.results}/`);
  return unwrapList<Record<string, unknown>>(data).map(normalizeResult);
}

export async function createResult(
  payload: Record<string, unknown>,
): Promise<CompetitionResult> {
  const { data } = await apiClient.post<unknown>(
    `/${resourcePaths.results}/`,
    payload,
  );
  return normalizeResult(asRecord(data));
}

export async function updateResult(
  id: string,
  payload: Record<string, unknown>,
): Promise<CompetitionResult> {
  const { data } = await apiClient.patch<unknown>(
    `/${resourcePaths.results}/${id}/`,
    payload,
  );
  return normalizeResult(asRecord(data));
}

export async function deleteResult(id: string): Promise<void> {
  await apiClient.delete(`/${resourcePaths.results}/${id}/`);
}

export async function fetchStands(params?: {
  sector?: string;
  lake?: string;
  contest?: string;
}): Promise<Stand[]> {
  const search = new URLSearchParams();
  if (params?.sector) search.set("sector", params.sector);
  if (params?.lake) search.set("lake", params.lake);
  if (params?.contest) search.set("contest", params.contest);
  const { data } = await apiClient.get<unknown>(
    withQuery(`/${resourcePaths.stands}/`, search),
  );
  return unwrapList<Record<string, unknown>>(data).map(normalizeStand);
}

/** Standuri din toate sectoarele unui concurs (repartizare echipe / cântăriri). */
export async function fetchStandsForCompetition(
  competitionId: string,
): Promise<Stand[]> {
  const sectors = await fetchSectors({ competition: competitionId });
  const byContest = await fetchStands({ contest: competitionId }).catch(
    () => [] as Stand[],
  );
  if (byContest.length > 0) return byContest;
  const chunks = await Promise.all(
    sectors.map((s) => fetchStands({ sector: s.id })),
  );
  return chunks.flat();
}

export async function fetchStandsAll(): Promise<Stand[]> {
  const { data } = await apiClient.get<unknown>(`/${resourcePaths.stands}/`);
  return unwrapList<Record<string, unknown>>(data).map(normalizeStand);
}

export async function updateStand(
  id: string,
  payload: Record<string, unknown>,
): Promise<Stand> {
  const { data } = await apiClient.patch<unknown>(
    `/${resourcePaths.stands}/${id}/`,
    payload,
  );
  return normalizeStand(asRecord(data));
}

export async function deleteStand(id: string): Promise<void> {
  await apiClient.delete(`/${resourcePaths.stands}/${id}/`);
}

export async function fetchLakes(): Promise<Lake[]> {
  const { data } = await apiClient.get<unknown>(`/${resourcePaths.lakes}/`);
  return unwrapList<Record<string, unknown>>(data).map(normalizeLake);
}

export async function createLake(
  payload: Record<string, unknown>,
): Promise<Lake> {
  const { data } = await apiClient.post<unknown>(
    `/${resourcePaths.lakes}/`,
    payload,
  );
  return normalizeLake(asRecord(data));
}

export async function updateLake(
  id: string,
  payload: Record<string, unknown>,
): Promise<Lake> {
  const { data } = await apiClient.patch<unknown>(
    `/${resourcePaths.lakes}/${id}/`,
    payload,
  );
  return normalizeLake(asRecord(data));
}

export async function deleteLake(id: string): Promise<void> {
  await apiClient.delete(`/${resourcePaths.lakes}/${id}/`);
}

export async function fetchUsers(): Promise<AuthUser[]> {
  const { data } = await apiClient.get<unknown>(`/${resourcePaths.users}/`);
  return unwrapList<Record<string, unknown>>(data).map(normalizeUser);
}

export async function createUser(
  payload: Record<string, unknown>,
): Promise<AuthUser> {
  const { data } = await apiClient.post<unknown>(
    `/${resourcePaths.users}/`,
    payload,
  );
  return normalizeUser(asRecord(data));
}

export async function updateUser(
  id: string,
  payload: Record<string, unknown>,
): Promise<AuthUser> {
  const { data } = await apiClient.patch<unknown>(
    `/${resourcePaths.users}/${id}/`,
    payload,
  );
  return normalizeUser(asRecord(data));
}

export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(`/${resourcePaths.users}/${id}/`);
}

export async function fetchPrizes(params?: {
  competition?: string;
}): Promise<Prize[]> {
  const search = new URLSearchParams();
  if (params?.competition) search.set("contest", params.competition);
  const { data } = await apiClient.get<unknown>(
    withQuery(`/${resourcePaths.prizes}/`, search),
  );
  return unwrapList<Record<string, unknown>>(data).map(normalizePrize);
}

export async function createStand(payload: Record<string, unknown>): Promise<Stand> {
  const { data } = await apiClient.post<unknown>(`/${resourcePaths.stands}/`, payload);
  return normalizeStand(asRecord(data));
}

export async function fetchRegulations(): Promise<Regulation[]> {
  const { data } = await apiClient.get<unknown>(
    `/${resourcePaths.regulations}/`,
  );
  return unwrapList<Record<string, unknown>>(data).map(normalizeRegulation);
}

export async function createRegulation(
  payload: Record<string, unknown>,
): Promise<Regulation> {
  const { data } = await apiClient.post<unknown>(
    `/${resourcePaths.regulations}/`,
    payload,
  );
  return normalizeRegulation(asRecord(data));
}

export async function updateRegulation(
  id: string,
  payload: Record<string, unknown>,
): Promise<Regulation> {
  const { data } = await apiClient.patch<unknown>(
    `/${resourcePaths.regulations}/${id}/`,
    payload,
  );
  return normalizeRegulation(asRecord(data));
}

export async function deleteRegulation(id: string): Promise<void> {
  await apiClient.delete(`/${resourcePaths.regulations}/${id}/`);
}

export async function fetchLakeRegulations(params?: {
  lake?: string;
}): Promise<LakeRegulationLink[]> {
  const search = new URLSearchParams();
  if (params?.lake) search.set("lake", params.lake);
  const { data } = await apiClient.get<unknown>(
    withQuery(`/${resourcePaths.lakeRegulations}/`, search),
  );
  return unwrapList<Record<string, unknown>>(data).map(normalizeLakeRegulation);
}

export async function createLakeRegulation(
  payload: Record<string, unknown>,
): Promise<LakeRegulationLink> {
  const { data } = await apiClient.post<unknown>(
    `/${resourcePaths.lakeRegulations}/`,
    payload,
  );
  return normalizeLakeRegulation(asRecord(data));
}

export async function deleteLakeRegulation(id: string): Promise<void> {
  await apiClient.delete(`/${resourcePaths.lakeRegulations}/${id}/`);
}

export async function fetchTeamMembers(params?: {
  team?: string;
}): Promise<TeamMember[]> {
  const search = new URLSearchParams();
  if (params?.team) search.set("team", params.team);
  const { data } = await apiClient.get<unknown>(
    withQuery(`/${resourcePaths.teamMembers}/`, search),
  );
  return unwrapList<Record<string, unknown>>(data).map(normalizeTeamMember);
}

export async function createTeamMember(
  payload: Record<string, unknown>,
): Promise<TeamMember> {
  const { data } = await apiClient.post<unknown>(
    `/${resourcePaths.teamMembers}/`,
    payload,
  );
  return normalizeTeamMember(asRecord(data));
}

export async function updateTeamMember(
  id: string,
  payload: Record<string, unknown>,
): Promise<TeamMember> {
  const { data } = await apiClient.patch<unknown>(
    `/${resourcePaths.teamMembers}/${id}/`,
    payload,
  );
  return normalizeTeamMember(asRecord(data));
}

export async function deleteTeamMember(id: string): Promise<void> {
  await apiClient.delete(`/${resourcePaths.teamMembers}/${id}/`);
}
