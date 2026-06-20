import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiUserId } from "@/lib/auth";

const EDITABLE = ["name", "icon", "kind", "sortOrder"];

async function own(id: string, userId: string) {
  const g = await prisma.group.findUnique({ where: { id } });
  return g && g.userId === userId ? g : null;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!(await own(id, userId))) return NextResponse.json({ error: "not found" }, { status: 404 });
  const body = await req.json();
  const data: Record<string, unknown> = {};
  for (const k of EDITABLE) if (k in body) data[k] = body[k];
  const g = await prisma.group.update({ where: { id }, data });
  return NextResponse.json(g);
}

// Delete a group but keep its activities (Activity.group is onDelete: SetNull).
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!(await own(id, userId))) return NextResponse.json({ error: "not found" }, { status: 404 });
  await prisma.group.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
