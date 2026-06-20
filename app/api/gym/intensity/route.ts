import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { todayStr } from "@/lib/date";
import { apiUserId } from "@/lib/auth";

export async function GET() {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const ratings = await prisma.workoutRating.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 60 });
  return NextResponse.json(ratings);
}

export async function POST(req: Request) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = await req.json();
  const intensity = Math.max(1, Math.min(5, Math.round(Number(b.intensity) || 0)));
  if (!intensity) return NextResponse.json({ error: "intensity 1-5 required" }, { status: 400 });
  const date: string = b.date || todayStr();

  const existing = await prisma.workoutRating.findFirst({ where: { userId, date } });
  const r = existing
    ? await prisma.workoutRating.update({ where: { id: existing.id }, data: { intensity } })
    : await prisma.workoutRating.create({ data: { userId, date, intensity } });
  return NextResponse.json(r);
}
