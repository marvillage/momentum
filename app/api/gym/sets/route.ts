import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { todayStr } from "@/lib/date";
import { apiUserId } from "@/lib/auth";

export async function GET(req: Request) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const date = new URL(req.url).searchParams.get("date") || todayStr();
  const sets = await prisma.setLog.findMany({ where: { userId, date }, orderBy: { createdAt: "asc" } });
  return NextResponse.json(sets);
}

export async function POST(req: Request) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = await req.json();
  const exercise = (b.exercise || "").trim();
  const reps = Math.max(0, Math.round(Number(b.reps) || 0));
  const weight = Math.max(0, Number(b.weight) || 0);
  if (!exercise) return NextResponse.json({ error: "exercise required" }, { status: 400 });
  const set = await prisma.setLog.create({ data: { userId, date: b.date || todayStr(), exercise, reps, weight } });
  return NextResponse.json(set);
}
