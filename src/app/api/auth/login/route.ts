import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getDjangoApiPrefix,
  getDjangoBase,
  getTokenPaths,
} from "@/lib/env.server";

const COOKIE = "lyra_access_token";
const REFRESH_COOKIE = "lyra_refresh_token";
const USERNAME_COOKIE = "lyra_username";

export async function POST(request: Request) {
  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: "Corp invalid." }, { status: 400 });
  }
  const username = body.username?.trim();
  const password = body.password;
  if (!username || !password) {
    return NextResponse.json(
      { detail: "Utilizator și parolă sunt obligatorii." },
      { status: 400 },
    );
  }

  const base = getDjangoBase();
  const prefix = getDjangoApiPrefix();
  const paths = getTokenPaths();
  let lastStatus = 503;
  let lastText = "";
  let authFailureStatus: number | null = null;
  let authFailureText = "";

  for (const p of paths) {
    const url = `${base}/${prefix}/${p}/`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        cache: "no-store",
      });
      lastStatus = res.status;
      const text = await res.text();
      lastText = text;
      if (!res.ok) {
        // Keep trying only when endpoint doesn't exist.
        // For 400/401/403 we already reached a valid auth endpoint and should return that error.
        if (res.status === 404) continue;
        authFailureStatus = res.status;
        authFailureText = text;
        break;
      }

      let json: Record<string, unknown>;
      try {
        json = JSON.parse(text) as Record<string, unknown>;
      } catch {
        continue;
      }
      const access = json.access ?? json.access_token ?? json.token;
      const refresh = json.refresh ?? json.refresh_token;
      if (typeof access !== "string" || !access.length) continue;

      const jar = await cookies();
      const secure = process.env.NODE_ENV === "production";
      jar.set(COOKIE, access, {
        httpOnly: true,
        sameSite: "lax",
        secure,
        path: "/",
        maxAge: 60 * 60 * 12,
      });
      if (typeof refresh === "string" && refresh.length) {
        jar.set(REFRESH_COOKIE, refresh, {
          httpOnly: true,
          sameSite: "lax",
          secure,
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });
      }
      jar.set(USERNAME_COOKIE, username, {
        httpOnly: true,
        sameSite: "lax",
        secure,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      return NextResponse.json({ ok: true });
    } catch {
      lastStatus = 503;
    }
  }

  return NextResponse.json(
    {
      detail:
        authFailureStatus != null
          ? "Autentificare eșuată. Verifică utilizatorul/parola."
          : "Autentificare eșuată. Verifică URL-ul API și căile token din variabilele de mediu.",
      upstreamStatus: authFailureStatus ?? lastStatus,
      hint: (authFailureStatus != null ? authFailureText : lastText)?.slice(0, 300),
    },
    { status: 401 },
  );
}
