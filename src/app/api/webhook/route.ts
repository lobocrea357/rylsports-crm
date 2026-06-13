import { NextRequest, NextResponse } from "next/server";
import { getAdminPb } from "@/lib/pocketbase";

const MEDIA_TYPES = new Set(["image", "video", "audio", "document", "sticker", "ptt", "voice"]);
const WAHA_URL = process.env.WAHA_URL ?? "http://localhost:3088";
const WAHA_SESSION = process.env.WAHA_SESSION ?? "default";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = body.event as string;
    if (!event?.startsWith("message")) return NextResponse.json({ ok: true });

    const msg = body.payload;
    if (!msg?.from) return NextResponse.json({ ok: true });

    // Skip group messages
    if (msg.from.includes("@g.us")) return NextResponse.json({ ok: true });

    const phone = msg.from.replace("@c.us", "");
    const pb = await getAdminPb();

    // Upsert contact — find or create
    let contact = await pb.collection("contacts")
      .getFirstListItem(`phone = "${phone}"`)
      .catch(() => null);

    const now = new Date(msg.timestamp ? msg.timestamp * 1000 : Date.now()).toISOString();

    if (!contact) {
      contact = await pb.collection("contacts").create({
        phone,
        name: msg.notifyName || phone,
        session: body.session ?? WAHA_SESSION,
        category: "prospect",
        sale_status: "none",
        last_message_at: now,
      }).catch(async () => {
        // Race condition: fetch the one just created by another request
        return pb.collection("contacts").getFirstListItem(`phone = "${phone}"`).catch(() => null);
      });
    } else {
      await pb.collection("contacts").update(contact.id, {
        last_message_at: now,
        ...(msg.notifyName && msg.notifyName !== contact.name ? { name: msg.notifyName } : {}),
      }).catch(() => {});
    }

    if (!contact) return NextResponse.json({ ok: true });

    // Build message data
    const wahaId = msg.id?._serialized ?? msg.id ?? `${phone}_${msg.timestamp}`;
    const msgType = msg.type ?? "text";
    const isMedia = msg.hasMedia || MEDIA_TYPES.has(msgType);
    const content = msg.body ?? msg.caption ?? "";

    // Media URL points to WAHA download endpoint (proxied through /api/media)
    const media_url = isMedia
      ? `${WAHA_URL}/api/${WAHA_SESSION}/messages/${encodeURIComponent(wahaId)}/download`
      : "";
    const media_mime = isMedia ? (msg.mimetype ?? guessMediaMime(msgType)) : "";

    // Idempotent insert
    const existing = await pb.collection("messages")
      .getFirstListItem(`waha_message_id = "${wahaId}"`)
      .catch(() => null);

    if (!existing) {
      await pb.collection("messages").create({
        contact: contact.id,
        waha_message_id: wahaId,
        content,
        from_me: msg.fromMe ?? false,
        timestamp: now,
        message_type: msgType,
        media_url,
        media_mime,
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Webhook error:", e);
    return NextResponse.json({ ok: true });
  }
}

function guessMediaMime(type: string): string {
  const map: Record<string, string> = {
    image: "image/jpeg",
    video: "video/mp4",
    audio: "audio/ogg",
    ptt: "audio/ogg",
    voice: "audio/ogg",
    document: "application/octet-stream",
    sticker: "image/webp",
  };
  return map[type] ?? "application/octet-stream";
}
