import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiUserId } from "@/lib/auth";

export async function PATCH(req: Request) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = await req.json();

  if (typeof b.name === "string") {
    await prisma.user.update({ where: { id: userId }, data: { name: b.name.trim() || null } });
  }
  const reminders: { morningPush?: string; eveningPush?: string } = {};
  if (b.morningPush) reminders.morningPush = String(b.morningPush);
  if (b.eveningPush) reminders.eveningPush = String(b.eveningPush);
  if (Object.keys(reminders).length) {
    await prisma.settings.upsert({ where: { userId }, update: reminders, create: { userId, ...reminders } });
  }
  return NextResponse.json({ ok: true });
}
