import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiUserId } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import { getTrack } from "@/lib/tracks";
import type { ActivitySpec } from "@/lib/llm";

async function uniqueSlug(userId: string, base: string, table: "activity" | "group") {
  let slug = base || (table === "group" ? "group" : "habit");
  let i = 1;
  const exists = async (s: string) =>
    table === "activity"
      ? !!(await prisma.activity.findFirst({ where: { userId, slug: s } }))
      : !!(await prisma.group.findFirst({ where: { userId, slug: s } }));
  const root = slug;
  while (await exists(slug)) slug = `${root}-${i++}`;
  return slug;
}

export async function POST(req: Request) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const spec = (await req.json())?.spec as ActivitySpec;
  if (!spec?.name) return NextResponse.json({ error: "invalid spec" }, { status: 400 });

  // Resolve or create the group.
  let groupId: string | null = null;
  const gname = (spec.group || "").trim();
  if (gname) {
    const found = await prisma.group.findFirst({ where: { userId, name: { equals: gname, mode: "insensitive" } } });
    if (found) groupId = found.id;
    else {
      const max = await prisma.group.aggregate({ where: { userId }, _max: { sortOrder: true } });
      const g = await prisma.group.create({
        data: { userId, name: gname, slug: await uniqueSlug(userId, slugify(gname), "group"), sortOrder: (max._max.sortOrder ?? 0) + 1 },
      });
      groupId = g.id;
    }
  }

  // Create the activity.
  const maxA = await prisma.activity.aggregate({ where: { userId }, _max: { sortOrder: true } });
  const activity = await prisma.activity.create({
    data: {
      userId,
      slug: await uniqueSlug(userId, slugify(spec.name), "activity"),
      name: spec.name.trim(),
      area: spec.area || "HABIT",
      type: spec.type || "SIMPLE",
      icon: spec.icon || null,
      groupId,
      cadence: spec.cadence || "DAILY",
      daysOfWeek: spec.cadence === "DAYS" && spec.daysOfWeek?.length ? spec.daysOfWeek.sort((a, b) => a - b).join(",") : null,
      everyNDays: spec.cadence === "EVERY_N" ? spec.everyNDays || 2 : null,
      targetCount: Math.max(1, spec.targetCount || 1),
      weeklyTarget: spec.type === "WEEKLY" ? Math.max(1, spec.targetCount || 1) : null,
      unit: spec.unit?.trim() || null,
      sortOrder: (maxA._max.sortOrder ?? 0) + 1,
    },
  });

  // Load a coding track if specified.
  if (spec.contentType === "LEETCODE" && spec.leetcodeTrack && spec.leetcodeTrack !== "none") {
    const track = getTrack(spec.leetcodeTrack);
    if (track) {
      await prisma.item.createMany({ data: track.items.map((it, idx) => ({ activityId: activity.id, title: it.title, url: it.url, order: idx })) });
    }
  }

  // Create custom metrics.
  if (Array.isArray(spec.metrics) && spec.metrics.length) {
    await prisma.metric.createMany({
      data: spec.metrics.slice(0, 4).map((m, idx) => ({
        activityId: activity.id,
        key: slugify(m.label) || `metric-${idx}`,
        label: m.label,
        unit: m.unit?.trim() || null,
        kind: m.kind || "NUMBER",
        sortOrder: idx,
      })),
    });
  }

  return NextResponse.json({ id: activity.id, needsYoutube: spec.contentType === "YOUTUBE" });
}
