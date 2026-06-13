import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  const validUser = process.env.CRM_USERNAME;
  const validPass = process.env.CRM_PASSWORD;
  const token = process.env.CRM_SESSION_TOKEN;

  if (!username || !password || username !== validUser || password !== validPass) {
    return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("crm_session", token!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
  return res;
}
