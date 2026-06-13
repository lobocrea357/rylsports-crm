import { NextRequest, NextResponse } from "next/server";
import { sendMessage } from "@/lib/waha";
import { getAdminPb } from "@/lib/pocketbase";

export async function POST(req: NextRequest) {
  const { phone, text } = await req.json();
  if (!phone || !text) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const chatId = `${phone}@c.us`;
  const result = await sendMessage(chatId, text);

  // Save outgoing message to PocketBase
  try {
    const pb = await getAdminPb();
    const contact = await pb.collection("contacts").getFirstListItem(`phone = "${phone}"`).catch(() => null);
    if (contact) {
      await pb.collection("messages").create({
        contact: contact.id,
        waha_message_id: result.id?._serialized ?? `out_${Date.now()}`,
        content: text,
        from_me: true,
        timestamp: new Date().toISOString(),
        message_type: "text",
      });
      await pb.collection("contacts").update(contact.id, { last_message_at: new Date().toISOString() });
    }
  } catch {}

  return NextResponse.json(result);
}
