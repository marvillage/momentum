import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiUserId } from "@/lib/auth";

async function own(id: string, userId: string) {
  const log = await prisma.foodLog.findUnique({ where: { id } });
  return log && log.userId === userId ? log : null;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!(await own(id, userId))) return NextResponse.json({ error: "not found" }, { status: 404 });
  const b = await req.json();
  const data: { name?: string; bucket?: string; protein?: number; carbs?: number; kcal?: number } = {};
  if (typeof b.name === "string" && b.name.trim()) data.name = b.name.trim();
  if (b.bucket) data.bucket = String(b.bucket);
  if (b.protein != null) data.protein = Math.max(0, Math.round(Number(b.protein) || 0));
  if (b.carbs != null) data.carbs = Math.max(0, Math.round(Number(b.carbs) || 0));
  if (b.kcal != null) data.kcal = Math.max(0, Math.round(Number(b.kcal) || 0));
  const log = await prisma.foodLog.update({ where: { id }, data });
  return NextResponse.json(log);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!(await own(id, userId))) return NextResponse.json({ error: "not found" }, { status: 404 });
  await prisma.foodLog.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
