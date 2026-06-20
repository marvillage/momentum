import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { todayStr } from "@/lib/date";
import { apiUserId } from "@/lib/auth";

export async function GET() {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const w = await prisma.bodyWeight.findMany({ where: { userId }, orderBy: { date: "asc" } });
  return NextResponse.json(w);
}

export async function POST(req: Request) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = await req.json();
  const kg = parseFloat(b.kg);
  if (!kg || kg <= 0) return NextResponse.json({ error: "valid kg required" }, { status: 400 });
  const date: string = b.date || todayStr();

  const existing = await prisma.bodyWeight.findFirst({ where: { userId, date } });
  const w = existing
    ? await prisma.bodyWeight.update({ where: { id: existing.id }, data: { kg } })
    : await prisma.bodyWeight.create({ data: { userId, date, kg } });
  return NextResponse.json(w);
}
