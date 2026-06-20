import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { todayStr } from "@/lib/date";
import { apiUserId } from "@/lib/auth";

export async function GET(req: Request) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const date = new URL(req.url).searchParams.get("date") || todayStr();
  const logs = await prisma.foodLog.findMany({ where: { userId, date }, orderBy: { createdAt: "asc" } });
  return NextResponse.json(logs);
}

export async function POST(req: Request) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = await req.json();
  const name: string = (b.name || "").trim();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const log = await prisma.foodLog.create({
    data: {
      userId,
      date: b.date || todayStr(),
      bucket: b.bucket || "SNACK",
      name,
      kcal: Math.max(0, Math.round(Number(b.kcal) || 0)),
      protein: Math.max(0, Math.round(Number(b.protein) || 0)),
    },
  });
  return NextResponse.json(log);
}
