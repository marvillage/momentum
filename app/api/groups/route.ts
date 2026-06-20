import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { apiUserId } from "@/lib/auth";

export async function GET() {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const groups = await prisma.group.findMany({
    where: { userId },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { activities: true } } },
  });
  return NextResponse.json(groups);
}

export async function POST(req: Request) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const name: string = (body.name || "").trim();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const base = slugify(name) || "group";
  let slug = base;
  let i = 1;
  while (await prisma.group.findFirst({ where: { userId, slug } })) slug = `${base}-${i++}`;

  const max = await prisma.group.aggregate({ where: { userId }, _max: { sortOrder: true } });
  const g = await prisma.group.create({
    data: {
      userId,
      name,
      slug,
      icon: body.icon ?? null,
      kind: body.kind === "GYM" ? "GYM" : "NORMAL",
      sortOrder: (max._max.sortOrder ?? 0) + 1,
    },
  });
  return NextResponse.json(g);
}
