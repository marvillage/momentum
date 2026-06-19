import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const EDITABLE = ["name", "sets", "reps", "weight", "order", "dow"];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {};
  for (const k of EDITABLE) if (k in body) data[k] = body[k];
  const ex = await prisma.gymExercise.update({ where: { id }, data });
  return NextResponse.json(ex);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.gymExercise.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
