import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiUserId } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/crypto-auth";

export async function POST(req: Request) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { current, next } = await req.json();
  if (!next || String(next).length < 6) return NextResponse.json({ error: "New password must be 6+ characters." }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !verifyPassword(String(current || ""), user.passwordHash)) {
    return NextResponse.json({ error: "Current password is wrong." }, { status: 400 });
  }
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: hashPassword(String(next)) } });
  return NextResponse.json({ ok: true });
}
