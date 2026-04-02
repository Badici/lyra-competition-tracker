/** Configurable REST resource path segments (after /api/). */

function seg(name: string, fallback: string): string {
  const v = process.env[name]?.trim().replace(/^\/+|\/+$/g, "");
  return v || fallback;
}

export const resourcePaths = {
  competitions: seg("DJANGO_RESOURCE_COMPETITIONS", "contests"),
  teams: seg("DJANGO_RESOURCE_TEAMS", "teams"),
  sectors: seg("DJANGO_RESOURCE_SECTORS", "sectors"),
  stands: seg("DJANGO_RESOURCE_STANDS", "stands"),
  weighIns: seg("DJANGO_RESOURCE_WEIGH_INS", "captures"),
  results: seg("DJANGO_RESOURCE_RESULTS", "results"),
  lakes: seg("DJANGO_RESOURCE_LAKES", "lakes"),
  users: seg("DJANGO_RESOURCE_USERS", "users"),
  prizes: seg("DJANGO_RESOURCE_PRIZES", "results"),
  regulations: seg("DJANGO_RESOURCE_REGULATIONS", "regulations"),
  lakeRegulations: seg("DJANGO_RESOURCE_LAKE_REGULATIONS", "lake-regulations"),
  teamMembers: seg("DJANGO_RESOURCE_TEAM_MEMBERS", "team-members"),
};
