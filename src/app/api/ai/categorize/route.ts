import { NextRequest, NextResponse } from "next/server";
import { analyzeConversation } from "@/lib/ai";
import { getChatMessages } from "@/lib/waha";
import { getAdminPb } from "@/lib/pocketbase";

export async function POST(req: NextRequest) {
  const { phone, contactId } = await req.json();
  if (!phone || !contactId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const chatId = `${phone}@c.us`;
  const rawMsgs = await getChatMessages(chatId, 40);

  const messages = rawMsgs.map((m: { fromMe: boolean; body?: string; caption?: string; timestamp: number }) => ({
    from_me: m.fromMe ?? false,
    content: m.body ?? m.caption ?? "",
    timestamp: new Date(m.timestamp * 1000).toISOString(),
  }));

  if (messages.length === 0) {
    return NextResponse.json({ category: "prospect", sale_status: "none", summary: "Sin mensajes aún." });
  }

  const analysis = await analyzeConversation(messages);

  // Save to PocketBase
  const pb = await getAdminPb();
  await pb.collection("contacts").update(contactId, {
    category: analysis.category,
    sale_status: analysis.sale_status,
    ai_summary: analysis.summary,
  });

  return NextResponse.json(analysis);
}
