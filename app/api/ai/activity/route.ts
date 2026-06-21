import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiUserId } from "@/lib/auth";
import { aiEnabled, parseActivitySpec } from "@/lib/llm";
import { allow } from "@/lib/ratelimit";

export async function POST(req: Request) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!aiEnabled()) return NextResponse.json({ error: "AI isn't configured (no GEMINI_API_KEY)." }, { status: 400 });
  if (!allow(`ai:${userId}`, 12, 60_000)) return NextResponse.json({ error: "Slow down a moment — too many AI requests." }, { status: 429 });

  const { prompt } = await req.json();
  if (!prompt || !String(prompt).trim()) return NextResponse.json({ error: "Describe the activity first." }, { status: 400 });

  const groups = await prisma.group.findMany({ where: { userId, kind: "NORMAL" }, select: { name: true } });
  try {
    const spec = await parseActivitySpec(String(prompt).trim(), groups.map((g) => g.name));
    return NextResponse.json({ spec });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
