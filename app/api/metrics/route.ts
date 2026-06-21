import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { apiUserId } from "@/lib/auth";

export async function POST(req: Request) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = await req.json();
  const label: string = (b.label || "").trim();
  if (!b.activityId || !label) return NextResponse.json({ error: "activityId and label required" }, { status: 400 });

  const act = await prisma.activity.findUnique({ where: { id: b.activityId } });
  if (!act || act.userId !== userId) return NextResponse.json({ error: "not found" }, { status: 404 });

  const max = await prisma.metric.aggregate({ where: { activityId: act.id }, _max: { sortOrder: true } });
  const m = await prisma.metric.create({
    data: {
      activityId: act.id,
      key: slugify(label) || "metric",
      label,
      unit: b.unit?.trim() || null,
      kind: b.kind || "NUMBER",
      sortOrder: (max._max.sortOrder ?? -1) + 1,
    },
  });
  return NextResponse.json(m);
}
