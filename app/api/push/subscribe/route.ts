import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiUserId } from "@/lib/auth";

export async function POST(req: Request) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sub = await req.json();
  const endpoint = sub?.endpoint;
  const p256dh = sub?.keys?.p256dh;
  const auth = sub?.keys?.auth;
  if (!endpoint || !p256dh || !auth) return NextResponse.json({ error: "invalid subscription" }, { status: 400 });

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { userId, p256dh, auth },
    create: { userId, endpoint, p256dh, auth },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { endpoint } = await req.json().catch(() => ({}));
  if (endpoint) await prisma.pushSubscription.deleteMany({ where: { userId, endpoint } });
  return NextResponse.json({ ok: true });
}
