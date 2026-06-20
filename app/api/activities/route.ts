import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { getTrack } from "@/lib/tracks";
import { apiUserId } from "@/lib/auth";

export async function GET() {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const acts = await prisma.activity.findMany({ where: { userId }, orderBy: { sortOrder: "asc" } });
  return NextResponse.json(acts);
}

export async function POST(req: Request) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const name: string = (body.name || "").trim();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const base = slugify(name) || "habit";
  let slug = base;
  let i = 1;
  while (await prisma.activity.findFirst({ where: { userId, slug } })) slug = `${base}-${i++}`;

  const max = await prisma.activity.aggregate({ where: { userId }, _max: { sortOrder: true } });

  const a = await prisma.activity.create({
    data: {
      userId,
      slug,
      name,
      area: body.area || "HABIT",
      type: body.type || "SIMPLE",
      icon: body.icon ?? null,
      link: body.link ?? null,
      groupId: body.groupId ?? null,
      cadence: body.cadence || "DAILY",
      daysOfWeek: body.daysOfWeek ?? null,
      everyNDays: body.everyNDays ?? null,
      durationMin: body.durationMin ?? null,
      targetCount: body.targetCount ?? 1,
      minCount: body.minCount ?? null,
      weeklyTarget: body.weeklyTarget ?? null,
      unit: body.unit ?? null,
      sortOrder: (max._max.sortOrder ?? 0) + 1,
    },
  });

  // Auto-load a curated track's content as this activity's queue.
  if (body.track) {
    const track = getTrack(body.track);
    if (track) {
      await prisma.item.createMany({
        data: track.items.map((it, idx) => ({ activityId: a.id, title: it.title, url: it.url, order: idx })),
      });
    }
  }

  return NextResponse.json(a);
}
