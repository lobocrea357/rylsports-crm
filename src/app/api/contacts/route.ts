import { NextRequest, NextResponse } from "next/server";
import { getAdminPb } from "@/lib/pocketbase";
import { getChats } from "@/lib/waha";

export async function GET() {
  const pb = await getAdminPb();

  // Sync chats from WAHA into PocketBase
  try {
    const chats = await getChats();
    for (const chat of chats) {
      if (chat.id?.includes("@g.us")) continue;
      const phone = chat.id?.replace("@c.us", "") ?? "";
      if (!phone) continue;
      try {
        const existing = await pb.collection("contacts").getFirstListItem(`phone = "${phone}"`).catch(() => null);
        if (!existing) {
          await pb.collection("contacts").create({
            phone,
            name: chat.name || phone,
            session: process.env.WAHA_SESSION ?? "default",
            category: "prospect",
            sale_status: "none",
            last_message_at: chat.lastMessage?.timestamp
              ? new Date(chat.lastMessage.timestamp * 1000).toISOString()
              : new Date().toISOString(),
          });
        } else if (chat.name && chat.name !== existing.name) {
          await pb.collection("contacts").update(existing.id, { name: chat.name });
        }
      } catch {}
    }
  } catch {}

  const records = await pb.collection("contacts").getList(1, 200, {
    sort: "-last_message_at",
  });

  return NextResponse.json(records.items);
}

export async function POST(req: NextRequest) {
  const pb = await getAdminPb();
  const data = await req.json();
  const record = await pb.collection("contacts").create(data);
  return NextResponse.json(record);
}
