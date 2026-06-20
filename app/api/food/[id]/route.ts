import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiUserId } from "@/lib/auth";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const log = await prisma.foodLog.findUnique({ where: { id } });
  if (!log || log.userId !== userId) return NextResponse.json({ error: "not found" }, { status: 404 });
  await prisma.foodLog.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
