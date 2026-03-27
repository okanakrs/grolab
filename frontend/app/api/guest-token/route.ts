import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const COOKIE_NAME = "guest_token";
const TTL_SECONDS = 60 * 60 * 24; // 24 saat

export async function GET() {
  const cookieStore = await cookies();
  let token = cookieStore.get(COOKIE_NAME)?.value;

  const response = NextResponse.json({ token: token ?? null });

  if (!token) {
    token = crypto.randomUUID();
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: TTL_SECONDS,
    });
  }

  return response;
}
