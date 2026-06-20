import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiUserId } from "@/lib/auth";

async function own(id: string, userId: string) {
  const item = await prisma.item.findUnique({ where: { id }, include: { activity: true } });
  return item && item.activity.userId === userId ? item : null;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!(await own(id, userId))) return NextResponse.json({ error: "not found" }, { status: 404 });
  const b = await req.json();
  const data: { title?: string; url?: string | null; done?: boolean } = {};
  if (typeof b.title === "string" && b.title.trim()) data.title = b.title.trim();
  if ("url" in b) data.url = b.url ? String(b.url).trim() : null;
  if (typeof b.done === "boolean") data.done = b.done;
  const item = await prisma.item.update({ where: { id }, data });
  return NextResponse.json(item);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!(await own(id, userId))) return NextResponse.json({ error: "not found" }, { status: 404 });
  await prisma.item.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
