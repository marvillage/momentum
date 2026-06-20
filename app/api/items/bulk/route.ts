import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseItems } from "@/lib/slug";
import { apiUserId } from "@/lib/auth";

export async function POST(req: Request) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { activityId, text, mode } = await req.json();
  if (!activityId || !text) return NextResponse.json({ error: "activityId and text required" }, { status: 400 });

  const act = await prisma.activity.findUnique({ where: { id: activityId } });
  if (!act || act.userId !== userId) return NextResponse.json({ error: "not found" }, { status: 404 });

  const parsed = parseItems(text);
  if (parsed.length === 0) return NextResponse.json({ error: "no items found" }, { status: 400 });

  if (mode === "replace") {
    await prisma.item.deleteMany({ where: { activityId } });
  }
  const max = await prisma.item.aggregate({ where: { activityId }, _max: { order: true } });
  let order = (max._max.order ?? -1) + 1;

  await prisma.item.createMany({
    data: parsed.map((p) => ({ activityId, title: p.title, url: p.url, order: order++ })),
  });

  return NextResponse.json({ added: parsed.length });
}
