import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiUserId } from "@/lib/auth";

export async function GET(req: Request) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const dow = new URL(req.url).searchParams.get("dow");
  const where = dow ? { userId, dow: parseInt(dow, 10) } : { userId };
  const ex = await prisma.gymExercise.findMany({ where, orderBy: [{ dow: "asc" }, { order: "asc" }] });
  return NextResponse.json(ex);
}

export async function POST(req: Request) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = await req.json();
  if (!b.name || !b.dow) return NextResponse.json({ error: "name and dow required" }, { status: 400 });
  const max = await prisma.gymExercise.aggregate({ where: { userId, dow: b.dow }, _max: { order: true } });
  const ex = await prisma.gymExercise.create({
    data: {
      userId,
      dow: b.dow,
      name: b.name,
      sets: b.sets ?? 3,
      reps: b.reps ?? 8,
      weight: b.weight ?? 0,
      order: (max._max.order ?? -1) + 1,
    },
  });
  return NextResponse.json(ex);
}
