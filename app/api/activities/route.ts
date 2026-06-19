import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slug";

export async function GET() {
  const acts = await prisma.activity.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(acts);
}

export async function POST(req: Request) {
  const body = await req.json();
  const name: string = (body.name || "").trim();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const base = slugify(name) || "habit";
  let slug = base;
  let i = 1;
  while (await prisma.activity.findUnique({ where: { slug } })) slug = `${base}-${i++}`;

  const max = await prisma.activity.aggregate({ _max: { sortOrder: true } });

  const a = await prisma.activity.create({
    data: {
      slug,
      name,
      area: body.area || "HABIT",
      cadence: body.cadence || "DAILY",
      targetCount: body.targetCount ?? 1,
      minCount: body.minCount ?? null,
      unit: body.unit ?? null,
      daysOfWeek: body.daysOfWeek ?? null,
      sortOrder: (max._max.sortOrder ?? 0) + 1,
    },
  });
  return NextResponse.json(a);
}
