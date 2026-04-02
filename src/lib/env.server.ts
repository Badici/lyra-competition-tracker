function trimSlash(s: string): string {
  return s.replace(/\/$/, "");
}

/** Base origin of Django (no trailing slash). Defaults for local dev if unset. */
export function getDjangoBase(): string {
  const v = process.env.DJANGO_API_BASE?.trim();
  if (!v) {
    return "https://fishtopia.cuibusoru.ro";
  }
  return trimSlash(v);
}

/** First path segment after host, e.g. `api` -> `https://host/api/...` */
export function getDjangoApiPrefix(): string {
  const raw = process.env.DJANGO_API_URL_PREFIX ?? "api";
  return raw.replace(/^\/+|\/+$/g, "");
}

/**
 * Comma-separated token paths relative to prefix, tried in order.
 * Example: `token,auth/token`
 */
export function getTokenPaths(): string[] {
  const raw =
    process.env.DJANGO_TOKEN_PATHS ??
    "auth/token,token,auth/login";
  return raw
    .split(",")
    .map((s) => s.trim().replace(/^\/+|\/+$/g, ""))
    .filter(Boolean);
}

export function getMePath(): string {
  const raw = process.env.DJANGO_ME_PATH ?? "users";
  return raw.replace(/^\/+|\/+$/g, "");
}

export function getRefreshPath(): string {
  const raw = process.env.DJANGO_REFRESH_PATH ?? "auth/token/refresh";
  return raw.replace(/^\/+|\/+$/g, "");
}

/**
 * Căi suplimentare încercate pentru profilul complet (is_staff), separate prin virgulă.
 * Ex.: users/me,auth/user
 */
export function getMeAlternatePaths(): string[] {
  const raw =
    process.env.DJANGO_ME_ALTERNATE_PATHS ??
    "users/me,auth/user,auth/me";
  return raw
    .split(",")
    .map((s) => s.trim().replace(/^\/+|\/+$/g, ""))
    .filter(Boolean);
}

/**
 * Utilizatori tratați ca Django staff/superuser în UI când API-ul nu expune is_staff.
 * Lista separată prin virgulă, case-insensitive (ex.: raresb,badici).
 */
export function getStaffUsernameAllowlist(): Set<string> {
  const raw =
    process.env.LYRA_STAFF_USERNAMES ??
    process.env.DJANGO_STAFF_USERNAMES ??
    "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}
