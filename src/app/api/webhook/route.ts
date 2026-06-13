import { NextRequest, NextResponse } from "next/server";
import { getAdminPb } from "@/lib/pocketbase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = body.event;
    if (event !== "message" && event !== "message.any") return NextResponse.json({ ok: true });

    const msg = body.payload;
    if (!msg || !msg.from) return NextResponse.json({ ok: true });

    const phone = msg.from.replace("@c.us", "").replace("@g.us", "");
    const isGroup = msg.from.includes("@g.us");
    if (isGroup) return NextResponse.json({ ok: true });

    const pb = await getAdminPb();

    // Upsert contact
    let contact;
    try {
      const records = await pb.collection("contacts").getList(1, 1, {
        filter: `phone = "${phone}"`,
      });
      if (records.items.length > 0) {
        contact = records.items[0];
        await pb.collection("contacts").update(contact.id, {
          last_message_at: new Date(msg.timestamp * 1000).toISOString(),
        });
      } else {
        contact = await pb.collection("contacts").create({
          phone,
          name: msg.notifyName || phone,
          session: body.session ?? "default",
          category: "prospect",
          sale_status: "none",
          last_message_at: new Date(msg.timestamp * 1000).toISOString(),
        });
      }
    } catch {
      return NextResponse.json({ ok: true });
    }

    // Save message
    const wahaId = msg.id?._serialized ?? msg.id ?? `${phone}_${msg.timestamp}`;
    try {
      await pb.collection("messages").getFirstListItem(`waha_message_id = "${wahaId}"`);
    } catch {
      await pb.collection("messages").create({
        contact: contact.id,
        waha_message_id: wahaId,
        content: msg.body ?? msg.caption ?? "",
        from_me: msg.fromMe ?? false,
        timestamp: new Date(msg.timestamp * 1000).toISOString(),
        message_type: msg.type ?? "text",
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Webhook error:", e);
    return NextResponse.json({ ok: true });
  }
}
