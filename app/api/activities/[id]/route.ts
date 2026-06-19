import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const EDITABLE = [
  "name",
  "area",
  "cadence",
  "daysOfWeek",
  "targetCount",
  "minCount",
  "weeklyTarget",
  "unit",
  "active",
  "sortOrder",
];

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await prisma.activity.findUnique({
    where: { id },
    include: { items: { orderBy: { order: "asc" } } },
  });
  if (!a) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(a);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {};
  for (const k of EDITABLE) if (k in body) data[k] = body[k];
  const a = await prisma.activity.update({ where: { id }, data });
  return NextResponse.json(a);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.activity.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
