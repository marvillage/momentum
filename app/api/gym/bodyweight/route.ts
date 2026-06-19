import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { todayStr } from "@/lib/date";

export async function GET() {
  const w = await prisma.bodyWeight.findMany({ orderBy: { date: "asc" } });
  return NextResponse.json(w);
}

export async function POST(req: Request) {
  const b = await req.json();
  const kg = parseFloat(b.kg);
  if (!kg || kg <= 0) return NextResponse.json({ error: "valid kg required" }, { status: 400 });
  const date: string = b.date || todayStr();

  const existing = await prisma.bodyWeight.findFirst({ where: { date } });
  const w = existing
    ? await prisma.bodyWeight.update({ where: { id: existing.id }, data: { kg } })
    : await prisma.bodyWeight.create({ data: { date, kg } });
  return NextResponse.json(w);
}
