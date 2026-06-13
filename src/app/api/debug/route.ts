import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

const LOG_FILE = "/tmp/waha-webhook-debug.json";

// Receive and log raw WAHA webhook payloads
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const entry = { ts: new Date().toISOString(), body };
    let entries: unknown[] = [];
    if (existsSync(LOG_FILE)) {
      try { entries = JSON.parse(readFileSync(LOG_FILE, "utf8")); } catch {}
    }
    entries.unshift(entry);
    entries = entries.slice(0, 20); // Keep last 20
    writeFileSync(LOG_FILE, JSON.stringify(entries, null, 2));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}

// Read captured payloads
export async function GET() {
  try {
    if (!existsSync(LOG_FILE)) return NextResponse.json([]);
    const data = JSON.parse(readFileSync(LOG_FILE, "utf8"));
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([]);
  }
}
