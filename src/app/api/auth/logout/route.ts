import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const COOKIE = "lyra_access_token";
const REFRESH_COOKIE = "lyra_refresh_token";
const USERNAME_COOKIE = "lyra_username";

export async function POST() {
  const jar = await cookies();
  jar.delete(COOKIE);
  jar.delete(REFRESH_COOKIE);
  jar.delete(USERNAME_COOKIE);
  return NextResponse.json({ ok: true });
}
