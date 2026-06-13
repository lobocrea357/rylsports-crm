import { NextRequest, NextResponse } from "next/server";
import { getAdminPb } from "@/lib/pocketbase";

export async function GET() {
  const pb = await getAdminPb();
  const records = await pb.collection("contacts").getList(1, 500, {
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
