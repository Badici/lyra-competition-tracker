import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  getDjangoApiPrefix,
  getDjangoBase,
  getRefreshPath,
} from "@/lib/env.server";

const COOKIE = "lyra_access_token";
const REFRESH_COOKIE = "lyra_refresh_token";

function buildTargetUrl(pathSegments: string[], search: string): string {
  const base = getDjangoBase();
  const prefix = getDjangoApiPrefix();
  const path = pathSegments.filter(Boolean).join("/");
  const slash = path.length ? `${path}/` : "";
  const q = search.length ? `?${search}` : "";
  return `${base}/${prefix}/${slash}${q}`;
}

async function forward(req: NextRequest, method: string) {
  const path = req.nextUrl.pathname.replace(/^\/api\/django\/?/, "");
  const segments = path ? path.split("/").filter(Boolean) : [];
  const jar = await cookies();
  let token = jar.get(COOKIE)?.value;
  const refreshToken = jar.get(REFRESH_COOKIE)?.value;
  const target = buildTargetUrl(segments, req.nextUrl.searchParams.toString());

  const headers = new Headers();
  const accept = req.headers.get("accept");
  if (accept) headers.set("accept", accept);
  const ct = req.headers.get("content-type");
  if (ct) headers.set("content-type", ct);
  if (token) headers.set("authorization", `Bearer ${token}`);

  const hasBody = !["GET", "HEAD"].includes(method);
  const body = hasBody ? await req.text() : undefined;

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method,
      headers,
      body: body && body.length ? body : undefined,
      cache: "no-store",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Eroare rețea";
    return NextResponse.json(
      { detail: "Nu s-a putut contacta API-ul.", error: msg },
      { status: 502 },
    );
  }

  if (upstream.status === 401 && refreshToken) {
    const refreshUrl = `${getDjangoBase()}/${getDjangoApiPrefix()}/${getRefreshPath()}/`;
    try {
      const rr = await fetch(refreshUrl, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
        cache: "no-store",
      });
      if (rr.ok) {
        const rj = (await rr.json()) as { access?: string };
        if (rj.access) {
          token = rj.access;
          jar.set(COOKIE, token, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 12,
          });
          headers.set("authorization", `Bearer ${token}`);
          upstream = await fetch(target, {
            method,
            headers,
            body: body && body.length ? body : undefined,
            cache: "no-store",
          });
        }
      }
    } catch {
      // keep initial 401 response
    }
  }

  const resCt =
    upstream.headers.get("content-type") ?? "application/json; charset=utf-8";
  const buf = await upstream.arrayBuffer();
  return new NextResponse(buf, {
    status: upstream.status,
    headers: {
      "content-type": resCt,
    },
  });
}

export async function GET(req: NextRequest) {
  return forward(req, "GET");
}
export async function POST(req: NextRequest) {
  return forward(req, "POST");
}
export async function PUT(req: NextRequest) {
  return forward(req, "PUT");
}
export async function PATCH(req: NextRequest) {
  return forward(req, "PATCH");
}
export async function DELETE(req: NextRequest) {
  return forward(req, "DELETE");
}
