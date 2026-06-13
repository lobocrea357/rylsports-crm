import { NextRequest, NextResponse } from "next/server";
import { getAdminPb } from "@/lib/pocketbase";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pb = await getAdminPb();
  const data = await req.json();
  const record = await pb.collection("contacts").update(id, data);
  return NextResponse.json(record);
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pb = await getAdminPb();
  const record = await pb.collection("contacts").getOne(id);
  return NextResponse.json(record);
}
