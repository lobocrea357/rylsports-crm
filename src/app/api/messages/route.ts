import { NextRequest, NextResponse } from "next/server";
import { getAdminPb } from "@/lib/pocketbase";

export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get("phone");
  if (!phone) return NextResponse.json([]);

  const pb = await getAdminPb();

  const contact = await pb.collection("contacts")
    .getFirstListItem(`phone = "${phone}"`)
    .catch(() => null);

  if (!contact) return NextResponse.json([]);

  const records = await pb.collection("messages").getList(1, 200, {
    filter: `contact = "${contact.id}"`,
    sort: "timestamp",
  });

  return NextResponse.json(records.items);
}
