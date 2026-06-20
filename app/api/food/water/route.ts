import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { todayStr } from "@/lib/date";
import { apiUserId } from "@/lib/auth";

export async function POST(req: Request) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const ml = Math.round(Number(b.ml) || 250); // default ~one glass
  const date: string = b.date || todayStr();

  if (ml < 0) {
    // undo: remove the most recent entry today
    const last = await prisma.waterLog.findFirst({ where: { userId, date }, orderBy: { createdAt: "desc" } });
    if (last) await prisma.waterLog.delete({ where: { id: last.id } });
    return NextResponse.json({ ok: true });
  }

  const w = await prisma.waterLog.create({ data: { userId, date, ml } });
  return NextResponse.json(w);
}
