import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiUserId } from "@/lib/auth";

const EDITABLE = [
  "name", "area", "type", "icon", "link", "groupId", "cadence", "daysOfWeek", "everyNDays",
  "durationMin", "targetCount", "minCount", "weeklyTarget", "unit", "active", "rollover", "sortOrder",
];

async function own(id: string, userId: string) {
  const a = await prisma.activity.findUnique({ where: { id } });
  return a && a.userId === userId ? a : null;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!(await own(id, userId))) return NextResponse.json({ error: "not found" }, { status: 404 });
  const a = await prisma.activity.findUnique({ where: { id }, include: { items: { orderBy: { order: "asc" } } } });
  return NextResponse.json(a);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!(await own(id, userId))) return NextResponse.json({ error: "not found" }, { status: 404 });
  const body = await req.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {};
  for (const k of EDITABLE) if (k in body) data[k] = body[k];
  const a = await prisma.activity.update({ where: { id }, data });
  return NextResponse.json(a);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!(await own(id, userId))) return NextResponse.json({ error: "not found" }, { status: 404 });
  await prisma.activity.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
