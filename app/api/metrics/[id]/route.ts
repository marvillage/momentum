import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiUserId } from "@/lib/auth";

async function own(id: string, userId: string) {
  const m = await prisma.metric.findUnique({ where: { id }, include: { activity: true } });
  return m && m.activity.userId === userId ? m : null;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!(await own(id, userId))) return NextResponse.json({ error: "not found" }, { status: 404 });
  const b = await req.json();
  const data: Record<string, unknown> = {};
  if (typeof b.label === "string" && b.label.trim()) data.label = b.label.trim();
  if ("unit" in b) data.unit = b.unit?.trim() || null;
  if (b.kind) data.kind = b.kind;
  const m = await prisma.metric.update({ where: { id }, data });
  return NextResponse.json(m);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!(await own(id, userId))) return NextResponse.json({ error: "not found" }, { status: 404 });
  await prisma.metric.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
