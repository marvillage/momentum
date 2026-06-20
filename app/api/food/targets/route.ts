import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiUserId } from "@/lib/auth";

export async function PATCH(req: Request) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = await req.json();
  const data: { kcalTarget?: number; proteinTarget?: number; carbsTarget?: number; waterTargetMl?: number } = {};
  if (b.kcalTarget != null) data.kcalTarget = Math.max(0, Math.round(Number(b.kcalTarget)));
  if (b.proteinTarget != null) data.proteinTarget = Math.max(0, Math.round(Number(b.proteinTarget)));
  if (b.carbsTarget != null) data.carbsTarget = Math.max(0, Math.round(Number(b.carbsTarget)));
  if (b.waterTargetMl != null) data.waterTargetMl = Math.max(0, Math.round(Number(b.waterTargetMl)));
  const s = await prisma.settings.upsert({ where: { userId }, update: data, create: { userId, ...data } });
  return NextResponse.json(s);
}
