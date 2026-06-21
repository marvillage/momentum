import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { todayStr } from "@/lib/date";
import { apiUserId } from "@/lib/auth";

// Log (or clear) a metric's value for a day. One value per metric per day.
export async function POST(req: Request) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = await req.json();
  if (!b.metricId) return NextResponse.json({ error: "metricId required" }, { status: 400 });

  const metric = await prisma.metric.findUnique({ where: { id: b.metricId }, include: { activity: true } });
  if (!metric || metric.activity.userId !== userId) return NextResponse.json({ error: "not found" }, { status: 404 });

  const date: string = b.date || todayStr();
  const raw = b.value;

  if (raw === "" || raw === null || raw === undefined) {
    await prisma.metricEntry.deleteMany({ where: { metricId: metric.id, date } });
    return NextResponse.json({ ok: true, value: null });
  }
  const value = Number(raw);
  if (Number.isNaN(value)) return NextResponse.json({ error: "value must be a number" }, { status: 400 });

  const existing = await prisma.metricEntry.findFirst({ where: { metricId: metric.id, date } });
  const entry = existing
    ? await prisma.metricEntry.update({ where: { id: existing.id }, data: { value } })
    : await prisma.metricEntry.create({ data: { userId, metricId: metric.id, date, value } });
  return NextResponse.json({ ok: true, value: entry.value });
}
