import { normalizeUser } from "@/lib/api/normalize";
import {
  getDjangoApiPrefix,
  getDjangoBase,
  getMeAlternatePaths,
  getMePath,
  getStaffUsernameAllowlist,
} from "@/lib/env.server";
import type { AuthUser } from "@/types/models";

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const json = Buffer.from(parts[1], "base64url").toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Unele backend-uri pun is_staff într-un obiect nested în JWT (ex. claim "user").
 */
function deepCollectStaffFields(
  obj: unknown,
  depth = 0,
): Record<string, unknown> {
  if (depth > 10 || !obj || typeof obj !== "object") return {};
  const acc: Record<string, unknown> = {};
  const o = obj as Record<string, unknown>;
  for (const [k, v] of Object.entries(o)) {
    if (k === "is_staff" || k === "isStaff") acc.is_staff = v;
    if (k === "is_superuser" || k === "isSuperuser") acc.is_superuser = v;
    if (k === "is_admin" || k === "isAdmin") acc.is_admin = v;
    if (k === "role" || k === "user_role" || k === "userRole") {
      if (v != null) acc.role = v;
    }
  }
  for (const v of Object.values(o)) {
    if (v && typeof v === "object") {
      Object.assign(acc, deepCollectStaffFields(v, depth + 1));
    }
  }
  return acc;
}

function mergeJwtStaffClaimsDeep(
  stub: Record<string, unknown>,
  token: string,
): Record<string, unknown> {
  const payload = decodeJwtPayload(token);
  if (!payload) return stub;
  const fromJwt = deepCollectStaffFields(payload);
  return { ...stub, ...fromJwt };
}

function extractUserRecord(
  raw: unknown,
  username: string | undefined,
): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (Array.isArray(raw)) {
    const arr = raw as Record<string, unknown>[];
    if (username) {
      const mine = arr.find((u) => String(u.username ?? "") === username);
      if (mine) return mine;
    }
    return arr[0] ?? null;
  }
  if ("results" in o && Array.isArray(o.results)) {
    const arr = o.results as Record<string, unknown>[];
    if (username) {
      const mine = arr.find((u) => String(u.username ?? "") === username);
      if (mine) return mine;
    }
    return arr[0] ?? null;
  }
  if (o.id != null && o.username != null) return o;
  return null;
}

async function fetchJson(
  url: string,
  token: string,
): Promise<unknown | null> {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  try {
    return (await res.json()) as unknown;
  } catch {
    return null;
  }
}

function shouldFetchUserById(mePath: string): boolean {
  const t = mePath.replace(/\/$/, "");
  if (t === "" || t === "me") return false;
  if (t.endsWith("/me")) return false;
  return true;
}

/**
 * Detaliu GET /{mePath}/{id}/ — adesea expune is_superuser față de lista publică.
 */
async function enrichWithUserDetail(
  stub: Record<string, unknown>,
  token: string,
  base: string,
  prefix: string,
  mePath: string,
): Promise<Record<string, unknown>> {
  if (!shouldFetchUserById(mePath)) return stub;
  const id = stub.id;
  if (id == null) return stub;
  const detailUrl = `${base}/${prefix}/${mePath}/${String(id)}/`;
  const detail = await fetchJson(detailUrl, token);
  if (!detail || typeof detail !== "object" || Array.isArray(detail)) {
    return stub;
  }
  return { ...stub, ...(detail as Record<string, unknown>) };
}

function samePerson(
  base: Record<string, unknown>,
  candidate: Record<string, unknown>,
  username: string | undefined,
): boolean {
  if (username && String(candidate.username ?? "") === username) return true;
  if (base.id != null && candidate.id != null) {
    if (String(base.id) === String(candidate.id)) return true;
  }
  const bu = String(base.username ?? "");
  const cu = String(candidate.username ?? "");
  if (bu && cu && bu === cu) return true;
  return false;
}

function asSingleRecord(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if ("results" in o && Array.isArray(o.results) && o.results[0]) {
    const first = o.results[0];
    if (first && typeof first === "object" && !Array.isArray(first)) {
      return first as Record<string, unknown>;
    }
  }
  if (o.id != null) return o;
  return null;
}

/** Încearcă căi tipice care returnează userul curent cu câmpuri complete. */
async function mergeAlternateMeProfiles(
  merged: Record<string, unknown>,
  token: string,
  base: string,
  prefix: string,
  username: string | undefined,
): Promise<Record<string, unknown>> {
  let out = { ...merged };
  for (const p of getMeAlternatePaths()) {
    const url = `${base}/${prefix}/${p}/`;
    const raw = await fetchJson(url, token);
    const candidate = asSingleRecord(raw);
    if (!candidate) continue;
    if (!samePerson(out, candidate, username)) continue;
    out = { ...out, ...candidate };
  }
  return out;
}

/**
 * Rezolvă utilizatorul curent din Django și îl normalizează pentru RBAC în frontend.
 */
export async function resolveDjangoMeUser(
  token: string,
  username: string | undefined,
): Promise<AuthUser | null> {
  const base = getDjangoBase();
  const prefix = getDjangoApiPrefix();
  const mePath = getMePath();
  const listUrl = `${base}/${prefix}/${mePath}/`;

  let record: Record<string, unknown> | null = null;

  if (username) {
    const filteredUrl = `${listUrl}?${new URLSearchParams({ username }).toString()}`;
    const filtered = await fetchJson(filteredUrl, token);
    record = extractUserRecord(filtered, username);
  }

  if (!record) {
    const raw = await fetchJson(listUrl, token);
    record = extractUserRecord(raw, username);
  }

  if (!record) return null;

  let merged = await enrichWithUserDetail(record, token, base, prefix, mePath);
  merged = await mergeAlternateMeProfiles(merged, token, base, prefix, username);
  merged = mergeJwtStaffClaimsDeep(merged, token);

  if (username) {
    const allow = getStaffUsernameAllowlist();
    if (allow.has(username.trim().toLowerCase())) {
      merged = { ...merged, is_staff: true, is_superuser: true };
    }
  }

  return normalizeUser(merged);
}
