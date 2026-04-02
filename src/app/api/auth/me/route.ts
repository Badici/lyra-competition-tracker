import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { resolveDjangoMeUser } from "@/lib/auth/djangoMeUser";

const COOKIE = "lyra_access_token";
const USERNAME_COOKIE = "lyra_username";

export async function GET() {
  const token = (await cookies()).get(COOKIE)?.value;
  const username = (await cookies()).get(USERNAME_COOKIE)?.value;
  if (!token) {
    return NextResponse.json(null, { status: 401 });
  }

  try {
    const user = await resolveDjangoMeUser(token, username);
    if (!user) {
      return NextResponse.json(null, { status: 404 });
    }
    return NextResponse.json(user);
  } catch {
    return NextResponse.json(null, { status: 503 });
  }
}
