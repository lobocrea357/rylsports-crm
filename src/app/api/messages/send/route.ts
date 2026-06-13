import { NextRequest, NextResponse } from "next/server";
import { sendMessage } from "@/lib/waha";
import { getAdminPb } from "@/lib/pocketbase";

export async function POST(req: NextRequest) {
  const { phone, text } = await req.json();
  if (!phone || !text) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const result = await sendMessage(`${phone}@c.us`, text);

  try {
    const pb = await getAdminPb();
    const contact = await pb.collection("contacts")
      .getFirstListItem(`phone = "${phone}"`)
      .catch(() => null);

    if (contact) {
      const now = new Date().toISOString();
      await pb.collection("messages").create({
        contact: contact.id,
        waha_message_id: result?.id?._serialized ?? `out_${Date.now()}`,
        content: text,
        from_me: true,
        timestamp: now,
        message_type: "text",
        media_url: "",
        media_mime: "",
      });
      await pb.collection("contacts").update(contact.id, { last_message_at: now });
    }
  } catch {}

  return NextResponse.json(result);
}
