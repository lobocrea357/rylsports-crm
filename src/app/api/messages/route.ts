import { NextRequest, NextResponse } from "next/server";
import { getChatMessages } from "@/lib/waha";
import { getAdminPb } from "@/lib/pocketbase";

export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get("phone");
  if (!phone) return NextResponse.json([]);

  const chatId = `${phone}@c.us`;
  const msgs = await getChatMessages(chatId, 80);

  // Persist messages to PocketBase
  try {
    const pb = await getAdminPb();
    const contact = await pb.collection("contacts").getFirstListItem(`phone = "${phone}"`).catch(() => null);
    if (contact) {
      for (const m of msgs) {
        const wahaId = m.id?._serialized ?? m.id ?? `${phone}_${m.timestamp}`;
        const existing = await pb.collection("messages").getFirstListItem(`waha_message_id = "${wahaId}"`).catch(() => null);
        if (!existing) {
          await pb.collection("messages").create({
            contact: contact.id,
            waha_message_id: wahaId,
            content: m.body ?? m.caption ?? "",
            from_me: m.fromMe ?? false,
            timestamp: new Date(m.timestamp * 1000).toISOString(),
            message_type: m.type ?? "text",
          }).catch(() => {});
        }
      }
    }
  } catch {}

  return NextResponse.json(msgs);
}
