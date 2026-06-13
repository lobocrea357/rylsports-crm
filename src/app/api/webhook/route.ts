import { NextRequest, NextResponse } from "next/server";
import { getAdminPb } from "@/lib/pocketbase";

const MEDIA_TYPES = new Set(["image", "video", "audio", "document", "sticker", "ptt", "voice"]);
const WAHA_URL = process.env.WAHA_URL ?? "http://localhost:3088";
const WAHA_SESSION = process.env.WAHA_SESSION ?? "default";

function guessMediaMime(type: string): string {
  const map: Record<string, string> = {
    image: "image/jpeg", video: "video/mp4",
    audio: "audio/ogg", ptt: "audio/ogg", voice: "audio/ogg",
    document: "application/octet-stream", sticker: "image/webp",
  };
  return map[type] ?? "application/octet-stream";
}

function previewText(msg: Record<string, unknown>, msgType: string): string {
  const body = (msg.body as string) ?? (msg.caption as string) ?? "";
  if (body) return body.slice(0, 100);
  const icons: Record<string, string> = {
    image: "📷 Imagen", video: "🎥 Video", audio: "🎵 Audio",
    ptt: "🎤 Nota de voz", voice: "🎤 Nota de voz",
    document: "📎 Documento", sticker: "🎭 Sticker",
  };
  return icons[msgType] ?? `[${msgType}]`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = body.event as string;
    if (!event?.startsWith("message")) return NextResponse.json({ ok: true });

    const msg = body.payload as Record<string, unknown>;
    if (!msg?.from) return NextResponse.json({ ok: true });

    const from = msg.from as string;
    if (from.includes("@g.us") || from.includes("@lid")) return NextResponse.json({ ok: true });

    const phone = from.replace("@c.us", "").replace(/@\w+$/, "");
    const pb = await getAdminPb();
    const now = new Date((msg.timestamp as number) ? (msg.timestamp as number) * 1000 : Date.now()).toISOString();
    const msgType = (msg.type as string) ?? "text";
    const content = (msg.body as string) ?? (msg.caption as string) ?? "";
    const preview = previewText(msg, msgType);

    // Upsert contact
    let contact = await pb.collection("contacts").getFirstListItem(`phone = "${phone}"`).catch(() => null);
    const notifyName = (msg.notifyName as string) || "";

    if (!contact) {
      contact = await pb.collection("contacts").create({
        phone,
        name: notifyName || phone,
        session: (body.session as string) ?? WAHA_SESSION,
        category: "prospect",
        sale_status: "none",
        last_message_at: now,
        last_message_preview: preview,
      }).catch(async () => pb.collection("contacts").getFirstListItem(`phone = "${phone}"`).catch(() => null));
    } else {
      const updates: Record<string, string> = { last_message_at: now, last_message_preview: preview };
      if (notifyName && notifyName !== contact.name && contact.name === contact.phone) {
        updates.name = notifyName; // Only auto-update name if it's still the phone number
      }
      await pb.collection("contacts").update(contact.id, updates).catch(() => {});
    }

    if (!contact) return NextResponse.json({ ok: true });

    // Media handling
    const isMedia = (msg.hasMedia as boolean) || MEDIA_TYPES.has(msgType);
    let media_url = "";
    let media_mime = "";
    if (isMedia) {
      const mediaObj = msg.media as Record<string, string> | undefined;
      const rawUrl = mediaObj?.url ?? (msg.mediaUrl as string) ?? "";
      if (rawUrl) {
        // Normalize internal WAHA URL to our configured WAHA_URL
        media_url = rawUrl.replace(/https?:\/\/[^/]+/, WAHA_URL);
      } else {
        // Fallback: construct download URL from message ID
        const wahaIdFallback = (msg.id as Record<string, string>)?._serialized ?? String(msg.id ?? `${phone}_${msg.timestamp}`);
        media_url = `${WAHA_URL}/api/${WAHA_SESSION}/messages/${encodeURIComponent(wahaIdFallback)}/download`;
      }
      media_mime = mediaObj?.mimetype ?? (msg.mimetype as string) ?? guessMediaMime(msgType);
    }

    // Save message (idempotent)
    const wahaId = (msg.id as Record<string, string>)?._serialized ?? String(msg.id ?? `${phone}_${msg.timestamp}`);
    const existing = await pb.collection("messages").getFirstListItem(`waha_message_id = "${wahaId}"`).catch(() => null);
    if (!existing) {
      await pb.collection("messages").create({
        contact: contact.id,
        waha_message_id: wahaId,
        content,
        from_me: (msg.fromMe as boolean) ?? false,
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
