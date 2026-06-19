import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseItems } from "@/lib/slug";

export async function POST(req: Request) {
  const { activityId, text, mode } = await req.json();
  if (!activityId || !text) return NextResponse.json({ error: "activityId and text required" }, { status: 400 });

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
