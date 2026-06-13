import { NextRequest, NextResponse } from "next/server";

const WAHA_KEY = process.env.WAHA_API_KEY!;
const WAHA_URL = process.env.WAHA_URL ?? "http://localhost:3088";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return new NextResponse("Missing url", { status: 400 });

  // Only allow proxying WAHA URLs
  if (!url.startsWith(WAHA_URL)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const upstream = await fetch(url, {
      headers: { "X-Api-Key": WAHA_KEY },
      // Don't cache — media may expire from WAHA container
      cache: "no-store",
    });

    if (!upstream.ok) {
      return new NextResponse("Media not available", { status: 404 });
    }

    const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
    const body = await upstream.arrayBuffer();

    return new NextResponse(body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Failed to fetch media", { status: 502 });
  }
}
