import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiUserId } from "@/lib/auth";

export async function POST(req: Request) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { issueKey, note } = await req.json();
  if (!issueKey) return NextResponse.json({ error: "issueKey required" }, { status: 400 });

  const text = String(note || "").trim();
  if (!text) {
    await prisma.jiraNote.deleteMany({ where: { userId, issueKey } });
    return NextResponse.json({ ok: true, note: "" });
  }
  await prisma.jiraNote.upsert({
    where: { userId_issueKey: { userId, issueKey } },
    update: { note: text },
    create: { userId, issueKey, note: text },
  });
  return NextResponse.json({ ok: true, note: text });
}
